import { useState, useRef, useMemo, useEffect, type ChangeEvent } from "react";
import { motion } from "motion/react";
import {
  Bell, BookOpen, User, LayoutDashboard, Search, Check, Download,
  CheckCircle, LogOut, CreditCard, Smartphone, Camera, X,
  Shield, Clock, BookMarked, FileText, ChevronRight, Wallet,
  Settings, RefreshCw, Library, QrCode, Upload,
  Trash2, Pencil, Eye, Info, AlertTriangle, XCircle,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "./components/ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "register" | "dashboard" | "browse" | "requests" | "account";
type RegStep = 1 | 2 | 3;

type RequestChallan = {
  id: string;
  orderNo: string;
  challanNo: string;
  date: string;
  student: {
    name: string;
    course: string;
    college: string;
    phone: string;
    studentId: string;
  };
  status: string;
  deposit: string;
  refund: string;
  libraryBooks: Array<{ title: string; author: string; notes?: string }>;
  specialRequests: Array<{ title: string; author: string; edition: string; publisher: string; notes: string; imageName: string | null }>;
};

type RequestItem = {
  id: string;
  requestId: string;
  date: string;
  type: "Book Request";
  status: "Pending" | "Approved" | "Returned" | "Rejected" | "Procured";
  books: string[];
  challan: RequestChallan | null;
};

type NotificationType = "info" | "success" | "warning" | "error" | "processing";

type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  requestId: string | null;
  status: string;
  timestamp: string;
  unread: boolean;
  actionLabel?: string;
  actionType?: "view-challan";
};

const NOTIFICATION_META: Record<NotificationType, { icon: React.ReactNode; accent: string; badge: string }> = {
  info: { icon: <Info className="w-4 h-4" />, accent: "text-sky-600 bg-sky-50 border-sky-100", badge: "text-sky-700 bg-sky-100 border-sky-200" },
  success: { icon: <CheckCircle className="w-4 h-4" />, accent: "text-emerald-600 bg-emerald-50 border-emerald-100", badge: "text-emerald-700 bg-emerald-100 border-emerald-200" },
  warning: { icon: <AlertTriangle className="w-4 h-4" />, accent: "text-amber-600 bg-amber-50 border-amber-100", badge: "text-amber-700 bg-amber-100 border-amber-200" },
  error: { icon: <XCircle className="w-4 h-4" />, accent: "text-red-600 bg-red-50 border-red-100", badge: "text-red-700 bg-red-100 border-red-200" },
  processing: { icon: <RefreshCw className="w-4 h-4 animate-spin" />, accent: "text-violet-600 bg-violet-50 border-violet-100", badge: "text-violet-700 bg-violet-100 border-violet-200" },
};

function formatUnreadCount(count: number) {
  if (count > 99) return "99+";
  return String(count);
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-1 inline-flex min-w-[1.35rem] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
      {formatUnreadCount(count)}
    </span>
  );
}

function NotificationEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[26px] border border-slate-200 bg-white/90 p-12 text-center shadow-sm shadow-slate-100">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-blue-600 shadow-inner">
        <Bell className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-extrabold text-slate-800">No Notifications Yet</h3>
        <p className="text-sm text-slate-500 max-w-xs">
          We'll notify you whenever there's an update on your book requests.
        </p>
      </div>
    </div>
  );
}

function NotificationCard({
  notification,
  onView,
  onMarkRead,
  onDelete,
}: {
  notification: NotificationItem;
  onView: (item: NotificationItem) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = NOTIFICATION_META[notification.type];
  return (
    <div className={`group rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl border ${meta.accent}`}>
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="truncate text-sm font-bold text-slate-900">{notification.title}</h4>
              <p className="mt-1 text-sm text-slate-500">{notification.description}</p>
            </div>
            {notification.unread && <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            {notification.requestId && <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold">{notification.requestId}</span>}
            <span className={
              `rounded-full border px-2.5 py-1 font-semibold ${meta.badge}`
            }>{notification.status}</span>
            <span>{notification.timestamp}</span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {notification.actionType === "view-challan" && (
          <button
            onClick={() => onView(notification)}
            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
          >
            {notification.actionLabel ?? "View Challan"}
          </button>
        )}
        <button
          onClick={() => onMarkRead(notification.id)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
        >
          Mark as Read
        </button>
        <button
          onClick={() => onDelete(notification.id)}
          className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function NotificationDrawer({
  notifications,
  open,
  onClose,
  onViewNotification,
  onMarkRead,
  onDelete,
  onMarkAllRead,
  onClearAll,
}: {
  notifications: NotificationItem[];
  open: boolean;
  onClose: () => void;
  onViewNotification: (notification: NotificationItem) => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
      <div className={`absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, x: 80 }}
        animate={{ opacity: open ? 1 : 0, x: open ? 0 : 80 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-slate-50 shadow-2xl border-l border-slate-200 overflow-y-auto"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Notifications</h2>
              <p className="text-sm text-slate-500">Updates about your borrowing requests and challans.</p>
            </div>
            <button onClick={onClose} className="rounded-full border border-slate-200 bg-slate-100 p-2 text-slate-600 hover:bg-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{notifications.filter((item) => item.unread).length} unread</span>
              <span className="text-sm text-slate-500">{notifications.length} total</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={onMarkAllRead} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100">
                Mark all as read
              </button>
              <button onClick={onClearAll} className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100">
                Clear all
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {notifications.length === 0 ? (
              <NotificationEmptyState />
            ) : (
              notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onView={(item) => onViewNotification(item)}
                  onMarkRead={onMarkRead}
                  onDelete={onDelete}
                />
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
const STUDENT = {
  name: "Rahul Sharma",
  id: "SVGA2024001",
  course: "B.Tech Computer Science",
  year: "3rd Year",
  college: "SVGA Engineering College",
  email: "rahul.sharma@svga.edu.in",
  mobile: "9876543210",
  aadhaar: "XXXX XXXX 4521",
  memberSince: "Jan 2024",
};

const BOOKS = [
  { id: "b1", title: "Engineering Mathematics", author: "B.S. Grewal", course: "B.Tech", subject: "Mathematics", available: 3 },
  { id: "b2", title: "Data Structures & Algorithms", author: "Ellis Horowitz", course: "B.Tech CS", subject: "Computer Science", available: 1 },
  { id: "b3", title: "Operating System Concepts", author: "Abraham Silberschatz", course: "B.Tech CS", subject: "Computer Science", available: 2 },
  { id: "b4", title: "Computer Networks", author: "Andrew S. Tanenbaum", course: "B.Tech CS", subject: "Computer Science", available: 0 },
  { id: "b5", title: "Database Management Systems", author: "Ramakrishnan & Gehrke", course: "B.Tech CS", subject: "Computer Science", available: 4 },
  { id: "b6", title: "Engineering Physics", author: "H.K. Malik", course: "B.Tech", subject: "Physics", available: 2 },
  { id: "b7", title: "Discrete Mathematics", author: "Kenneth H. Rosen", course: "B.Tech CS", subject: "Mathematics", available: 1 },
  { id: "b8", title: "Compiler Design", author: "Alfred V. Aho", course: "B.Tech CS", subject: "Computer Science", available: 3 },
];

const INITIAL_REQUESTS: RequestItem[] = [
  {
    id: "REQ-2024-001",
    requestId: "REQ-2024-001",
    date: "15 Jan 2024",
    type: "Book Request",
    status: "Approved",
    books: ["Engineering Mathematics", "Engineering Physics"],
    challan: null,
  },
  {
    id: "REQ-2024-002",
    requestId: "REQ-2024-002",
    date: "3 Feb 2024",
    type: "Book Request",
    status: "Pending",
    books: ["Advanced Algorithms"],
    challan: null,
  },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${compact ? "w-8 h-8" : "w-10 h-10"} rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 flex-shrink-0`}>
        <BookOpen className={`${compact ? "w-4 h-4" : "w-5 h-5"} text-white`} />
      </div>
      <div>
        <div className={`font-extrabold text-blue-700 leading-tight ${compact ? "text-sm" : "text-base"}`}>SVGA</div>
        <div className={`text-slate-400 font-semibold uppercase tracking-widest leading-tight ${compact ? "text-[8px]" : "text-[9px]"}`}>Book Bank</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Returned: "bg-slate-100 text-slate-600 border-slate-200",
    Rejected: "bg-red-50 text-red-600 border-red-200",
    Active: "bg-blue-50 text-blue-700 border-blue-200",
    Procured: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${styles[status] ?? "bg-slate-100 text-slate-500 border-slate-200"}`}>
      {status}
    </span>
  );
}

function QRBlock({ size = 120 }: { size?: number }) {
  const cells = useMemo(() => {
    return Array.from({ length: 21 * 21 }, (_, i) => {
      const r = Math.floor(i / 21);
      const c = i % 21;
      if (r < 7 && c < 7) {
        if (r === 0 || r === 6 || c === 0 || c === 6) return 1;
        if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return 1;
        return 0;
      }
      if (r < 7 && c > 13) {
        const cc = c - 14;
        if (r === 0 || r === 6 || cc === 0 || cc === 6) return 1;
        if (r >= 2 && r <= 4 && cc >= 2 && cc <= 4) return 1;
        return 0;
      }
      if (r > 13 && c < 7) {
        const rr = r - 14;
        if (rr === 0 || rr === 6 || c === 0 || c === 6) return 1;
        if (rr >= 2 && rr <= 4 && c >= 2 && c <= 4) return 1;
        return 0;
      }
      return ((i * 2654435761) >>> 0) % 3 === 0 ? 1 : 0;
    });
  }, []);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "grid",
        gridTemplateColumns: "repeat(21, 1fr)",
        padding: 6,
        backgroundColor: "#fff",
        borderRadius: 10,
      }}
    >
      {cells.map((cell, i) => (
        <div key={i} style={{ backgroundColor: cell ? "#1a1a2e" : "transparent" }} />
      ))}
    </div>
  );
}

function ChallanPreviewCard({ challan, course }: { challan: RequestChallan | null; course: string }) {
  if (!challan) return null;

  return (
    <div className="rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 shadow-lg shadow-blue-100">
      <div className="flex flex-col gap-6 border-b border-slate-200 pb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
            <BookOpen className="h-7 w-7" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-800">SVGA Book Bank</div>
            <div className="text-sm text-slate-500">Borrowing Challan</div>
          </div>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-700">
          <div><span className="font-semibold text-slate-700">Order No:</span> {challan.orderNo}</div>
          <div><span className="font-semibold text-slate-700">Challan No:</span> {challan.challanNo}</div>
          <div><span className="font-semibold text-slate-700">Date:</span> {challan.date}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold uppercase tracking-[0.2em] text-slate-500">Student Details</div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-700">
              {challan.status}
            </span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <div><span className="font-semibold text-slate-700">Name:</span> {challan.student.name}</div>
            <div><span className="font-semibold text-slate-700">Course:</span> {course}</div>
            <div><span className="font-semibold text-slate-700">College:</span> {challan.student.college}</div>
            <div><span className="font-semibold text-slate-700">Phone:</span> {challan.student.phone}</div>
            <div><span className="font-semibold text-slate-700">Student ID:</span> {challan.student.studentId}</div>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-600 p-5 text-white shadow-sm">
          <div className="text-sm font-extrabold uppercase tracking-[0.2em] text-blue-100">Payment & Status</div>
          <div className="mt-4 space-y-2 text-sm">
            <div><span className="font-semibold text-blue-100">Status:</span> {challan.status}</div>
            <div><span className="font-semibold text-blue-100">Deposit:</span> {challan.deposit}</div>
            <div><span className="font-semibold text-blue-100">Refund:</span> {challan.refund}</div>
          </div>
          <div className="mt-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/15">
            <QRBlock size={84} />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-slate-800">Library Books</div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
              {challan.libraryBooks.length} items
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {challan.libraryBooks.length > 0 ? challan.libraryBooks.map((book, index) => (
              <div key={`${book.title}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <div className="font-semibold">{index + 1}. {book.title}</div>
                <div className="mt-1 text-xs text-slate-400">{book.author}</div>
              </div>
            )) : <div className="text-sm text-slate-400">No library books selected.</div>}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-extrabold text-slate-800">Special Request Books</div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
              {challan.specialRequests.length} requests
            </span>
          </div>
          <div className="mt-4 space-y-2">
            {challan.specialRequests.length > 0 ? challan.specialRequests.map((request, index) => (
              <div key={`${request.title}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <div className="font-semibold">{index + 1}. {request.title}</div>
                <div className="mt-1 text-xs text-slate-400">{request.author}</div>
              </div>
            )) : <div className="text-sm text-slate-400">No special requests added.</div>}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <div className="font-bold text-slate-800">Signature</div>
          <div className="mt-3 h-12 border-b border-slate-300" />
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <div className="font-bold text-slate-800">Refund Clause</div>
          <div className="mt-2 text-xs leading-5">Books must be returned on or before the due date. Security deposit will be refunded after successful return and clearance.</div>
        </div>
      </div>
    </div>
  );
}

function StepBar({ step, labels }: { step: RegStep; labels: string[] }) {
  return (
    <div className="flex items-start justify-center gap-0 mb-8">
      {labels.map((label, i) => (
        <div key={label} className="flex items-start">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                i + 1 < step
                  ? "bg-blue-600 border-blue-600 text-white"
                  : i + 1 === step
                  ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              {i + 1 < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span
              className={`mt-2 text-[11px] font-semibold whitespace-nowrap ${
                i + 1 === step ? "text-blue-600" : i + 1 < step ? "text-blue-400" : "text-slate-400"
              }`}
            >
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div
              className={`w-20 h-0.5 mt-[18px] mx-1 transition-all duration-300 ${
                i + 1 < step ? "bg-blue-500" : "bg-slate-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function NavBar({ active, onNav, unreadCount, onToggleNotifications }: { active: Screen; onNav: (s: Screen) => void; unreadCount: number; onToggleNotifications: () => void }) {
  const links: { key: Screen; label: string; icon: React.ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: "browse", label: "Browse Books", icon: <BookOpen className="w-4 h-4" /> },
    { key: "requests", label: "My Requests", icon: <FileText className="w-4 h-4" /> },
    { key: "account", label: "Account", icon: <User className="w-4 h-4" /> },
  ];
  return (
    <nav className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/70 shadow-[0_10px_35px_rgba(15,23,42,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex flex-1 items-center justify-start">
          <Logo compact />
        </div>
        <div className="hidden flex-1 items-center justify-center md:flex">
          <div className="flex items-center justify-center gap-1.5 rounded-full border border-white/70 bg-white/70 p-1 shadow-[0_6px_18px_rgba(15,23,42,0.04)] backdrop-blur-[8px]">
            {links.map((l) => {
              const isActive = active === l.key;
              return (
                <motion.button
                  key={l.key}
                  layout
                  onClick={() => onNav(l.key)}
                  whileHover={{ scale: 1.01, y: -0.5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  animate={{
                    opacity: isActive ? 1 : 0.96,
                    backgroundColor: isActive ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.28)",
                    boxShadow: isActive ? "0 6px 14px rgba(59,130,246,0.08)" : "0 0 0 rgba(0,0,0,0)",
                    y: isActive ? -0.5 : 0,
                    scale: isActive ? 1 : 0.99,
                  }}
                  className={`group relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-semibold transition-[background-color,transform,box-shadow,opacity] duration-200 ${
                    isActive
                      ? "border-blue-100/80 text-blue-700 backdrop-blur-[8px]"
                      : "border-transparent text-slate-500 hover:border-white/70 hover:bg-white/70 hover:text-slate-800"
                  }`}
                >
                  <span className="transition-transform duration-200 group-hover:scale-105">{l.icon}</span>
                  {l.label}
                </motion.button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          <button
            onClick={onToggleNotifications}
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <Bell className="h-5 w-5" />
            <NotificationBadge count={unreadCount} />
            <span className="absolute inset-0 rounded-2xl bg-blue-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
          <div className="hidden sm:block text-right">
            <div className="text-sm font-bold leading-tight text-slate-800">{STUDENT.name}</div>
            <div className="text-[11px] font-medium text-slate-400">{STUDENT.id}</div>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
            <User className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      </div>
      {/* Mobile tab row */}
      <div className="flex border-t border-blue-50 px-1 py-0.5 md:hidden">
        {links.map((l) => (
          <button
            key={l.key}
            onClick={() => onNav(l.key)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-semibold transition-colors ${
              active === l.key ? "text-blue-600" : "text-slate-400"
            }`}
          >
            {l.icon}
            {l.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── Screen 2–4: Registration ─────────────────────────────────────────────────
function RegistrationScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<RegStep>(1);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50/60 to-indigo-50 px-4 py-8">
      {showPayment && (
        <PaymentModal
          onSuccess={() => {
            setShowPayment(false);
            setShowSuccess(true);
          }}
          onClose={() => setShowPayment(false)}
        />
      )}
      {showSuccess && (
        <SuccessModal
          onContinue={() => {
            setShowSuccess(false);
            setShowPayment(false);
            onComplete();
          }}
        />
      )}

      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center mb-6">
          <Logo />
          <h1 className="text-2xl font-extrabold text-slate-800 mt-4 tracking-tight">Student Registration</h1>
          <p className="text-slate-400 text-sm mt-1">Complete your profile to access the book bank</p>
        </div>

        <StepBar step={step} labels={["Personal Details", "Academic Info", "Profile Photo"]} />

        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-xl shadow-blue-100/60 border border-blue-50 p-8"
        >
          {step === 1 && <PersonalForm />}
          {step === 2 && <AcademicForm />}
          {step === 3 && <PhotoForm preview={photoPreview} onChange={handleFile} />}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => (s - 1) as RegStep)}
                className="flex-1 py-3 border-2 border-blue-200 text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all"
              >
                ← Back
              </button>
            )}
            <button
              onClick={() => {
                if (step < 3) setStep((s) => (s + 1) as RegStep);
                else setShowPayment(true);
              }}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
            >
              {step < 3 ? "Continue →" : "Proceed to Payment"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FieldInput({
  label,
  placeholder,
  type = "text",
  options,
  span,
  value,
  onChange,
  readOnly = false,
  disabled = false,
  required = true,
  inputMode,
  maxLength,
  pattern,
  defaultValue,
}: {
  label: string;
  placeholder: string;
  type?: string;
  options?: string[];
  span?: number;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  readOnly?: boolean;
  disabled?: boolean;
  required?: boolean;
  inputMode?: string;
  maxLength?: number;
  pattern?: string;
  defaultValue?: string;
}) {
  const cls = "w-full min-h-[52px] px-4 py-3 bg-blue-50/60 border border-blue-100 rounded-[18px] text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-transparent transition-all duration-250 text-sm disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed disabled:border-slate-200";
  return (
    <div className={span === 2 ? "sm:col-span-2" : ""}>
      <label className="block text-sm font-bold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-blue-300 font-normal"> *</span>}
      </label>
      {type === "select" ? (
        <div className="relative">
          <Select
            value={value ?? ""}
            onValueChange={(nextValue) =>
              onChange?.({ target: { value: nextValue } } as unknown as ChangeEvent<HTMLSelectElement>)
            }
            disabled={disabled}
          >
            <SelectTrigger className={`${cls} pr-10`} size="default">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-y-auto">
              {options?.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : type === "textarea" ? (
        <textarea
          rows={3}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          disabled={disabled}
          defaultValue={defaultValue}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          disabled={disabled}
          inputMode={inputMode}
          maxLength={maxLength}
          pattern={pattern}
          defaultValue={defaultValue}
          className={cls}
        />
      )}
    </div>
  );
}

function PersonalForm() {
  const [surname, setSurname] = useState("");
  const [showSurnameOther, setShowSurnameOther] = useState(false);
  const [occupation, setOccupation] = useState("");
  const [showOccupationOther, setShowOccupationOther] = useState(false);
  const [manualSurname, setManualSurname] = useState("");
  const [manualOccupation, setManualOccupation] = useState("");
  const [nativeVillage, setNativeVillage] = useState("");
  const [parentsContact, setParentsContact] = useState("");
  const [currentResidence, setCurrentResidence] = useState("");

  const surnameOptions = ["Bauva", "Buricha", "Charla", "Chhadwa", "Chheda", "Dagha", "Dedhia", "Furiya", "Gada", "Gala", "Gindra", "Gogri", "Karia", "Khirani-Gala", "Khuthia", "Mamania", "Mota", "Nandu", "Nisar", "Rambhia", "Rita", "Satra", "Savla", "Shah", "Vadhan", "Visaria", "Vora", "Other"];
  const occupationOptions = ["Student", "Part-time Job", "Freelancer", "Business", "Service / Employment", "Other"];
  const villageOptions = ["Adhoi", "Bhachau", "Bharudia", "Gagodar", "Ghanithar", "Halra", "Kakrava", "Kharoi", "Lakadiya", "Manafra", "Nandasar", "N. Trambo", "Rav", "Samkhiyari", "Shivlakha", "Suvai", "Thoriyari", "Trambo", "Vanoi"];

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-800 mb-1">Personal Details</h2>
      <p className="text-slate-400 text-sm mb-6">Enter your details as per official documents</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldInput label="Email Address" placeholder="rahul.sharma@email.com" type="email" value={STUDENT.email} disabled readOnly span={2} />
        <FieldInput label="First Name" placeholder="Rahul" defaultValue="Rahul" />
        <FieldInput label="Surname" placeholder="Select surname" type="select" options={surnameOptions} value={surname} onChange={(e) => {
          const nextValue = e.target.value;
          setSurname(nextValue);
          setShowSurnameOther(nextValue === "Other");
          if (nextValue !== "Other") setManualSurname("");
        }} required={false} />
        {showSurnameOther && <FieldInput label="Enter Surname" placeholder="Enter your surname" value={manualSurname} onChange={(e) => setManualSurname(e.target.value)} required={showSurnameOther} span={2} />}
        <FieldInput label="Father's / Husband's Name" placeholder="Suresh Sharma" />
        <FieldInput label="Grandfather's Name" placeholder="Ram Sharma" />
        <FieldInput label="Official Surname (if different)" placeholder="Optional" span={2} />
        <FieldInput label="Aadhaar Number" placeholder="XXXX XXXX XXXX" value={STUDENT.aadhaar} disabled readOnly />
        <FieldInput label="Mobile Number" placeholder="9876543210" value={STUDENT.mobile} disabled readOnly />
        <FieldInput label="Date of Birth" placeholder="" type="date" />
        <FieldInput label="Gender" placeholder="Select gender" type="select" options={["Male", "Female", "Other", "Prefer not to say"]} />
        <FieldInput label="Occupation" placeholder="Select occupation" type="select" options={occupationOptions} value={occupation} onChange={(e) => {
          const nextValue = e.target.value;
          setOccupation(nextValue);
          setShowOccupationOther(nextValue === "Other");
          if (nextValue !== "Other") setManualOccupation("");
        }} />
        {showOccupationOther && <FieldInput label="Specify Occupation" placeholder="Enter your occupation" value={manualOccupation} onChange={(e) => setManualOccupation(e.target.value)} required={showOccupationOther} span={2} />}
        <FieldInput label="Native Place / Village" placeholder="Select village" type="select" options={villageOptions} value={nativeVillage} onChange={(e) => setNativeVillage(e.target.value)} />
        <FieldInput label="Parents Contact Number" placeholder="9876543210" type="tel" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" value={parentsContact} onChange={(e) => setParentsContact(e.target.value.replace(/\D/g, "").slice(0, 10))} />
        <FieldInput label="Where Do You Currently Live?" placeholder="Ghatkopar, Mumbai" value={currentResidence} onChange={(e) => setCurrentResidence(e.target.value)} />
      </div>
    </div>
  );
}

function AcademicForm() {
  const [course, setCourse] = useState("");
  const [showCourseOther, setShowCourseOther] = useState(false);
  const [manualCourse, setManualCourse] = useState("");

  const courseOptions = ["FYJC Science", "SYJC Science", "FYJC Commerce", "SYJC Commerce", "FYJC Arts", "SYJC Arts", "B.Com", "B.Sc", "BA", "BBA", "BCA", "MBBS", "BDS", "B.Pharm", "Engineering", "Diploma", "Other"];

  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-800 mb-1">Academic Information</h2>
      <p className="text-slate-400 text-sm mb-6">Enter your academic and institutional information</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FieldInput label="College / Institute" placeholder="SVGA Engineering College" span={2} />
        <FieldInput label="Course / Stream" placeholder="Select course or stream" type="select" options={courseOptions} value={course} onChange={(e) => {
          const nextValue = e.target.value;
          setCourse(nextValue);
          setShowCourseOther(nextValue === "Other");
          if (nextValue !== "Other") setManualCourse("");
        }} />
        {showCourseOther && <FieldInput label="Specify Course / Stream" placeholder="Enter your course or stream" value={manualCourse} onChange={(e) => setManualCourse(e.target.value)} required={showCourseOther} span={2} />}
        <FieldInput label="Education Specialization" placeholder="Computer Science & Engineering" />
        <FieldInput label="Academic Year" placeholder="Select year" type="select" options={["2023-24", "2024-25", "2025-26"]} />
      </div>
    </div>
  );
}

function PhotoForm({ preview, onChange }: { preview: string | null; onChange: (e: ChangeEvent<HTMLInputElement>) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-extrabold text-slate-800 mb-1 text-center">Profile Photo</h2>
      <p className="text-slate-400 text-sm mb-8 text-center">Upload a clear passport-size photo with a white background</p>

      <div className="relative mb-5">
        <div
          onClick={() => inputRef.current?.click()}
          className="w-40 h-40 rounded-full border-4 border-dashed border-blue-200 bg-blue-50 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-100/50 transition-all duration-200 overflow-hidden"
        >
          {preview ? (
            <img src={preview} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <>
              <Camera className="w-10 h-10 text-blue-300 mb-2" />
              <span className="text-xs text-blue-400 font-semibold">Click to upload</span>
            </>
          )}
        </div>
        {preview && (
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-1 right-1 w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />

      <button
        onClick={() => inputRef.current?.click()}
        className="px-7 py-2.5 border-2 border-blue-200 text-blue-700 font-bold rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all mb-7"
      >
        Choose Photo
      </button>

      <div className="bg-blue-50 rounded-2xl p-5 w-full">
        <p className="text-sm font-bold text-slate-700 mb-3">Photo Requirements</p>
        <div className="space-y-2">
          {[
            "Clear frontal face, no glasses or mask",
            "White or plain light background",
            "File size: maximum 2 MB",
            "Format: JPG or PNG only",
            "Recent photo taken within 6 months",
          ].map((r) => (
            <div key={r} className="flex items-start gap-2 text-sm text-slate-500">
              <Check className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
              {r}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────
function PaymentModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [method, setMethod] = useState<"card" | "upi" | "net">("card");
  const [selectedBank, setSelectedBank] = useState("");
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Wallet className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-800">Complete Payment</h2>
          <p className="text-slate-400 text-sm mt-1">One-time refundable security deposit</p>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-sky-500 rounded-2xl p-5 text-white text-center mb-5">
          <div className="text-4xl font-extrabold">₹500</div>
          <div className="text-blue-100 text-xs mt-1.5 flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> Fully refundable deposit
          </div>
        </div>

        <div className="flex gap-2 mb-5">
          {(
            [
              { key: "card" as const, label: "Card", icon: <CreditCard className="w-3.5 h-3.5" /> },
              { key: "upi" as const, label: "UPI", icon: <Smartphone className="w-3.5 h-3.5" /> },
              { key: "net" as const, label: "Net Banking", icon: <Library className="w-3.5 h-3.5" /> },
            ] as const
          ).map((m) => (
            <button
              key={m.key}
              onClick={() => setMethod(m.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                method === m.key
                  ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>

        {method === "card" && (
          <div className="space-y-3 mb-5">
            <input type="text" placeholder="Card Number" className="w-full px-4 py-3 bg-blue-50/60 border border-blue-100 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all text-sm" />
            <div className="flex gap-3">
              <input type="text" placeholder="MM / YY" className="flex-1 px-4 py-3 bg-blue-50/60 border border-blue-100 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all text-sm" />
              <input type="text" placeholder="CVV" className="w-24 px-4 py-3 bg-blue-50/60 border border-blue-100 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all text-sm" />
            </div>
            <input type="text" placeholder="Cardholder Name" className="w-full px-4 py-3 bg-blue-50/60 border border-blue-100 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all text-sm" />
          </div>
        )}
        {method === "upi" && (
          <div className="mb-5">
            <input type="text" placeholder="Enter UPI ID (e.g. rahul@okaxis)" className="w-full px-4 py-3 bg-blue-50/60 border border-blue-100 rounded-xl text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all text-sm" />
          </div>
        )}
        {method === "net" && (
          <div className="mb-5">
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger className="w-full rounded-[18px] border border-blue-100 bg-blue-50/60 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all text-sm" size="default">
                <SelectValue placeholder="Select your bank" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {["SBI", "HDFC Bank", "ICICI Bank", "Axis Bank", "PNB", "Bank of Baroda", "Canara Bank"].map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <button
          onClick={onSuccess}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
        >
          Pay ₹500 Securely
        </button>
        <p className="text-center text-[11px] text-slate-400 mt-3 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" /> Secured with 256-bit SSL encryption
        </p>
      </motion.div>
    </div>
  );
}

function SuccessModal({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 24 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
      >
        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Payment Successful!</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Your ₹500 deposit has been received. SVGA Book Bank membership is now active.
        </p>
        <div className="bg-emerald-50 rounded-2xl p-4 mb-6 text-left space-y-2.5 border border-emerald-100">
          {[
            { label: "Transaction ID", value: "TXN2024001342" },
            { label: "Amount Paid", value: "₹500" },
            { label: "Membership", value: "Active" },
            { label: "Valid Until", value: "Dec 2024" },
          ].map((r) => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-slate-500">{r.label}</span>
              <span className={`font-bold ${r.label === "Amount Paid" ? "text-emerald-600" : "text-slate-800"}`}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={onContinue}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
        >
          Go to Dashboard →
        </button>
      </motion.div>
    </div>
  );
}

// ─── Screen 7: Dashboard ──────────────────────────────────────────────────────
function DashboardScreen({ onNav, requests }: { onNav: (s: Screen) => void; requests: RequestItem[] }) {
  const stats = [
    { label: "Membership", value: "Active", icon: <Shield className="w-5 h-5" />, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { label: "Total Issued", value: "3", icon: <BookOpen className="w-5 h-5" />, color: "text-violet-600 bg-violet-50 border-violet-100" },
    { label: "Currently Held", value: "2", icon: <BookMarked className="w-5 h-5" />, color: "text-sky-600 bg-sky-50 border-sky-100" },
    { label: "Reservations", value: "1", icon: <Clock className="w-5 h-5" />, color: "text-amber-600 bg-amber-50 border-amber-100" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-400 rounded-3xl p-6 text-white relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
              ✓ Verified Member
            </span>
          </div>
          <h2 className="text-2xl font-extrabold mb-1">Welcome back, Rahul! 👋</h2>
          <p className="text-blue-100 text-sm leading-relaxed max-w-lg">
            Your SVGA Book Bank membership is active. Browse books, track requests, and manage your library account.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`bg-white rounded-2xl p-4 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-blue-50`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 border ${s.color}`}>
                  {s.icon}
                </div>
                <div className="text-2xl font-extrabold text-slate-800">{s.value}</div>
                <div className="text-xs text-slate-400 font-semibold mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Identity card */}
          <div className="bg-white rounded-3xl border border-blue-50 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <h3 className="font-extrabold text-slate-800">Student Identity</h3>
            </div>
            <div className="p-5 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-extrabold text-lg text-slate-800 leading-tight">{STUDENT.name}</div>
                <div className="text-sm text-slate-400 mt-0.5">{STUDENT.course} · {STUDENT.year}</div>
                <div className="text-sm text-slate-400">{STUDENT.college}</div>
                <div className="flex items-center gap-2 mt-2.5">
                  <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
                    {STUDENT.id}
                  </span>
                  <StatusBadge status="Active" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent challans */}
          <div className="bg-white rounded-3xl border border-blue-50 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800">Recent Challans</h3>
              <button onClick={() => onNav("requests")} className="text-blue-600 text-sm font-bold hover:text-blue-700 transition-colors">
                View all →
              </button>
            </div>
                <div className="divide-y divide-slate-50">
                {requests.slice(0, 3).map((r) => (
                  <div key={r.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div>
                      <div className="text-sm font-bold text-slate-800">{r.id}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{r.date} · {r.type}</div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          {/* Library QR card */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-5 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mb-1">Library Card</div>
                <div className="font-extrabold leading-tight">{STUDENT.name}</div>
                <div className="text-blue-200 text-xs mt-0.5">{STUDENT.id}</div>
              </div>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            <div className="flex justify-center my-4">
              <div className="bg-white rounded-2xl p-2 shadow-inner">
                <QRBlock size={110} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-blue-200">Since {STUDENT.memberSince}</div>
              <button className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors">
                <Download className="w-3 h-3" /> Download
              </button>
            </div>
          </div>

          {/* Membership status */}
          <div className="bg-white rounded-3xl border border-blue-50 shadow-sm p-5">
            <h3 className="font-extrabold text-slate-800 mb-4">Membership</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: "Status", value: "Active", badge: true },
                { label: "Deposit Paid", value: "₹500" },
                { label: "Member Since", value: STUDENT.memberSince },
                { label: "Verified", value: "✓ Aadhaar" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">{item.label}</span>
                  {item.badge ? <StatusBadge status={item.value} /> : <span className="font-bold text-slate-700 text-xs">{item.value}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-3xl border border-blue-50 shadow-sm p-5">
            <h3 className="font-extrabold text-slate-800 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: "Browse Books", icon: <BookOpen className="w-4 h-4" />, screen: "browse" as Screen },
                { label: "My Requests", icon: <FileText className="w-4 h-4" />, screen: "requests" as Screen },
                { label: "My Account", icon: <User className="w-4 h-4" />, screen: "account" as Screen },
              ].map((a) => (
                <button
                  key={a.label}
                  onClick={() => onNav(a.screen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-blue-50/70 hover:bg-blue-100/70 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-2.5 text-sm font-bold text-slate-700">
                    <span className="text-blue-500">{a.icon}</span>
                    {a.label}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 8: Browse Books ───────────────────────────────────────────────────
function BrowseBooks({ onRequestCreated }: { onRequestCreated: (request: RequestItem) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [course, setCourse] = useState("");
  const [stream, setStream] = useState("");
  const [bookSearch, setBookSearch] = useState("");
  const [selectedLibraryBooks, setSelectedLibraryBooks] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState<Array<{
    id: string;
    title: string;
    author: string;
    edition: string;
    publisher: string;
    notes: string;
    imageName: string | null;
  }>>([]);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [previewRequestId, setPreviewRequestId] = useState<string | null>(null);
  const [challanGenerated, setChallanGenerated] = useState(false);
  const [generatedChallan, setGeneratedChallan] = useState<RequestChallan | null>(null);
  const [requestForm, setRequestForm] = useState({
    title: "",
    author: "",
    edition: "",
    publisher: "",
    notes: "",
    imageName: "",
  });

  const courseOptions = ["FYJC", "SYJC", "FY-Degree", "SY-Degree", "TY-Degree", "MBBS", "BDS", "Engineering", "Commerce", "Arts", "Science", "Other"];
  const showStreamField = ["FYJC", "SYJC", "FY-Degree", "SY-Degree", "TY-Degree", "MBBS", "BDS", "Engineering", "Commerce", "Arts", "Science", "Other"].includes(course);

  const inventoryBooks = useMemo(() =>
    BOOKS.map((book) => ({
      ...book,
      keywords: `${book.title} ${book.author} ${book.subject} ${book.course}`.toLowerCase(),
      isbn: `ISBN-${book.id.toUpperCase()}`,
    })),
    []
  );

  const filteredBooks = useMemo(() => {
    const query = bookSearch.toLowerCase().trim();
    if (!query) return [];
    return inventoryBooks.filter((book) => {
      const isSelected = selectedLibraryBooks.includes(book.id);
      if (isSelected) return false;
      return [book.title, book.author, book.subject, book.course, book.isbn, book.keywords]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [bookSearch, inventoryBooks, selectedLibraryBooks]);

  const toggleLibraryBook = (id: string) => {
    setSelectedLibraryBooks((current) => (current.includes(id) ? current.filter((bookId) => bookId !== id) : [...current, id]));
  };

  const handleAddLibraryBook = (id: string) => {
    setSelectedLibraryBooks((current) => (current.includes(id) ? current : [...current, id]));
    setBookSearch("");
  };

  const resetRequestForm = () => {
    setRequestForm({ title: "", author: "", edition: "", publisher: "", notes: "", imageName: "" });
    setEditingRequestId(null);
  };

  const handleRequestSubmit = () => {
    if (!requestForm.title.trim() || !requestForm.author.trim()) return;

    if (editingRequestId) {
      setSpecialRequests((current) =>
        current.map((request) => (request.id === editingRequestId ? { ...request, ...requestForm, title: requestForm.title.trim(), author: requestForm.author.trim() } : request))
      );
    } else {
      setSpecialRequests((current) => [
        ...current,
        {
          id: `req-${Date.now()}`,
          title: requestForm.title.trim(),
          author: requestForm.author.trim(),
          edition: requestForm.edition.trim(),
          publisher: requestForm.publisher.trim(),
          notes: requestForm.notes.trim(),
          imageName: requestForm.imageName || null,
        },
      ]);
    }

    resetRequestForm();
  };

  const handleEditRequest = (request: (typeof specialRequests)[number]) => {
    setEditingRequestId(request.id);
    setRequestForm({
      title: request.title,
      author: request.author,
      edition: request.edition,
      publisher: request.publisher,
      notes: request.notes,
      imageName: request.imageName || "",
    });
  };

  const handleDeleteRequest = (requestId: string) => {
    setSpecialRequests((current) => current.filter((request) => request.id !== requestId));
    if (editingRequestId === requestId) resetRequestForm();
    if (previewRequestId === requestId) setPreviewRequestId(null);
  };

  const handleGenerateChallan = () => {
    if (selectedLibraryBooks.length === 0 && specialRequests.length === 0) return;

    const today = new Date();
    const requestId = `REQ-${today.getFullYear()}-${String(Date.now()).slice(-4)}`;
    const challanNo = `CHL-${today.getFullYear()}-${String(Date.now()).slice(-4)}`;
    const orderNo = `ORD-${today.getFullYear()}-${String(Date.now()).slice(-4)}`;
    const requestDate = today.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const libraryBooks = selectedLibraryBooks.map((bookId) => {
      const book = inventoryBooks.find((item) => item.id === bookId);
      return { title: book?.title ?? "Unknown", author: book?.author ?? "Unknown", notes: "Available for issue" };
    });
    const specialBookRequests = specialRequests.map((request) => ({
      title: request.title,
      author: request.author,
      edition: request.edition,
      publisher: request.publisher,
      notes: request.notes,
      imageName: request.imageName,
    }));

    const challan: RequestChallan = {
      id: challanNo,
      orderNo,
      challanNo,
      date: requestDate,
      student: {
        name: STUDENT.name,
        course,
        college: STUDENT.college,
        phone: STUDENT.mobile,
        studentId: STUDENT.id,
      },
      status: "Pending Verification",
      deposit: "₹500",
      refund: "Applicable on return",
      libraryBooks,
      specialRequests: specialBookRequests,
    };

    const request: RequestItem = {
      id: requestId,
      requestId,
      date: requestDate,
      type: "Book Request",
      status: "Pending",
      books: [...libraryBooks.map((book) => book.title), ...specialBookRequests.map((book) => book.title)],
      challan,
    };

    setGeneratedChallan(challan);
    setChallanGenerated(true);
    onRequestCreated(request);
  };

  const handleChangeCourse = () => {
    setStep(1);
    setCourse("");
    setStream("");
    setChallanGenerated(false);
    setGeneratedChallan(null);
  };

  const canContinue = Boolean(course && (showStreamField ? stream : true));
  const canGenerate = selectedLibraryBooks.length > 0 || specialRequests.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className={`mb-6 flex items-center ${step === 1 ? "justify-center text-center" : "justify-between"} gap-3`}>
        <div className={step === 1 ? "text-center" : ""}>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-800">Select Books</h1>
          <p className="mt-1 text-sm text-slate-400">Search for books and build your borrowing request.</p>
        </div>
        {step === 2 && (
          <button
            onClick={handleChangeCourse}
            className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-50"
          >
            Change Course
          </button>
        )}
      </div>

      <div className={`mb-8 flex flex-wrap items-center gap-2 ${step === 1 ? "justify-center" : ""}`}>
        {[
          { label: "Step 1", sub: "Select Course" },
          { label: "Step 2", sub: "Choose Books" },
        ].map((item, index) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index + 1 <= step ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"}`}>
              {index + 1}
            </div>
            <div>
              <div className={`text-sm font-bold ${index + 1 <= step ? "text-blue-700" : "text-slate-400"}`}>{item.label}</div>
              <div className="text-[11px] text-slate-400">{item.sub}</div>
            </div>
            {index < 1 && <ChevronRight className="w-4 h-4 text-slate-200" />}
          </div>
        ))}
      </div>

      {step === 1 ? (
        <div className="flex flex-col items-center">
          <div className="mb-6 flex w-full max-w-2xl flex-col items-center text-center">
            <h2 className="text-xl font-extrabold text-slate-800">Select Course</h2>
            <p className="mt-1 text-sm text-slate-400">Choose your course and stream to continue.</p>
          </div>

          <div className="w-full max-w-xl rounded-3xl border border-blue-50 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Course / Standard</label>
                <div className="relative">
                <Select
                  value={course}
                  onValueChange={(nextValue) => {
                    setCourse(nextValue);
                    setStream("");
                  }}
                  className="w-full"
                >
                  <SelectTrigger className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300" size="default">
                    <SelectValue placeholder="Select course / standard" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {courseOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>

              {showStreamField && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Stream *</label>
                  <input
                    type="text"
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    placeholder="Enter your stream"
                    className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!canContinue}
              className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Continue
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {challanGenerated ? (
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold"><CheckCircle className="w-5 h-5" /> Challan Generated Successfully</div>
                  <p className="text-sm text-emerald-700 mt-1">Your borrowing request has been prepared for review.</p>
                </div>
                <button onClick={() => setChallanGenerated(false)} className="text-sm font-bold text-emerald-700 hover:text-emerald-800">
                  Close Preview
                </button>
              </div>

              <div className="mt-6">
                <ChallanPreviewCard challan={generatedChallan} course={course} />
              </div>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-blue-50 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-800">Library Books</h2>
                      <p className="text-sm text-slate-400">Search through the admin inventory and add books to your request.</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{selectedLibraryBooks.length} selected</span>
                  </div>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input
                      type="text"
                      placeholder="Search books by title, author, subject, keyword or ISBN"
                      value={bookSearch}
                      onChange={(e) => setBookSearch(e.target.value)}
                      className="w-full rounded-xl border border-blue-100 bg-blue-50/60 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <div className="text-sm font-extrabold text-slate-800">Selected Library Books</div>
                        <div className="text-xs text-slate-400">These books will appear in your challan request.</div>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-blue-700">{selectedLibraryBooks.length} selected</span>
                    </div>
                    <div className="space-y-2">
                      {selectedLibraryBooks.length > 0 ? selectedLibraryBooks.map((bookId) => {
                        const book = inventoryBooks.find((item) => item.id === bookId);
                        return (
                          <div key={bookId} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-700">{book?.title}</div>
                              <div className="text-xs text-slate-400">{book?.author}</div>
                              <div className="mt-1 text-[11px] font-bold text-emerald-700">{book?.available ? `${book.available} Available` : "Unavailable"}</div>
                            </div>
                            <button onClick={() => toggleLibraryBook(bookId)} className="text-xs font-bold text-red-500 hover:text-red-600">
                              Remove
                            </button>
                          </div>
                        );
                      }) : <div className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-3 text-sm text-slate-400">No library books selected yet. Search and add books below.</div>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {bookSearch.trim() === "" ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                        No books shown yet. Start typing to search the library inventory.
                      </div>
                    ) : filteredBooks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
                        No matching books found for this search.
                      </div>
                    ) : filteredBooks.map((book) => (
                      <div key={book.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{book.title}</div>
                          <div className="mt-1 text-sm text-slate-500">by {book.author}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">{book.subject}</span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{book.course}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${book.available > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                            {book.available > 0 ? `${book.available} Available` : "Unavailable"}
                          </span>
                          <button
                            onClick={() => handleAddLibraryBook(book.id)}
                            className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-bold text-blue-700 transition-all hover:bg-blue-50"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-blue-50 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-800">Special Book Request</h2>
                      <p className="text-sm text-slate-400">Add a manual book request for materials not in the inventory.</p>
                    </div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{specialRequests.length} requests</span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">Book Title *</label>
                      <input
                        value={requestForm.title}
                        onChange={(e) => setRequestForm((current) => ({ ...current, title: e.target.value }))}
                        placeholder="Enter title"
                        className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">Author *</label>
                      <input
                        value={requestForm.author}
                        onChange={(e) => setRequestForm((current) => ({ ...current, author: e.target.value }))}
                        placeholder="Enter author"
                        className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">Edition</label>
                      <input
                        value={requestForm.edition}
                        onChange={(e) => setRequestForm((current) => ({ ...current, edition: e.target.value }))}
                        placeholder="e.g. 3rd Edition"
                        className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">Publisher</label>
                      <input
                        value={requestForm.publisher}
                        onChange={(e) => setRequestForm((current) => ({ ...current, publisher: e.target.value }))}
                        placeholder="Enter publisher"
                        className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">Notes / Special Instructions</label>
                      <textarea
                        value={requestForm.notes}
                        onChange={(e) => setRequestForm((current) => ({ ...current, notes: e.target.value }))}
                        placeholder="Add any notes or requirements"
                        rows={3}
                        className="w-full rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-sm font-bold text-slate-700">Book Cover / Reference Image Upload</label>
                      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-blue-200 bg-blue-50/50 px-4 py-6 text-center text-sm text-slate-500">
                        <Upload className="mb-2 h-5 w-5 text-blue-500" />
                        <span className="font-semibold text-blue-700">Browse files</span>
                        <span className="mt-1">PNG, JPG up to 5 MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setRequestForm((current) => ({ ...current, imageName: file.name }));
                          }}
                        />
                      </label>
                      {requestForm.imageName && <div className="mt-2 text-xs text-slate-500">Selected: {requestForm.imageName}</div>}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button onClick={resetRequestForm} className="rounded-xl border border-blue-200 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-50">
                      Cancel
                    </button>
                    <button onClick={handleRequestSubmit} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700">
                      {editingRequestId ? "Update Request" : "Add to Request List"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl border border-blue-50 bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h3 className="text-lg font-extrabold text-slate-800">Request Summary</h3>
                    <p className="text-sm text-slate-400">Review your selected books before generating the challan.</p>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span>Library selection</span>
                      <span className="font-bold text-slate-700">{selectedLibraryBooks.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span>Special requests</span>
                      <span className="font-bold text-slate-700">{specialRequests.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                      <span>Course</span>
                      <span className="font-bold text-slate-700">{course || "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-blue-50 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-800">Special Request Books</h3>
                      <p className="text-sm text-slate-400">Manage your manual requests before challan generation.</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {specialRequests.length > 0 ? specialRequests.map((request) => (
                      <div key={request.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-slate-700">{request.title}</div>
                            <div className="text-xs text-slate-400">{request.author}</div>
                          </div>
                          <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">Pending</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button onClick={() => handleEditRequest(request)} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button onClick={() => setPreviewRequestId(request.id)} className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50">
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          <button onClick={() => handleDeleteRequest(request.id)} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                        {previewRequestId === request.id && (
                          <div className="mt-3 rounded-xl border border-blue-100 bg-white p-3 text-xs text-slate-500">
                            <div><span className="font-semibold text-slate-700">Title:</span> {request.title}</div>
                            <div><span className="font-semibold text-slate-700">Author:</span> {request.author}</div>
                            <div><span className="font-semibold text-slate-700">Edition:</span> {request.edition || "—"}</div>
                            <div><span className="font-semibold text-slate-700">Publisher:</span> {request.publisher || "—"}</div>
                            <div><span className="font-semibold text-slate-700">Notes:</span> {request.notes || "—"}</div>
                            <div><span className="font-semibold text-slate-700">Image:</span> {request.imageName || "Not uploaded"}</div>
                          </div>
                        )}
                      </div>
                    )) : <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">No special requests added yet.</div>}
                  </div>
                </div>

                <button
                  onClick={handleGenerateChallan}
                  disabled={!canGenerate}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                >
                  Generate Challan
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Screen 9: My Requests ────────────────────────────────────────────────────
function MyRequests({
  requests,
  onViewChallan,
}: {
  requests: RequestItem[];
  onViewChallan: (challan: RequestChallan | null) => void;
}) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">My Requests</h1>
        <p className="text-slate-400 text-sm mt-1">Track your generated book requests and open the challan anytime.</p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center text-slate-300">
          <FileText className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p className="font-bold text-slate-400">No requests found</p>
          <p className="mt-1 text-sm">Generate a challan from Browse Books to create your first request.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl border border-blue-50 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-extrabold text-slate-800">{request.requestId}</span>
                    <StatusBadge status={request.status} />
                  </div>
                  <div className="mb-3 text-xs font-medium text-slate-400">{request.date} · {request.type}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {request.books.map((book) => (
                      <span key={book} className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                        {book}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {request.challan ? (
                    <button
                      onClick={() => onViewChallan(request.challan)}
                      className="rounded-lg border border-blue-200 bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                    >
                      View Challan
                    </button>
                  ) : (
                    <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-400">
                      No challan
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Screen 10: My Account ────────────────────────────────────────────────────
function MyAccount({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">My Account</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your profile and library membership</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-500 text-sm font-bold rounded-xl hover:bg-red-50 transition-colors flex-shrink-0"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal info */}
          <div className="bg-white rounded-3xl border border-blue-50 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800">Personal Information</h3>
              <button className="text-blue-600 text-sm font-bold hover:text-blue-700 transition-colors">Edit</button>
            </div>
            <div className="p-5 flex items-start gap-5">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-sky-100 flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 flex-1 text-sm">
                {[
                  { label: "Full Name", value: STUDENT.name },
                  { label: "Student ID", value: STUDENT.id },
                  { label: "Email", value: STUDENT.email },
                  { label: "Mobile", value: "+91 " + STUDENT.mobile },
                  { label: "Course", value: STUDENT.course },
                  { label: "Year", value: STUDENT.year },
                  { label: "College", value: STUDENT.college },
                  { label: "Aadhaar", value: STUDENT.aadhaar },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">{item.label}</div>
                    <div className="text-slate-800 font-bold mt-0.5 text-sm leading-tight">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Issued books */}
          <div className="bg-white rounded-3xl border border-blue-50 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50">
              <h3 className="font-extrabold text-slate-800">Currently Issued Books</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {BOOKS.slice(0, 2).map((book) => (
                <div key={book.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">{book.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{book.author}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-amber-600 text-xs font-bold">Due: Apr 30</div>
                    <div className="mt-1"><StatusBadge status="Approved" /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          {/* Member card + QR */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-5 text-white">
            <div className="text-[10px] text-blue-200 font-bold uppercase tracking-widest mb-1">Member Card</div>
            <div className="font-extrabold leading-tight">{STUDENT.name}</div>
            <div className="text-blue-200 text-xs mt-0.5">{STUDENT.id}</div>
            <div className="flex justify-center my-4">
              <div className="bg-white rounded-xl p-2">
                <QRBlock size={100} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-blue-200 font-medium">Valid until</div>
                <div className="font-bold text-sm">Dec 2024</div>
              </div>
              <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                ACTIVE
              </span>
            </div>
          </div>

          {/* Account actions */}
          <div className="bg-white rounded-3xl border border-blue-50 shadow-sm p-5">
            <h3 className="font-extrabold text-slate-800 mb-3">Account Actions</h3>
            <div className="space-y-2">
              {[
                { label: "Download ID Card", icon: <Download className="w-4 h-4" />, color: "text-blue-600" },
                { label: "View Challan History", icon: <FileText className="w-4 h-4" />, color: "text-blue-600" },
                { label: "Update Profile", icon: <Settings className="w-4 h-4" />, color: "text-blue-600" },
                { label: "Return Books", icon: <RefreshCw className="w-4 h-4" />, color: "text-amber-600" },
              ].map((a) => (
                <button
                  key={a.label}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-blue-50 rounded-xl transition-colors group text-sm"
                >
                  <div className={`flex items-center gap-2.5 font-bold ${a.color}`}>
                    {a.icon} {a.label}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                </button>
              ))}
              <button
                onClick={onLogout}
                className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group text-sm"
              >
                <div className="flex items-center gap-2.5 font-bold text-red-500">
                  <LogOut className="w-4 h-4" /> Sign Out
                </div>
                <ChevronRight className="w-4 h-4 text-red-300 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState<Screen>("register");
  const [requests, setRequests] = useState<RequestItem[]>(INITIAL_REQUESTS);
  const [activeChallan, setActiveChallan] = useState<RequestChallan | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const isPostAuth = ["dashboard", "browse", "requests", "account"].includes(screen);

  const unreadCount = notifications.filter((item) => item.unread).length;

  const handleRegistrationComplete = () => {
    setScreen("dashboard");
    setActiveChallan(null);
  };

  const addNotification = (notification: NotificationItem) => {
    setNotifications((current) => [notification, ...current]);
  };

  const handleRequestCreated = (request: RequestItem) => {
    setRequests((current) => [request, ...current]);
    setActiveChallan(request.challan);
    if (request.challan) {
      addNotification({
        id: `notif-${Date.now()}`,
        type: "success",
        title: "📚 Challan Generated Successfully",
        description: "Your book request has been submitted successfully.",
        requestId: request.requestId,
        status: "Pending Approval",
        timestamp: "Just Now",
        unread: true,
        actionLabel: "View Challan",
        actionType: "view-challan",
      });
    }
  };

  const handleViewNotification = (notification: NotificationItem) => {
    if (notification.actionType === "view-challan") {
      setActiveChallan(requests.find((r) => r.requestId === notification.requestId)?.challan ?? null);
    }
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, unread: false } : item))
    );
    setNotificationOpen(false);
  };

  const handleMarkRead = (id: string) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, unread: false } : item)));
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  };

  const handleMarkAllRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const toggleNotifications = () => setNotificationOpen((open) => !open);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {isPostAuth && <NavBar active={screen} onNav={setScreen} unreadCount={unreadCount} onToggleNotifications={toggleNotifications} />}

      {screen === "register" && <RegistrationScreen onComplete={handleRegistrationComplete} />}
      {screen === "dashboard" && <DashboardScreen onNav={setScreen} requests={requests} />}
      {screen === "browse" && <BrowseBooks onRequestCreated={handleRequestCreated} />}
      {screen === "requests" && <MyRequests requests={requests} onViewChallan={setActiveChallan} />}
      {screen === "account" && <MyAccount onLogout={() => setScreen("dashboard")} />}

      <NotificationDrawer
        notifications={notifications}
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        onViewNotification={handleViewNotification}
        onMarkRead={handleMarkRead}
        onDelete={handleDeleteNotification}
        onMarkAllRead={handleMarkAllRead}
        onClearAll={handleClearAll}
      />

      {activeChallan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[32px] border border-slate-200 bg-white p-4 shadow-2xl sm:p-6">
            <button
              onClick={() => setActiveChallan(null)}
              className="absolute right-5 top-5 rounded-full border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition-colors hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
            <ChallanPreviewCard challan={activeChallan} course={activeChallan.student.course} />
          </div>
        </div>
      )}
    </div>
  );
}

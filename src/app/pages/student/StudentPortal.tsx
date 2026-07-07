import { useState, useRef, useMemo, useEffect, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
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
import { useAuth } from "../../contexts/AuthContext";

function useStudent() {
  const { profile } = useAuth();
  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "N/A";
  return {
    name: profile?.name || "Student User",
    id: profile?.studentId || "STU00000",
    email: profile?.email || "student@svga.local",
    mobile: profile?.phone || "99999 99999",
    course: profile?.course || "B.Com",
    year: profile?.academicYear || "FY-Degree",
    college: profile?.college || "SVGA College",
    aadhaar: profile?.aadhaarNumber || profile?.aadhaar || "1234 5678 9012",
    memberSince,
    issuedBooks: profile?.issuedBooks ?? [],
    membershipStatus: profile?.membershipStatus || "NOT_PAID",
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "dashboard" | "browse" | "requests" | "account";type RequestChallan = {
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


// No hardcoded mock requests — real data is fetched from the backend
const INITIAL_REQUESTS: RequestItem[] = [];

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
              <div key={`${book.title}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{index + 1}. {book.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{book.author}</div>
                </div>
                <span className="flex-shrink-0">
                  <StatusBadge status={challan.status} />
                </span>
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
              <div key={`${request.title}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{index + 1}. {request.title}</div>
                  <div className="mt-1 text-xs text-slate-400">{request.author}</div>
                </div>
                <span className="flex-shrink-0">
                  <StatusBadge status={challan.status} />
                </span>
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
  const STUDENT = useStudent();
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

// ─── Screen 7: Dashboard ──────────────────────────────────────────────────────
function DashboardScreen({ onNav, requests }: { onNav: (s: Screen) => void; requests: RequestItem[] }) {
  const STUDENT = useStudent();
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
          <h2 className="text-2xl font-extrabold mb-1">Welcome back, {STUDENT.name}! 👋</h2>
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
  const { token } = useAuth();
  const STUDENT = useStudent();
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

  const [inventoryBooks, setInventoryBooks] = useState<any[]>([]);

  useEffect(() => {
    fetch("http://localhost:3001/api/books", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.books)) {
          setInventoryBooks(
            data.books.map((b: any) => ({
              id: b._id,
              title: b.title,
              author: b.author,
              course: b.category || "General",
              subject: b.category || "General",
              available: b.availableQuantity || 0,
              keywords: `${b.title} ${b.author} ${b.category}`.toLowerCase(),
              isbn: b.isbn || `ISBN-${b._id.slice(-6).toUpperCase()}`,
            }))
          );
        }
      })
      .catch((err) => console.error("Failed to load books:", err));
  }, [token]);

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

  const handleGenerateChallan = async () => {
    if (selectedLibraryBooks.length === 0 && specialRequests.length === 0) return;

    try {
      const res = await fetch("http://localhost:3001/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          selectedBookIds: selectedLibraryBooks,
          requestedBooks: specialRequests.map((request) => ({
            title: request.title,
            author: request.author,
            edition: request.edition,
            publisher: request.publisher,
            note: request.notes,
          })),
        }),
      });
      const data = await res.json();
      if (!data.success) {
        console.error("Failed to generate challan:", data.message);
        alert(data.message || "Failed to generate challan");
        return;
      }

      const r = data.request;
      const dateObj = new Date(r.createdAt);
      const year = dateObj.getFullYear();
      const suffix = String(r._id).slice(-6).toUpperCase();
      
      const requestId = `SVGA/${year}/REQ/${suffix}`;
      const challanNo = `SVGA/${year}/CHL/${suffix}`;
      const orderNo = `SVGA/${year}/ORD/${suffix}`;
      const requestDate = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      
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
        status: r.status,
        deposit: "Paid at Registration",
        refund: "Applicable on return",
        libraryBooks,
        specialRequests: specialBookRequests,
      };

      const requestItem: RequestItem = {
        id: String(r._id),
        requestId,
        date: requestDate,
        type: "Book Request",
        status: r.status,
        books: [...libraryBooks.map((book) => book.title), ...specialBookRequests.map((book) => book.title)],
        challan,
      };

      setGeneratedChallan(challan);
      setChallanGenerated(true);
      onRequestCreated(requestItem);
    } catch (err) {
      console.error("Error generating challan:", err);
    }
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
  const STUDENT = useStudent();
  const { token } = useAuth();
  const [issuedBooks, setIssuedBooks] = useState<any[]>([]);

  // Fetch issued books from approved requests
  useEffect(() => {
    if (!token) return;
    fetch("http://localhost:3001/api/requests/my", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.requests)) {
          const approvedBooks: any[] = [];
          data.requests.forEach((r: any) => {
            if (r.status === "Approved") {
              (r.selectedBooks || []).forEach((b: any) => {
                approvedBooks.push({
                  title: b.title,
                  author: b.author,
                  issueDate: b.issueDate || r.createdAt,
                  returnDate: b.returnDate || new Date(new Date(b.issueDate || r.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                  returned: b.returned,
                });
              });
            }
          });
          // Also include issuedBooks from the user profile
          STUDENT.issuedBooks.forEach((b: any) => {
            if (!b.returned) {
              approvedBooks.push({
                title: b.bookTitle,
                author: b.bookAuthor,
                issueDate: b.issueDate || new Date().toISOString(),
                returnDate: b.returnDate || new Date(new Date(b.issueDate || new Date()).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                returned: b.returned,
              });
            }
          });
          setIssuedBooks(approvedBooks);
        }
      })
      .catch((err) => console.error("Failed to fetch issued books:", err));
  }, [token]);

  // Calculate membership validity (1 year from registration)
  const validUntil = STUDENT.memberSince !== "N/A"
    ? (() => {
        const parts = STUDENT.memberSince.split(" ");
        const monthMap: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
        const year = parseInt(parts[1]) + 1;
        const month = monthMap[parts[0]] ?? 0;
        return new Date(year, month).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      })()
    : "N/A";

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
            <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800">Currently Issued Books</h3>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
                {issuedBooks.length} {issuedBooks.length === 1 ? "book" : "books"}
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {issuedBooks.length > 0 ? issuedBooks.map((book, idx) => (
                <div key={`${book.title}-${idx}`} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">{book.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{book.author}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-amber-600 text-xs font-bold flex items-center justify-end gap-1.5">
                      Due: {new Date(book.returnDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-[10px] text-amber-700 border border-amber-100 font-bold whitespace-nowrap">
                        {(() => {
                          const diffTime = new Date(book.returnDate).getTime() - new Date().getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays < 0 ? `Overdue by ${Math.abs(diffDays)}d` : `${diffDays}d left`;
                        })()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Issued: {new Date(book.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="px-5 py-6 text-center text-sm text-slate-400">
                  No books currently issued. Generate a challan from Browse Books to request books.
                </div>
              )}
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
                <div className="font-bold text-sm">{validUntil}</div>
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
                { label: "Update Profile", icon: <Settings className="w-4 h-4" />, color: "text-blue-600" },
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

const API_BASE = "http://localhost:3001/api";

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const { logout, token } = useAuth();
  const STUDENT = useStudent();
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [requests, setRequests] = useState<RequestItem[]>(INITIAL_REQUESTS);
  const [activeChallan, setActiveChallan] = useState<RequestChallan | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const isPostAuth = ["dashboard", "browse", "requests", "account"].includes(screen);

  const unreadCount = notifications.filter((item) => item.unread).length;

  // ── Fetch real requests from backend on mount ────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/requests/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.requests)) {
          const mapped: RequestItem[] = data.requests.map((r: any) => {
            const dateObj = new Date(r.createdAt);
            const year = dateObj.getFullYear();
            const suffix = String(r._id).slice(-6).toUpperCase();
            
            const reqId = `SVGA/${year}/REQ/${suffix}`;
            const challanNo = `SVGA/${year}/CHL/${suffix}`;
            const orderNo = `SVGA/${year}/ORD/${suffix}`;
            const requestDate = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

            const libraryBooks = (r.selectedBookIds ?? []).map((b: any) => ({
              title: b.title ?? "Unknown",
              author: b.author ?? "Unknown",
              notes: "Available for issue"
            }));
            const specialBookRequests = (r.requestedBooks ?? []).map((b: any) => ({
              title: b.title,
              author: b.author,
              edition: b.edition ?? "",
              publisher: b.publisher ?? "",
              notes: b.note ?? "",
              imageName: null,
            }));

            const challan: RequestChallan = {
              id: challanNo,
              orderNo,
              challanNo,
              date: requestDate,
              student: {
                name: STUDENT.name,
                course: STUDENT.course,
                college: STUDENT.college,
                phone: STUDENT.mobile,
                studentId: STUDENT.id,
              },
              status: r.status,
              deposit: "Paid at Registration",
              refund: "Applicable on return",
              libraryBooks,
              specialRequests: specialBookRequests,
            };

            return {
              id: String(r._id),
              requestId: reqId,
              date: requestDate,
              type: "Book Request" as const,
              status: r.status as RequestItem["status"],
              books: [
                ...libraryBooks.map((b) => b.title),
                ...specialBookRequests.map((b) => b.title),
              ],
              challan,
            };
          });
          setRequests(mapped);
        }
      })
      .catch(() => {
        // Backend unavailable — leave requests empty
      });
  }, [token]);

  // ── Handle real logout (only triggered by Sign Out button) ───────────────────
  const handleLogout = () => {
    logout();
    navigate("/student/login", { replace: true });
  };

  const handleRegistrationComplete = () => {
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


      {screen === "dashboard" && <DashboardScreen onNav={setScreen} requests={requests} />}
      {screen === "browse" && <BrowseBooks onRequestCreated={handleRequestCreated} />}
      {screen === "requests" && <MyRequests requests={requests} onViewChallan={setActiveChallan} />}
      {screen === "account" && <MyAccount onLogout={handleLogout} />}

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

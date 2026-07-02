import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, BookOpen, Package, Users, ClipboardList, Settings,
  Bell, LogOut, Search, Filter, Plus, Download, Upload, ChevronDown,
  ChevronRight, X, Check, Clock, AlertCircle, TrendingUp, TrendingDown,
  Eye, Edit3, Trash2, Ban, RefreshCw, FileText, CheckCircle, XCircle,
  ShoppingCart, Archive, BarChart2, PieChart, Activity, Calendar,
  Mail, Lock, Shield, Database, Palette, ChevronLeft, MoreHorizontal,
  BookMarked, User, Phone, Hash, Building2, GraduationCap, Layers,
  ArrowUpRight, ArrowDownRight, Inbox, Star, Info, Printer
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Toaster, toast } from "sonner";
import { useHasMounted, usePrefersReducedMotion } from "./components/ui/motion-utils";

// ─── Types ─────────────────────────────────────────────────────────────────

type Page = "dashboard" | "requests" | "inventory" | "students" | "auditlogs" | "notifications" | "settings";

interface Student {
  id: string; name: string; dept: string; semester: string;
  phone: string; email: string; membership: string; status: "Active" | "Suspended" | "Inactive";
  created: string;
}

type LifecycleStage = "Requested" | "Approved" | "Ordered" | "Reached Office" | "Ready For Collection" | "Collected By Student" | "Returned";
type BookDecision = "Pending" | "Approved" | "Rejected";

interface LibraryBookItem {
  id: string; title: string; author: string; status: BookDecision;
}

interface SpecialBookItem {
  id: string; title: string; author: string; status: BookDecision | "Buy"; procurementStage: LifecycleStage; isMarkedForPurchase?: boolean;
}

interface RequestRecord {
  appNo: string; student: string; studentId: string; dept: string; semester: string;
  type: "Online" | "Manual"; created: string; challanNo: string; status: "Pending" | "Completed";
  libraryBooks: LibraryBookItem[];
  specialBooks: SpecialBookItem[];
  remark?: string;
}

interface InventoryBook {
  id: string; name: string; author: string; publisher: string;
  category: string; edition: string; copies: number; available: number;
}

interface AuditEntry {
  id: string; timestamp: string; admin: string; action: string;
  module: string; result: "Success" | "Failed" | "Warning"; details: string;
}

interface Notification {
  id: string; type: "request" | "inventory" | "student" | "system";
  message: string; timestamp: string; read: boolean; group: "Today" | "Yesterday" | "Earlier";
}

function formatStudentId(value: number): string {
  if (value < 1 || value > 10000) {
    throw new RangeError("Student ID value must be between 1 and 10000.");
  }
  return `S${String(value).padStart(5, "0")}`;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const kpiData = [
  { label: "Total Books", value: 2847, icon: BookOpen, trend: 4.2, color: "blue", sub: "Across all categories" },
  { label: "Books Issued", value: 642, icon: BookMarked, trend: 8.1, color: "sky", sub: "Currently with students" },
  { label: "Pending Requests", value: 28, icon: Clock, trend: -3.4, color: "amber", sub: "Awaiting approval" },
  { label: "Manual Requests", value: 12, icon: FileText, trend: 2.0, color: "purple", sub: "Walk-in requests" },
  { label: "Available Inventory", value: 2205, icon: Archive, trend: -1.2, color: "green", sub: "Ready to issue" },
  { label: "Returned Books", value: 184, icon: RefreshCw, trend: 12.3, color: "teal", sub: "This month" },
  { label: "Pending Returns", value: 31, icon: AlertCircle, trend: 5.6, color: "orange", sub: "Overdue or upcoming" },
  { label: "Late Returns", value: 8, icon: XCircle, trend: -15.0, color: "red", sub: "Fine applicable" },
];

const requestTrendData = [
  { month: "Jan", online: 42, manual: 8 }, { month: "Feb", online: 55, manual: 12 },
  { month: "Mar", online: 48, manual: 9 }, { month: "Apr", online: 70, manual: 15 },
  { month: "May", online: 65, manual: 11 }, { month: "Jun", online: 82, manual: 18 },
  { month: "Jul", online: 91, manual: 20 }, { month: "Aug", online: 78, manual: 14 },
];

const inventoryTrendData = [
  { month: "Jan", added: 120, issued: 80 }, { month: "Feb", added: 45, issued: 95 },
  { month: "Mar", added: 200, issued: 110 }, { month: "Apr", added: 75, issued: 88 },
  { month: "May", added: 150, issued: 102 }, { month: "Jun", added: 90, issued: 78 },
  { month: "Jul", added: 60, issued: 95 }, { month: "Aug", added: 180, issued: 120 },
];

const categoryData = [
  { name: "Engineering", value: 840, color: "#2563EB" },
  { name: "Science", value: 520, color: "#0EA5E9" },
  { name: "Commerce", value: 410, color: "#10B981" },
  { name: "Arts", value: 380, color: "#F59E0B" },
  { name: "Medicine", value: 290, color: "#8B5CF6" },
  { name: "Law", value: 407, color: "#EC4899" },
];

const procurementStages: LifecycleStage[] = ["Requested", "Approved", "Ordered", "Reached Office", "Ready For Collection", "Collected By Student", "Returned"];

const initialRequests: RequestRecord[] = [
  {
    appNo: "APP-2024-001",
    student: "Arjun Sharma",
    studentId: formatStudentId(1),
    dept: "Computer Science",
    semester: "5th",
    status: "Pending",
    type: "Online",
    created: "2024-08-12",
    challanNo: "CHL-2024-001",
    libraryBooks: [
      { id: "LB-001", title: "Data Structures & Algorithms", author: "Cormen", status: "Pending" },
      { id: "LB-002", title: "DBMS by Navathe", author: "Navathe", status: "Pending" },
    ],
    specialBooks: [
      { id: "SB-001", title: "Advanced Operating Systems", author: "Silberschatz", status: "Pending", procurementStage: "Requested" },
    ],
  },
  {
    appNo: "APP-2024-002",
    student: "Priya Verma",
    studentId: formatStudentId(2),
    dept: "Electrical Engineering",
    semester: "3rd",
    status: "Pending",
    type: "Online",
    created: "2024-08-11",
    challanNo: "CHL-2024-002",
    libraryBooks: [
      { id: "LB-003", title: "Circuit Theory", author: "Hayt", status: "Pending" },
      { id: "LB-004", title: "Electromagnetics by Hayt", author: "Hayt", status: "Pending" },
    ],
    specialBooks: [
      { id: "SB-002", title: "Digital Signal Processing", author: "Oppenheim", status: "Pending", procurementStage: "Approved" },
    ],
  },
  {
    appNo: "APP-2024-003",
    student: "Rohit Gupta",
    studentId: formatStudentId(3),
    dept: "Mechanical Engineering",
    semester: "7th",
    status: "Pending",
    type: "Manual",
    created: "2024-08-10",
    challanNo: "CHL-2024-003",
    libraryBooks: [
      { id: "LB-005", title: "Thermodynamics", author: "Cengel", status: "Pending" },
      { id: "LB-006", title: "Fluid Mechanics by Munson", author: "Munson", status: "Pending" },
    ],
    specialBooks: [
      { id: "SB-003", title: "Engineering Materials", author: "Callister", status: "Pending", procurementStage: "Requested" },
      { id: "SB-004", title: "Machine Design", author: "Shigley", status: "Pending", procurementStage: "Requested" },
    ],
  },
  {
    appNo: "APP-2024-004",
    student: "Neha Patel",
    studentId: formatStudentId(4),
    dept: "Civil Engineering",
    semester: "1st",
    status: "Completed",
    type: "Online",
    created: "2024-08-09",
    challanNo: "CHL-2024-004",
    libraryBooks: [
      { id: "LB-007", title: "Engineering Drawing", author: "N. D. Bhatt", status: "Approved" },
      { id: "LB-008", title: "Engineering Mechanics", author: "Beer", status: "Rejected" },
    ],
    specialBooks: [
      { id: "SB-005", title: "Surveying Handbook", author: "Mannering", status: "Approved", procurementStage: "Reached Office", isMarkedForPurchase: true },
    ],
  },
  {
    appNo: "APP-2024-005",
    student: "Vikram Singh",
    studentId: formatStudentId(5),
    dept: "Computer Science",
    semester: "5th",
    status: "Pending",
    type: "Online",
    created: "2024-08-08",
    challanNo: "CHL-2024-005",
    libraryBooks: [
      { id: "LB-009", title: "Operating Systems by Galvin", author: "Galvin", status: "Pending" },
      { id: "LB-010", title: "Computer Networks by Tanenbaum", author: "Tanenbaum", status: "Pending" },
    ],
    specialBooks: [
      { id: "SB-006", title: "Software Engineering by Sommerville", author: "Sommerville", status: "Pending", procurementStage: "Requested" },
    ],
  },
  {
    appNo: "APP-2024-006",
    student: "Ananya Krishnan",
    studentId: formatStudentId(6),
    dept: "Electronics",
    semester: "3rd",
    status: "Pending",
    type: "Manual",
    created: "2024-08-07",
    challanNo: "CHL-2024-006",
    libraryBooks: [
      { id: "LB-011", title: "Digital Electronics by Floyd", author: "Floyd", status: "Pending" },
    ],
    specialBooks: [
      { id: "SB-007", title: "Microprocessor Design", author: "Morris Mano", status: "Pending", procurementStage: "Ordered" },
    ],
  },
];

const mockInventory: InventoryBook[] = [
  { id: "BK-001", name: "Data Structures & Algorithms", author: "Cormen, Leiserson", publisher: "MIT Press", category: "Computer Science", edition: "4th", copies: 12, available: 8 },
  { id: "BK-002", name: "Database Management Systems", author: "Ramakrishnan & Gehrke", publisher: "McGraw-Hill", category: "Computer Science", edition: "3rd", copies: 8, available: 5 },
  { id: "BK-003", name: "Engineering Mathematics Vol.1", author: "B.S. Grewal", publisher: "Khanna Publishers", category: "Mathematics", edition: "44th", copies: 20, available: 14 },
  { id: "BK-004", name: "Thermodynamics: An Engineering Approach", author: "Cengel & Boles", publisher: "McGraw-Hill", category: "Mechanical", edition: "8th", copies: 10, available: 6 },
  { id: "BK-005", name: "Circuit Theory & Networks", author: "A. Chakrabarti", publisher: "Dhanpat Rai", category: "Electrical", edition: "9th", copies: 15, available: 11 },
  { id: "BK-006", name: "Operating System Concepts", author: "Galvin, Gagne", publisher: "Wiley", category: "Computer Science", edition: "10th", copies: 9, available: 3 },
  { id: "BK-007", name: "Strength of Materials", author: "R.K. Bansal", publisher: "Laxmi Publications", category: "Civil", edition: "5th", copies: 14, available: 9 },
  { id: "BK-008", name: "Fluid Mechanics", author: "Frank M. White", publisher: "McGraw-Hill", category: "Mechanical", edition: "8th", copies: 7, available: 4 },
  { id: "BK-009", name: "Introduction to Algorithms", author: "Cormen, Leiserson, Rivest", publisher: "MIT Press", category: "Computer Science", edition: "3rd", copies: 18, available: 12 },
  { id: "BK-010", name: "Signals and Systems", author: "Simon Haykin", publisher: "Wiley", category: "Electrical", edition: "2nd", copies: 11, available: 7 },
  { id: "BK-011", name: "Concrete Technology", author: "M.S. Shetty", publisher: "S. Chand", category: "Civil", edition: "3rd", copies: 9, available: 5 },
  { id: "BK-012", name: "Modern Control Engineering", author: "Katsuhiko Ogata", publisher: "Pearson", category: "Electronics", edition: "5th", copies: 13, available: 10 },
  { id: "BK-013", name: "Environmental Engineering", author: "Peavy, Rowe", publisher: "McGraw-Hill", category: "Science", edition: "4th", copies: 6, available: 4 },
  { id: "BK-014", name: "Engineering Economics", author: "R.P. Rustagi", publisher: "S. Chand", category: "Commerce", edition: "7th", copies: 10, available: 8 },
];

const recentApprovedRequests = [
  { student: "Arjun Sharma", studentId: formatStudentId(1), requestNo: "APP-2024-004", books: 3, approvedOn: "2024-08-13", status: "Completed" },
  { student: "Neha Patel", studentId: formatStudentId(4), requestNo: "APP-2024-009", books: 2, approvedOn: "2024-08-11", status: "Completed" },
  { student: "Priya Verma", studentId: formatStudentId(2), requestNo: "APP-2024-010", books: 1, approvedOn: "2024-08-10", status: "Completed" },
];

const returningBooksData = [
  { student: "Vikram Singh", studentId: formatStudentId(5), title: "Operating System Concepts", issueDate: "2024-07-20", dueDate: "2024-08-19", remainingDays: 4, status: "Critical" },
  { student: "Ananya Krishnan", studentId: formatStudentId(6), title: "Modern Control Engineering", issueDate: "2024-07-25", dueDate: "2024-08-24", remainingDays: 9, status: "Due Soon" },
  { student: "Deepak Nair", studentId: formatStudentId(7), title: "Data Structures & Algorithms", issueDate: "2024-07-18", dueDate: "2024-08-17", remainingDays: 2, status: "Critical" },
  { student: "Rohit Gupta", studentId: formatStudentId(3), title: "Thermodynamics: An Engineering Approach", issueDate: "2024-07-12", dueDate: "2024-08-11", remainingDays: -2, status: "Critical" },
  { student: "Neha Patel", studentId: formatStudentId(4), title: "Surveying Handbook", issueDate: "2024-07-22", dueDate: "2024-08-21", remainingDays: 6, status: "Due Soon" },
];

const mockStudents: Student[] = [
  { id: formatStudentId(1), name: "Arjun Sharma", dept: "Computer Science", semester: "5th", phone: "9876543210", email: "arjun.sharma@svga.edu.in", membership: "Standard", status: "Active", created: "2021-07-15" },
  { id: formatStudentId(2), name: "Priya Verma", dept: "Electrical Engineering", semester: "3rd", phone: "9876512345", email: "priya.verma@svga.edu.in", membership: "Premium", status: "Active", created: "2022-07-20" },
  { id: formatStudentId(3), name: "Rohit Gupta", dept: "Mechanical Engineering", semester: "7th", phone: "9123456789", email: "rohit.gupta@svga.edu.in", membership: "Standard", status: "Active", created: "2020-07-12" },
  { id: formatStudentId(4), name: "Neha Patel", dept: "Civil Engineering", semester: "1st", phone: "9988776655", email: "neha.patel@svga.edu.in", membership: "Standard", status: "Active", created: "2023-07-18" },
  { id: formatStudentId(5), name: "Vikram Singh", dept: "Computer Science", semester: "5th", phone: "9765432100", email: "vikram.singh@svga.edu.in", membership: "Standard", status: "Suspended", created: "2021-07-14" },
  { id: formatStudentId(6), name: "Ananya Krishnan", dept: "Electronics", semester: "3rd", phone: "9871234560", email: "ananya.k@svga.edu.in", membership: "Premium", status: "Active", created: "2022-07-22" },
  { id: formatStudentId(7), name: "Deepak Nair", dept: "Computer Science", semester: "8th", phone: "9543210987", email: "deepak.nair@svga.edu.in", membership: "Standard", status: "Inactive", created: "2019-07-10" },
];

const mockAuditLogs: AuditEntry[] = [
  { id: "AL-001", timestamp: "2024-08-12 14:32:15", admin: "Admin Suresh", action: "Approved Request", module: "Book Requests", result: "Success", details: "Approved APP-2024-002 for Priya Verma" },
  { id: "AL-002", timestamp: "2024-08-12 13:18:42", admin: "Admin Suresh", action: "Added Book", module: "Inventory", result: "Success", details: "Added 10 copies of 'Advanced Java Programming'" },
  { id: "AL-003", timestamp: "2024-08-12 11:05:30", admin: "Admin Meena", action: "Suspended Student", module: "Students", result: "Warning", details: `Suspended ${formatStudentId(5)} (Vikram Singh) — policy violation` },
  { id: "AL-004", timestamp: "2024-08-11 16:44:09", admin: "Admin Suresh", action: "Rejected Request", module: "Book Requests", result: "Success", details: "Rejected APP-2024-005; book not available in required quantity" },
  { id: "AL-005", timestamp: "2024-08-11 10:22:57", admin: "Admin Meena", action: "Exported Data", module: "Inventory", result: "Success", details: "Exported inventory report as XLSX" },
  { id: "AL-006", timestamp: "2024-08-10 15:30:12", admin: "System", action: "Backup Created", module: "System", result: "Success", details: "Automated daily backup completed — 48 MB" },
  { id: "AL-007", timestamp: "2024-08-10 09:11:33", admin: "Admin Meena", action: "Login Failed", module: "Auth", result: "Failed", details: "3 consecutive failed login attempts detected" },
];

const mockNotifications: Notification[] = [
  { id: "N-001", type: "request", message: "New book request APP-2024-007 submitted by Kavitha Reddy", timestamp: "10 minutes ago", read: false, group: "Today" },
  { id: "N-002", type: "inventory", message: "Low stock alert: 'Operating System Concepts' — only 3 copies remaining", timestamp: "1 hour ago", read: false, group: "Today" },
  { id: "N-003", type: "student", message: `Student ${formatStudentId(8)} completed registration — pending membership approval`, timestamp: "3 hours ago", read: false, group: "Today" },
  { id: "N-004", type: "system", message: "Automated backup completed successfully — 48 MB", timestamp: "6 hours ago", read: true, group: "Today" },
  { id: "N-005", type: "request", message: "APP-2024-003 has been pending for more than 48 hours — action required", timestamp: "Yesterday, 4:20 PM", read: true, group: "Yesterday" },
  { id: "N-006", type: "inventory", message: "New book batch received: 25 copies of 'Engineering Mathematics'", timestamp: "Yesterday, 10:05 AM", read: true, group: "Yesterday" },
  { id: "N-007", type: "student", message: "Late return fine applied to Vikram Singh — ₹ 80", timestamp: "2 days ago", read: true, group: "Earlier" },
];

// ─── Color helpers ──────────────────────────────────────────────────────────

const kpiColors: Record<string, { bg: string; icon: string; border: string; badge: string }> = {
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   border: "border-blue-100",   badge: "bg-blue-100 text-blue-700" },
  sky:    { bg: "bg-sky-50",    icon: "text-sky-600",    border: "border-sky-100",    badge: "bg-sky-100 text-sky-700" },
  amber:  { bg: "bg-amber-50",  icon: "text-amber-600",  border: "border-amber-100",  badge: "bg-amber-100 text-amber-700" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-100", badge: "bg-purple-100 text-purple-700" },
  green:  { bg: "bg-emerald-50",icon: "text-emerald-600",border: "border-emerald-100",badge: "bg-emerald-100 text-emerald-700" },
  teal:   { bg: "bg-teal-50",   icon: "text-teal-600",   border: "border-teal-100",   badge: "bg-teal-100 text-teal-700" },
  orange: { bg: "bg-orange-50", icon: "text-orange-600", border: "border-orange-100", badge: "bg-orange-100 text-orange-700" },
  red:    { bg: "bg-red-50",    icon: "text-red-600",    border: "border-red-100",    badge: "bg-red-100 text-red-700" },
};

const statusColors: Record<string, string> = {
  Pending:   "bg-amber-100 text-amber-700 border border-amber-200",
  Approved:  "bg-blue-100 text-blue-700 border border-blue-200",
  Rejected:  "bg-red-100 text-red-700 border border-red-200",
  Buy:       "bg-violet-100 text-violet-700 border border-violet-200",
  Completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Active:    "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Suspended: "bg-red-100 text-red-700 border border-red-200",
  Inactive:  "bg-gray-100 text-gray-600 border border-gray-200",
  Success:   "bg-emerald-100 text-emerald-700",
  Failed:    "bg-red-100 text-red-700",
  Warning:   "bg-amber-100 text-amber-700",
  Standard:  "bg-slate-100 text-slate-600",
  Premium:   "bg-purple-100 text-purple-700",
};

const autoBuyRemark = "The requested book can be purchased by the student. While returning the book to the SVGA office, please carry the original physical purchase invoice. The reimbursement amount will be processed only after invoice verification as per community guidelines.";

const notifIconMap: Record<string, { icon: typeof Bell; color: string }> = {
  request:   { icon: FileText, color: "text-blue-600 bg-blue-50" },
  inventory: { icon: Package, color: "text-amber-600 bg-amber-50" },
  student:   { icon: Users, color: "text-emerald-600 bg-emerald-50" },
  system:    { icon: Settings, color: "text-slate-600 bg-slate-100" },
};

// ─── KPI Card ───────────────────────────────────────────────────────────────

function AnimatedNumber({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0; const duration = 1200;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setVal(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <>{val.toLocaleString()}</>;
}

function KPICard({ item }: { item: typeof kpiData[0] }) {
  const c = kpiColors[item.color];
  const Icon = item.icon;
  const up = item.trend >= 0;
  const mounted = useHasMounted();
  const reduced = usePrefersReducedMotion();
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-5 shadow-sm transition-all duration-220 hover:-translate-y-1 hover:shadow-md group cursor-default ${mounted && !reduced ? "page-enter" : ""}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${c.bg} p-2.5 rounded-xl group-hover:scale-105 transition-transform duration-200`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        <span className={`flex items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-full ${up ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
          {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(item.trend)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-1">
        <AnimatedNumber target={item.value} />
      </p>
      <p className="text-sm font-medium text-slate-700 mb-1">{item.label}</p>
      <p className="text-xs text-slate-400">{item.sub}</p>
    </div>
  );
}

// ─── Charts Section ─────────────────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-blue-50 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-5">{title}</h3>
      {children}
    </div>
  );
}

function DashboardCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2">
        <ChartCard title="Request Trends — Online vs Manual">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={requestTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOnline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorManual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Area type="monotone" dataKey="online" name="Online" stroke="#2563EB" strokeWidth={2} fill="url(#colorOnline)" dot={false} activeDot={{ r: 4, fill: "#2563EB" }} />
              <Area type="monotone" dataKey="manual" name="Manual" stroke="#0EA5E9" strokeWidth={2} fill="url(#colorManual)" dot={false} activeDot={{ r: 4, fill: "#0EA5E9" }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
      <ChartCard title="Books by Category">
        <ResponsiveContainer width="100%" height={220}>
          <RechartsPie>
            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
              {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(v: number) => [v.toLocaleString(), "Books"]} contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
          </RechartsPie>
        </ResponsiveContainer>
        <div className="grid grid-cols-2 gap-1 mt-2">
          {categoryData.map(c => (
            <div key={c.name} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
              {c.name}
            </div>
          ))}
        </div>
      </ChartCard>
      <div className="lg:col-span-3">
        <ChartCard title="Inventory Activity — Added vs Issued">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={inventoryTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="added" name="Added" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="issued" name="Issued" fill="#0EA5E9" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ProcurementTimeline({ currentStage }: { currentStage: LifecycleStage }) {
  const currentIndex = procurementStages.indexOf(currentStage);
  return (
    <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 p-4">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-4">
        <span>Procurement Lifecycle</span>
        <span className="text-blue-700">{currentStage}</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto">
        {procurementStages.map((stage, index) => {
          const done = index <= currentIndex;
          const active = index === currentIndex;
          return (
            <div key={stage} className="flex items-center min-w-[90px] flex-1">
              <div className="flex flex-1 flex-col items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${done ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-400"} ${active ? "ring-4 ring-blue-100" : ""}`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : <div className="h-2 w-2 rounded-full bg-slate-300" />}
                </div>
                <span className={`text-[10px] text-center font-medium ${done ? "text-blue-700" : "text-slate-400"}`}>{stage}</span>
              </div>
              {index < procurementStages.length - 1 && <div className={`mx-2 h-0.5 flex-1 rounded-full ${index < currentIndex ? "bg-blue-500" : "bg-slate-200"}`} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LifecycleDropdown({ value, onChange, disabled }: { value: LifecycleStage; onChange: (value: LifecycleStage) => void; disabled?: boolean }) {
  return (
    <label className="flex flex-col gap-2 text-sm text-slate-600">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Lifecycle</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as LifecycleStage)}
        disabled={disabled}
        className={`rounded-xl border px-3 py-2 text-sm text-slate-700 outline-none ring-0 focus:border-blue-300 focus:bg-white ${disabled ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed" : "border-slate-200 bg-slate-50"}`}>
        {procurementStages.map((stage) => (
          <option key={stage} value={stage}>{stage}</option>
        ))}
      </select>
    </label>
  );
}

function RemarksSection({ remark, onChange, editable }: { remark: string; onChange?: (value: string) => void; editable?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Remarks</div>
      {editable ? (
        <textarea
          value={remark}
          onChange={(e) => onChange?.(e.target.value)}
          rows={4}
          className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:ring-0"
          placeholder="Add processing notes or clarifications here..."
        />
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{remark || "No remarks added."}</p>
      )}
    </div>
  );
}

function SignatureSection({ adminName, studentName, date, remark, editable, onRemarkChange }: { adminName: string; studentName: string; date: string; remark: string; editable?: boolean; onRemarkChange?: (value: string) => void }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Admin Signature</div>
          <div className="mt-8 h-10 border-b border-slate-200" />
          <div className="mt-4 text-sm font-medium text-slate-700">{adminName}</div>
        </div>
        <div className="rounded-2xl border border-slate-100 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Student Signature</div>
          <div className="mt-8 h-10 border-b border-slate-200" />
          <div className="mt-4 text-sm font-medium text-slate-700">{studentName}</div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Date</div>
          <div className="mt-3 text-sm font-medium text-slate-700">{date}</div>
        </div>
        <div className="rounded-2xl border border-slate-100 p-4 bg-slate-50">
          <RemarksSection remark={remark} onChange={onRemarkChange ?? (() => {})} editable={editable} />
        </div>
      </div>
    </div>
  );
}

function ChallanModal({ children, title, subtitle, label, onClose }: { children: React.ReactNode; title: string; subtitle: string; label: string; onClose: () => void }) {
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="modal-panel relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50 px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{subtitle}</h2>
            <p className="text-sm text-slate-500">{label}</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function LibraryBookCard({ book, onApprove, onReject }: { book: LibraryBookItem; onApprove: () => void; onReject: () => void }) {
  const badge = book.status === "Approved" ? "bg-emerald-100 text-emerald-700" : book.status === "Rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{book.title}</p>
          <p className="mt-1 text-sm text-slate-500">{book.author}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>{book.status}</span>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-slate-500">Current status</span>
        <div className="flex items-center gap-2">
          <button onClick={onReject} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50">Reject</button>
          <button onClick={onApprove} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Approve</button>
        </div>
      </div>
    </div>
  );
}

function SpecialBookCard({ book, onApprove, onReject, onBuy, onStageChange }: { book: SpecialBookItem; onApprove: () => void; onReject: () => void; onBuy: () => void; onStageChange: (stage: LifecycleStage) => void }) {
  const badge = book.isMarkedForPurchase ? "bg-violet-100 text-violet-700" : book.status === "Approved" ? "bg-emerald-100 text-emerald-700" : book.status === "Rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{book.title}</p>
          <p className="mt-1 text-sm text-slate-500">{book.author}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge}`}>{book.isMarkedForPurchase ? "Buy" : book.status}</span>
      </div>
      <div className="mt-4">
        <ProcurementTimeline currentStage={book.procurementStage} />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <LifecycleDropdown value={book.procurementStage} onChange={onStageChange} />
        <div className="flex items-end justify-end gap-2">
          <button onClick={onReject} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50">Reject</button>
          <button onClick={onApprove} className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Approve</button>
          <button onClick={onBuy} className="rounded-xl border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50">Buy</button>
        </div>
      </div>
    </div>
  );
}

function PendingRequestChallan({ request, onClose, onUpdateRequest, onFinalize }: { request: RequestRecord; onClose: () => void; onUpdateRequest: (updated: RequestRecord) => void; onFinalize: (requestId: string) => void }) {
  const [openSection, setOpenSection] = useState<string | null>("student");
  const toggle = (k: string) => setOpenSection((p) => (p === k ? null : k));
  const allDecisionsMade = request.libraryBooks.every((book) => book.status !== "Pending") && request.specialBooks.every((book) => book.status !== "Pending");

  const computeRemark = (specialBooks: SpecialBookItem[], currentRemark?: string) => {
    const hasBuy = specialBooks.some((book) => book.isMarkedForPurchase);
    if (hasBuy) {
      return currentRemark && currentRemark !== autoBuyRemark ? currentRemark : autoBuyRemark;
    }
    return currentRemark === autoBuyRemark ? "" : currentRemark ?? "";
  };

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <button onClick={() => toggle(id)} className="flex w-full items-center justify-between px-5 py-3.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
        {title}
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${openSection === id ? "rotate-180" : ""}`} />
      </button>
      {openSection === id && <div className="border-t border-slate-100 px-5 py-4">{children}</div>}
    </div>
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between border-b border-slate-50 py-2 text-sm last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );

  const updateLibraryBook = (bookId: string, status: BookDecision) => {
    const next = { ...request, libraryBooks: request.libraryBooks.map((book) => (book.id === bookId ? { ...book, status } : book)) };
    onUpdateRequest(next);
  };

  const updateSpecialBook = (bookId: string, changes: Partial<SpecialBookItem>) => {
    const nextSpecialBooks = request.specialBooks.map((book) => (book.id === bookId ? { ...book, ...changes } : book));
    const nextRemark = computeRemark(nextSpecialBooks, request.remark);
    onUpdateRequest({ ...request, specialBooks: nextSpecialBooks, remark: nextRemark });
  };

  const updateRemark = (value: string) => {
    onUpdateRequest({ ...request, remark: value });
  };

  return (
    <ChallanModal title="Pending Request Challan" subtitle={request.challanNo} label={`Application #${request.appNo}`} onClose={onClose}>
      <div className="space-y-6">
        <Section id="student" title="Student Details">
          <InfoRow label="Student Name" value={request.student} />
          <InfoRow label="Student ID" value={request.studentId} />
          <InfoRow label="Department" value={request.dept} />
          <InfoRow label="Semester" value={request.semester} />
        </Section>
        <Section id="library" title="Library Books">
          <div className="space-y-3">
            {request.libraryBooks.map((book) => (
              <LibraryBookCard key={book.id} book={book} onApprove={() => updateLibraryBook(book.id, "Approved")} onReject={() => updateLibraryBook(book.id, "Rejected")} />
            ))}
          </div>
        </Section>
        <Section id="special" title="Special Book Requests">
          <div className="space-y-3">
            {request.specialBooks.map((book) => (
              <SpecialBookCard
                key={book.id}
                book={book}
                onApprove={() => updateSpecialBook(book.id, { status: "Approved", isMarkedForPurchase: false })}
                onReject={() => updateSpecialBook(book.id, { status: "Rejected", isMarkedForPurchase: false })}
                onBuy={() => updateSpecialBook(book.id, { status: "Buy", isMarkedForPurchase: true })}
                onStageChange={(stage) => updateSpecialBook(book.id, { procurementStage: stage })}
              />
            ))}
          </div>
        </Section>
        <SignatureSection
          adminName="Admin Suresh"
          studentName={request.student}
          date={request.created}
          remark={request.remark ?? ""}
          editable
          onRemarkChange={updateRemark}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm text-slate-500">{allDecisionsMade ? "All requested items have a decision and are ready for submission." : "Every library and special book needs an approval or rejection before submission."}</div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100">Close</button>
            <button disabled={!allDecisionsMade} onClick={() => onFinalize(request.appNo)} className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">Final Submit</button>
          </div>
        </div>
      </div>
    </ChallanModal>
  );
}

function CompletedRequestChallan({ request, onClose }: { request: RequestRecord; onClose: () => void }) {
  return (
    <ChallanModal title="Completed Request Challan" subtitle={request.challanNo} label={`Application #${request.appNo}`} onClose={onClose}>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Student Details</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <div className="text-xs text-slate-500">Student Name</div>
              <div className="mt-2 text-sm font-medium text-slate-800">{request.student}</div>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <div className="text-xs text-slate-500">Student ID</div>
              <div className="mt-2 text-sm font-medium text-slate-800">{request.studentId}</div>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <div className="text-xs text-slate-500">Department</div>
              <div className="mt-2 text-sm font-medium text-slate-800">{request.dept}</div>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <div className="text-xs text-slate-500">Semester</div>
              <div className="mt-2 text-sm font-medium text-slate-800">{request.semester}</div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Library Books</p>
          <div className="mt-3 space-y-2 text-sm">
            {request.libraryBooks.map((book) => (
              <div key={book.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-3 shadow-sm">
                <div>
                  <p className="font-medium text-slate-800">{book.title}</p>
                  <p className="text-xs text-slate-500">{book.author}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${book.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{book.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Special Book Requests</p>
          <div className="mt-4 space-y-4">
            {request.specialBooks.map((book) => (
              <div key={book.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{book.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{book.author}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${book.isMarkedForPurchase ? "bg-violet-100 text-violet-700" : book.status === "Approved" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{book.isMarkedForPurchase ? "Buy" : book.status}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{book.procurementStage}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <ProcurementTimeline currentStage={book.procurementStage} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <SignatureSection
          adminName="Admin Suresh"
          studentName={request.student}
          date={request.created}
          remark={request.remark ?? ""}
          editable={false}
        />
      </div>
    </ChallanModal>
  );
}

function ManualPurchaseCard({ request, book, selected, onSelect, onViewChallan, onStageChange }: { request: RequestRecord; book: SpecialBookItem; selected: boolean; onSelect: () => void; onViewChallan: () => void; onStageChange: (stage: LifecycleStage) => void }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <label className="flex items-start gap-3">
          <input type="checkbox" checked={selected} onChange={onSelect} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          <div>
            <p className="text-sm font-semibold text-slate-900">{book.title}</p>
            <p className="mt-1 text-sm text-slate-500">{request.student}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{request.studentId}</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1">{request.dept}</span>
            </div>
          </div>
        </label>
        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">{book.procurementStage}</span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <LifecycleDropdown value={book.procurementStage} onChange={onStageChange} />
        <div className="flex items-end justify-end gap-2">
          <button onClick={onViewChallan} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">View Full Challan</button>
        </div>
      </div>
    </div>
  );
}

function PurchaseSelectionToolbar({ selectedCount, onExportPdf, onExportCsv, disabled }: { selectedCount: number; onExportPdf: () => void; onExportCsv: () => void; disabled: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{selectedCount > 0 ? `${selectedCount} book${selectedCount > 1 ? "s" : ""} selected` : "Select one or more books to export"}</div>
      <div className="flex items-center gap-2">
        <button disabled={disabled} onClick={onExportPdf} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Generate Purchase PDF</button>
        <button disabled={disabled} onClick={onExportCsv} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">Generate Purchase CSV</button>
      </div>
    </div>
  );
}

function ExportConfirmationModal({ type, selectedCount, onClose, onConfirm }: { type: "pdf" | "csv"; selectedCount: number; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-slate-900">Generate Procurement {type.toUpperCase()}?</h3>
        <p className="mt-3 text-sm text-slate-500">You are about to export {selectedCount} selected book{selectedCount > 1 ? "s" : ""}.</p>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">Generate {type === "pdf" ? "PDF" : "CSV"}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Book Modal ─────────────────────────────────────────────────────────

function AddBookModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", author: "", publisher: "", edition: "", category: "", quantity: "" });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value }));
  const InputField = ({ label, k, type = "text", placeholder }: { label: string; k: string; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input type={type} value={(form as Record<string,string>)[k]} onChange={set(k)} placeholder={placeholder || label}
        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-slate-50 text-slate-800 placeholder:text-slate-300 transition-all" />
    </div>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Add New Book</h2>
            <p className="text-xs text-slate-400 mt-0.5">Fill in details to add to inventory</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <InputField label="Book Name" k="name" placeholder="e.g. Advanced Java Programming" />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Author" k="author" placeholder="Author name" />
            <InputField label="Publisher" k="publisher" placeholder="Publisher" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Edition" k="edition" placeholder="e.g. 4th" />
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
              <select value={form.category} onChange={set("category")} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-slate-50 text-slate-800 transition-all">
                <option value="">Select category</option>
                {["Computer Science","Mathematics","Electrical","Mechanical","Civil","Electronics","Science","Commerce"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <InputField label="Quantity" k="quantity" type="number" placeholder="Number of copies" />
        </div>
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-slate-600">Cancel</button>
          <button onClick={() => { toast.success("Book added to inventory!"); onClose(); }} className="px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Save Book
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar & Search ───────────────────────────────────────────────────────

function SearchInput({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="search-shell relative rounded-xl border border-slate-200 bg-white">
      <Search className="search-icon absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-64 rounded-xl border-0 bg-transparent py-2 pl-9 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-300" />
    </div>
  );
}

function SelectFilter({ value, onChange, options, icon }: { value: string; onChange: (v: string) => void; options: string[]; icon?: React.ReactNode }) {
  return (
    <div className="search-shell relative rounded-xl border border-slate-200 bg-white">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
      <select value={value} onChange={e => onChange(e.target.value)} className={`${icon ? "pl-9" : "pl-3"} pr-8 py-2 text-sm bg-transparent text-slate-700 appearance-none cursor-pointer outline-none`}>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

// ─── Status Badge ───────────────────────────────────────────────────────────

function Badge({ status }: { status: string }) {
  return <span className={`status-chip text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[status] || "bg-slate-100 text-slate-600"}`}>{status}</span>;
}

// ─── Pagination ─────────────────────────────────────────────────────────────

function Pagination({ total, page, setPage, perPage = 5 }: { total: number; page: number; setPage: React.Dispatch<React.SetStateAction<number>>; perPage?: number }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
      <span className="text-xs text-slate-400">Showing {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} of {total}</span>
      <div className="flex items-center gap-1">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"><ChevronLeft className="w-3.5 h-3.5 text-slate-600" /></button>
        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${p === page ? "bg-blue-600 text-white" : "hover:bg-slate-100 text-slate-600"}`}>{p}</button>
        ))}
        <button disabled={page === pages} onClick={() => setPage((p) => p + 1)} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"><ChevronRight className="w-3.5 h-3.5 text-slate-600" /></button>
      </div>
    </div>
  );
}

// ─── Dashboard Page ─────────────────────────────────────────────────────────

function DashboardPage() {
  const reduced = usePrefersReducedMotion();
  return (
    <div className={`space-y-6 ${reduced ? "" : "page-enter"}`}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">Welcome back, Admin Suresh — here is the latest status for requests, inventory, and returns.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiData.map(item => <KPICard key={item.label} item={item} />)}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Recent Approved Requests</h2>
                <p className="text-xs text-slate-500">Latest completed workflows from the last week.</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{recentApprovedRequests.length} records</span>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {recentApprovedRequests.map((item) => (
              <div key={item.requestNo} className="px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.student}</p>
                    <p className="text-xs text-slate-500">{item.studentId} · {item.requestNo}</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-3 py-1">{item.status}</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{item.books} books</span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">Approved {item.approvedOn}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Books Due for Return</h2>
                <p className="text-xs text-slate-500">Monitor upcoming deadlines and overdue status.</p>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{returningBooksData.length} students</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Book</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returningBooksData.map((item) => (
                  <tr key={`${item.studentId}-${item.title}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-medium text-slate-900">{item.student}</div>
                      <div className="text-xs text-slate-500">{item.studentId}</div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">{item.title}</td>
                    <td className="px-5 py-4 text-slate-700">{item.dueDate}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DashboardCharts />
    </div>
  );
}

// ─── Requests Page ──────────────────────────────────────────────────────────

function RequestsPage() {
  const reduced = usePrefersReducedMotion();
  const [tab, setTab] = useState<"pending" | "completed" | "manual">("pending");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [requests, setRequests] = useState<RequestRecord[]>(initialRequests);
  const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(null);
  const [selectedManualBooks, setSelectedManualBooks] = useState<string[]>([]);
  const [exportModal, setExportModal] = useState<"pdf" | "csv" | null>(null);
  const [page, setPage] = useState(1);

  const filtered = requests.filter((r) => {
    const matchTab = tab === "pending" ? r.status === "Pending" : tab === "completed" ? r.status === "Completed" : r.type === "Manual";
    const matchSearch = !search || r.student.toLowerCase().includes(search.toLowerCase()) || r.appNo.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All Status" || (statusFilter === "Pending" ? r.status === "Pending" : statusFilter === "Completed" ? r.status === "Completed" : false);
    const matchDept = deptFilter === "All Departments" || r.dept === deptFilter;
    return matchTab && matchSearch && matchStatus && matchDept;
  });

  const perPage = 5;
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const tabs = [
    { key: "pending", label: "Pending Requests", count: requests.filter((r) => r.status === "Pending").length },
    { key: "completed", label: "Completed Requests", count: requests.filter((r) => r.status === "Completed").length },
    { key: "manual", label: "Manual Purchase", count: requests.filter((r) => r.type === "Manual").length },
  ] as const;

  const manualPurchaseBooks = requests.flatMap((request) => request.specialBooks.filter((book) => book.isMarkedForPurchase).map((book) => ({ request, book })));
  const selectedBookObjects = manualPurchaseBooks.filter(({ book }) => selectedManualBooks.includes(book.id));

  const toggleManualBook = (bookId: string) => {
    setSelectedManualBooks((prev) => (prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId]));
  };

  const updateRequest = (updated: RequestRecord) => {
    setRequests((prev) => prev.map((request) => (request.appNo === updated.appNo ? updated : request)));
    setSelectedRequest((prev) => (prev?.appNo === updated.appNo ? updated : prev));
  };

  const finalizeRequest = (appNo: string) => {
    setRequests((prev) => prev.map((request) => (request.appNo === appNo ? { ...request, status: "Completed" } : request)));
    toast.success("Challan moved to completed requests.");
    setSelectedRequest(null);
  };

  const updateManualBookStage = (bookId: string, stage: LifecycleStage) => {
    setRequests((prev) => {
      const next = prev.map((request) => ({
        ...request,
        specialBooks: request.specialBooks.map((book) => (book.id === bookId ? { ...book, procurementStage: stage } : book)),
      }));
      const matched = next.find((request) => request.specialBooks.some((book) => book.id === bookId));
      if (selectedRequest?.appNo === matched?.appNo) {
        setSelectedRequest(matched ?? null);
      }
      return next;
    });
  };

  return (
    <div className={`space-y-5 ${reduced ? "" : "page-enter"}`}>
      {selectedRequest && (selectedRequest.status === "Completed" ? <CompletedRequestChallan request={selectedRequest} onClose={() => setSelectedRequest(null)} /> : <PendingRequestChallan request={selectedRequest} onClose={() => setSelectedRequest(null)} onUpdateRequest={updateRequest} onFinalize={finalizeRequest} />)}
      {exportModal && <ExportConfirmationModal type={exportModal} selectedCount={selectedBookObjects.length} onClose={() => setExportModal(null)} onConfirm={() => { toast.success(`Generated ${exportModal.toUpperCase()} export.`); setExportModal(null); }} />}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book Requests</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage and process all student book requests.</p>
      </div>
      <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 w-fit">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 ${tab === t.key ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>
            {t.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${tab === t.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>{t.count}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search requests..." value={search} onChange={(v) => { setSearch(v); setPage(1); }} />
        <SelectFilter value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={["All Status", "Pending", "Completed"]} icon={<Filter className="w-3.5 h-3.5" />} />
        <SelectFilter value={deptFilter} onChange={(v) => { setDeptFilter(v); setPage(1); }} options={["All Departments", "Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Electronics"]} icon={<Building2 className="w-3.5 h-3.5" />} />
      </div>

      {tab !== "manual" ? (
        <div className="space-y-4">
          {paged.length === 0 ? (
            <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center text-slate-400">
              <Inbox className="mx-auto mb-3 h-10 w-10 text-slate-200" />
              <p className="text-sm font-medium">No requests found</p>
            </div>
          ) : paged.map((request, index) => (
            <div key={request.appNo} className={`table-row-enter rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm`} style={{ animationDelay: `${index * 28}ms` }}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-blue-600">{request.appNo}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${request.type === "Manual" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>{request.type}</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">{request.student}</h3>
                  <p className="mt-1 text-sm text-slate-500">{request.studentId} • {request.dept} • {request.semester}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${request.status === "Completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{request.status}</span>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Requested Books</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {request.libraryBooks.map((book) => <span key={book.id} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600">{book.title}</span>)}
                  {request.specialBooks.map((book) => <span key={book.id} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600">{book.title}</span>)}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-500">Created {request.created}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSelectedRequest(request)} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">{request.status === "Completed" ? "View Completed Challan" : "View Challan"}</button>
                </div>
              </div>
            </div>
          ))}
          <Pagination total={filtered.length} page={page} setPage={setPage} perPage={perPage} />
        </div>
      ) : (
        <div className="space-y-4">
          <PurchaseSelectionToolbar selectedCount={selectedBookObjects.length} disabled={selectedBookObjects.length === 0} onExportPdf={() => setExportModal("pdf")} onExportCsv={() => setExportModal("csv")} />
          <div className="grid gap-4 xl:grid-cols-2">
            {manualPurchaseBooks.map(({ request, book }, index) => (
              <div key={book.id} className={`table-row-enter ${reduced ? "" : ""}`} style={{ animationDelay: `${index * 28}ms` }}>
                <ManualPurchaseCard request={request} book={book} selected={selectedManualBooks.includes(book.id)} onSelect={() => toggleManualBook(book.id)} onViewChallan={() => setSelectedRequest(request)} onStageChange={(stage) => updateManualBookStage(book.id, stage)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inventory Page ─────────────────────────────────────────────────────────

function InventoryPage() {
  const reduced = usePrefersReducedMotion();
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All Categories");
  const [showAdd, setShowAdd] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = mockInventory.filter(b =>
    (!search || b.name.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase())) &&
    (catFilter === "All Categories" || b.category === catFilter)
  );
  const perPage = 6; const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className={`space-y-5 ${reduced ? "" : "page-enter"}`}>
      {showAdd && <AddBookModal onClose={() => setShowAdd(false)} />}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
        <p className="text-sm text-slate-400 mt-0.5">Track and manage your complete book collection.</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput placeholder="Search books..." value={search} onChange={v => { setSearch(v); setPage(1); }} />
          <SelectFilter value={catFilter} onChange={v => { setCatFilter(v); setPage(1); }} options={["All Categories", "Computer Science", "Mathematics", "Electrical", "Mechanical", "Civil", "Electronics", "Science"]} icon={<Layers className="w-3.5 h-3.5" />} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toast.info("Exporting inventory...")} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button onClick={() => toast.info("Import feature coming soon.")} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600">
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Add Book
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Book Name", "Author", "Publisher", "Category", "Edition", "Copies", "Availability", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide first:pl-6 last:pr-6">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((b, index) => {
              const pct = Math.round((b.available / b.copies) * 100);
              return (
                <tr key={b.id} className={`table-row-enter border-b border-slate-50 hover:bg-blue-50/30 transition-colors ${reduced ? "" : ""}`} style={{ animationDelay: `${index * 24}ms` }}>
                  <td className="px-4 py-3.5 pl-6">
                    <div className="font-medium text-slate-800">{b.name}</div>
                    <div className="text-xs text-slate-400">{b.id}</div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 text-xs">{b.author}</td>
                  <td className="px-4 py-3.5 text-slate-600 text-xs">{b.publisher}</td>
                  <td className="px-4 py-3.5"><span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{b.category}</span></td>
                  <td className="px-4 py-3.5 text-slate-600 text-xs">{b.edition}</td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">{b.copies}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct > 60 ? "bg-emerald-500" : pct > 30 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-xs font-medium ${pct > 60 ? "text-emerald-600" : pct > 30 ? "text-amber-600" : "text-red-600"}`}>{b.available}/{b.copies}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 pr-6">
                    <div className="flex items-center gap-1">
                      <button onClick={() => toast.info(`Editing ${b.name}`)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => toast.error(`Deleted ${b.name}`)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-6 py-3"><Pagination total={filtered.length} page={page} setPage={setPage} perPage={perPage} /></div>
      </div>
    </div>
  );
}

// ─── Students Page ──────────────────────────────────────────────────────────

function StudentsPage() {
  const reduced = usePrefersReducedMotion();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All Departments");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [page, setPage] = useState(1);

  const filtered = mockStudents.filter(s =>
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())) &&
    (deptFilter === "All Departments" || s.dept === deptFilter) &&
    (statusFilter === "All Status" || s.status === statusFilter)
  );
  const perPage = 6; const paged = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Management</h1>
        <p className="text-sm text-slate-400 mt-0.5">View and manage registered library members.</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput placeholder="Search students..." value={search} onChange={v => { setSearch(v); setPage(1); }} />
          <SelectFilter value={deptFilter} onChange={v => { setDeptFilter(v); setPage(1); }} options={["All Departments", "Computer Science", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering", "Electronics"]} icon={<Building2 className="w-3.5 h-3.5" />} />
          <SelectFilter value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} options={["All Status", "Active", "Suspended", "Inactive"]} icon={<Filter className="w-3.5 h-3.5" />} />
        </div>
        <button onClick={() => toast.info("Exporting student data...")} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["Student ID", "Name", "Department", "Semester", "Contact", "Membership", "Status", "Created", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide first:pl-6 last:pr-6">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((s, index) => (
              <tr key={s.id} className={`table-row-enter border-b border-slate-50 hover:bg-blue-50/30 transition-colors ${reduced ? "" : ""}`} style={{ animationDelay: `${index * 24}ms` }}>
                <td className="px-4 py-3.5 pl-6 text-xs font-medium text-blue-600">{s.id}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{s.name.charAt(0)}</div>
                    <span className="font-medium text-slate-800">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-slate-600 text-xs">{s.dept}</td>
                <td className="px-4 py-3.5 text-slate-600 text-xs">{s.semester}</td>
                <td className="px-4 py-3.5">
                  <div className="text-xs text-slate-600">{s.phone}</div>
                  <div className="text-xs text-slate-400">{s.email}</div>
                </td>
                <td className="px-4 py-3.5"><Badge status={s.membership} /></td>
                <td className="px-4 py-3.5"><Badge status={s.status} /></td>
                <td className="px-4 py-3.5 text-xs text-slate-400">{s.created}</td>
                <td className="px-4 py-3.5 pr-6">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toast.info(`Viewing ${s.name}'s profile`)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Profile"><User className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toast.info(`Editing ${s.name}`)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toast.warning(`${s.name} suspended`)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="Suspend"><Ban className="w-3.5 h-3.5" /></button>
                    <button onClick={() => toast.error(`${s.name} deleted`)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-3"><Pagination total={filtered.length} page={page} setPage={setPage} perPage={perPage} /></div>
      </div>
    </div>
  );
}

// ─── Audit Logs Page ────────────────────────────────────────────────────────

function AuditLogsPage() {
  const reduced = usePrefersReducedMotion();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All Actions");
  const filtered = mockAuditLogs.filter(e =>
    (!search || e.action.toLowerCase().includes(search.toLowerCase()) || e.admin.toLowerCase().includes(search.toLowerCase()) || e.details.toLowerCase().includes(search.toLowerCase())) &&
    (actionFilter === "All Actions" || e.result === actionFilter)
  );
  return (
    <div className={`space-y-5 ${reduced ? "" : "page-enter"}`}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-sm text-slate-400 mt-0.5">Complete record of admin actions and system events.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput placeholder="Search logs..." value={search} onChange={setSearch} />
        <SelectFilter value={actionFilter} onChange={setActionFilter} options={["All Actions", "Success", "Failed", "Warning"]} icon={<Filter className="w-3.5 h-3.5" />} />
        <button onClick={() => toast.info("Exporting audit logs...")} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-slate-600 ml-auto">
          <Download className="w-3.5 h-3.5" /> Export
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50">
          {filtered.map((entry, i) => {
            const resultIcon = entry.result === "Success" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : entry.result === "Failed" ? <XCircle className="w-4 h-4 text-red-500" /> : <AlertCircle className="w-4 h-4 text-amber-500" />;
            return (
              <div key={entry.id} className="table-row-enter flex items-start gap-4 px-6 py-4 hover:bg-blue-50/20 transition-colors" style={{ animationDelay: `${i * 26}ms` }}>
                <div className="flex flex-col items-center pt-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${entry.result === "Success" ? "bg-emerald-50" : entry.result === "Failed" ? "bg-red-50" : "bg-amber-50"}`}>{resultIcon}</div>
                  {i < filtered.length - 1 && <div className="w-0.5 bg-slate-100 flex-1 mt-2 min-h-[20px]" />}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-sm">{entry.action}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[entry.result]}`}>{entry.result}</span>
                      <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">{entry.module}</span>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0">{entry.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{entry.details}</p>
                  <p className="text-xs text-blue-600 mt-0.5 font-medium">{entry.admin}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Page ─────────────────────────────────────────────────────

function NotificationsPage() {
  const reduced = usePrefersReducedMotion();
  const [notifs, setNotifs] = useState(mockNotifications);
  const unread = notifs.filter(n => !n.read).length;
  const groups = ["Today", "Yesterday", "Earlier"] as const;
  const markAll = () => setNotifs(n => n.map(x => ({ ...x, read: true })));
  return (
    <div className={`space-y-5 max-w-3xl ${reduced ? "" : "page-enter"}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Notifications
            {unread > 0 && <span className="text-sm font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">{unread}</span>}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Stay updated on requests, inventory, and system events.</p>
        </div>
        {unread > 0 && <button onClick={markAll} className="text-sm text-blue-600 font-medium hover:underline">Mark all as read</button>}
      </div>
      {groups.map(group => {
        const grouped = notifs.filter(n => n.group === group);
        if (!grouped.length) return null;
        return (
          <div key={group}>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{group}</h3>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
              {grouped.map((n, index) => {
                const { icon: NIcon, color } = notifIconMap[n.type];
                return (
                  <div key={n.id} onClick={() => setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))}
                    className={`notification-enter flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-blue-50/30 ${!n.read ? "bg-blue-50/20" : ""}`} style={{ animationDelay: `${index * 40}ms` }}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                      <NIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!n.read ? "font-semibold text-slate-800" : "text-slate-600"}`}>{n.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.timestamp}</p>
                    </div>
                    {!n.read && <div className="pulse-soft mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Settings Page ──────────────────────────────────────────────────────────

const settingsSections = [
  { icon: User, title: "Admin Profile", desc: "Update your name, email, and profile photo.", color: "blue" },
  { icon: Shield, title: "Permissions", desc: "Manage admin roles and access levels.", color: "purple" },
  { icon: Mail, title: "Email Templates", desc: "Customize notification and challan emails.", color: "sky" },
  { icon: Lock, title: "OTP Configuration", desc: "Configure OTP delivery and expiry settings.", color: "amber" },
  { icon: Shield, title: "Security", desc: "Two-factor auth, session management, and policies.", color: "red" },
  { icon: Database, title: "Backup & Restore", desc: "Schedule backups and restore from snapshots.", color: "teal" },
  { icon: Palette, title: "Theme & Appearance", desc: "Customize portal branding and color scheme.", color: "pink" },
  { icon: Activity, title: "System Health", desc: "Monitor uptime, database, and API status.", color: "green" },
];

function SettingsPage() {
  const reduced = usePrefersReducedMotion();
  return (
    <div className={`space-y-5 ${reduced ? "" : "page-enter"}`}>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-400 mt-0.5">Configure and manage your SVGA Book Bank portal.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map(s => {
          const Icon = s.icon;
          const c = kpiColors[s.color] || kpiColors.blue;
          return (
            <button key={s.title} onClick={() => toast.info(`Opening ${s.title}...`)}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group">
              <div className={`${c.bg} w-10 h-10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-5 h-5 ${c.icon}`} />
              </div>
              <h3 className="font-semibold text-slate-800 mb-1">{s.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600">
                Configure <ChevronRight className="w-3 h-3" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Navigation ─────────────────────────────────────────────────────────────

const navItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "requests", label: "Requests", icon: BookOpen, badge: 28 },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "students", label: "Students", icon: Users },
  { key: "auditlogs", label: "Audit Logs", icon: ClipboardList },
  { key: "settings", label: "Settings", icon: Settings },
] as const;

function Navbar({ current, setCurrent, notifCount }: { current: Page; setCurrent: (p: Page) => void; notifCount: number }) {
  const reduced = usePrefersReducedMotion();
  const navRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const activeIndex = navItems.findIndex((item) => item.key === current);
    const activeButton = navRefs.current[activeIndex];

    if (!activeButton) {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      return;
    }

    const updateIndicator = () => {
      const parentRect = activeButton.parentElement?.getBoundingClientRect();
      const rect = activeButton.getBoundingClientRect();
      if (!parentRect) return;

      setIndicatorStyle({
        left: rect.left - parentRect.left,
        width: rect.width,
        opacity: 1,
      });
    };

    const raf = window.requestAnimationFrame(updateIndicator);
    window.addEventListener("resize", updateIndicator);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [current]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-blue-100/80 bg-white/80 px-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3">
        <div className="flex flex-shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 shadow-md shadow-blue-200/70">
            <BookOpen className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="leading-none">
            <div className="text-sm font-bold text-slate-900">SVGA</div>
            <div className="text-[10px] font-medium tracking-[0.22em] text-slate-400">Book Bank</div>
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-center lg:flex">
          <div className="relative w-full max-w-[760px] rounded-2xl border border-slate-100/70 bg-slate-50/70 p-1.5 shadow-inner shadow-slate-200/60">
            <div
              className="absolute inset-y-1.5 z-0 rounded-xl border border-white/70 bg-white/80 shadow-[0_8px_24px_rgba(59,130,246,0.12)] backdrop-blur-md transition-all duration-250 ease-in-out"
              style={{ left: indicatorStyle.left, width: indicatorStyle.width, opacity: indicatorStyle.opacity }}
            />
            <nav className="relative z-10 grid grid-cols-6 gap-1.5">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = current === item.key;
                return (
                  <button
                    key={item.key}
                    ref={(el) => {
                      navRefs.current[index] = el;
                    }}
                    onClick={() => setCurrent(item.key as Page)}
                    className={`group flex min-w-[92px] items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-180 ease-in-out ${active ? "text-blue-700" : "text-slate-500 hover:bg-white/70 hover:text-slate-800"}`}
                  >
                    <Icon className={`h-3.5 w-3.5 transition-all duration-180 ease-in-out ${reduced ? "" : active ? "scale-105" : "group-hover:scale-105"}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                    {"badge" in item && !active && <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">{(item as { badge: number }).badge}</span>}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2.5">
          <button
            onClick={() => setCurrent("notifications")}
            className={`relative rounded-2xl p-2.5 transition-all duration-180 ease-in-out ${current === "notifications" ? "bg-blue-50 text-blue-600 shadow-sm" : "text-slate-500 hover:-translate-y-0.5 hover:bg-slate-100 hover:text-slate-700"}`}
          >
            <Bell className="h-4 w-4" />
            {notifCount > 0 && <span className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ${reduced ? "" : "animate-[pulse_2.8s_ease-in-out_infinite]"}`} />}
          </button>
          <div className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white/80 px-2.5 py-1.5 shadow-sm transition-all duration-180 ease-in-out hover:-translate-y-0.5 hover:bg-slate-50">
            <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-xs font-bold text-white shadow-sm transition-transform duration-180 ease-in-out ${reduced ? "" : "hover:scale-105"}`}>S</div>
            <div className="hidden leading-none md:block">
              <div className="text-xs font-semibold text-slate-800">Admin Suresh</div>
              <div className="text-[10px] text-slate-400">Super Admin</div>
            </div>
            <button onClick={() => toast.info("Logging out...")} className="ml-1 rounded-lg p-1.5 text-slate-400 transition-colors duration-180 ease-in-out hover:bg-red-50 hover:text-red-500">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const unreadNotifs = mockNotifications.filter(n => !n.read).length;

  const pageMap: Record<Page, React.ReactNode> = {
    dashboard: <DashboardPage />,
    requests: <RequestsPage />,
    inventory: <InventoryPage />,
    students: <StudentsPage />,
    auditlogs: <AuditLogsPage />,
    notifications: <NotificationsPage />,
    settings: <SettingsPage />,
  };

  return (
    <div className="min-h-screen bg-background font-[Inter,system-ui,sans-serif]">
      <Toaster position="top-right" richColors closeButton />
      <Navbar current={page} setCurrent={setPage} notifCount={unreadNotifs} />
      <main className="pt-14">
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          <div key={page} className="page-enter">
            {pageMap[page]}
          </div>
        </div>
      </main>
    </div>
  );
}

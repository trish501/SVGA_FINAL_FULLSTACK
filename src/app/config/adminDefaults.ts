// Centralized admin defaults and empty fallbacks (no sample data)
import { BookOpen, BookMarked, Clock, FileText, Archive, RefreshCw, AlertCircle, XCircle } from "lucide-react";

export const emptyKpiData = [
  { label: "Total Books", value: 0, icon: BookOpen, trend: 0, color: "blue", sub: "Across all categories" },
  { label: "Books Issued", value: 0, icon: BookMarked, trend: 0, color: "sky", sub: "Currently with students" },
  { label: "Pending Requests", value: 0, icon: Clock, trend: 0, color: "amber", sub: "Awaiting approval" },
  { label: "Manual Requests", value: 0, icon: FileText, trend: 0, color: "purple", sub: "Walk-in requests" },
  { label: "Available Inventory", value: 0, icon: Archive, trend: 0, color: "green", sub: "Ready to issue" },
  { label: "Returned Books", value: 0, icon: RefreshCw, trend: 0, color: "teal", sub: "This month" },
  { label: "Pending Returns", value: 0, icon: AlertCircle, trend: 0, color: "orange", sub: "Overdue or upcoming" },
  { label: "Late Returns", value: 0, icon: XCircle, trend: 0, color: "red", sub: "Fine applicable" },
];

export const kpiData = emptyKpiData;

export const procurementStages = [
  "Requested",
  "Approved",
  "Ordered",
  "Reached Office",
  "Ready For Collection",
  "Collected By Student",
  "Returned",
] as const;

export const requestTrendData: Array<Record<string, any>> = [];
export const inventoryTrendData: Array<Record<string, any>> = [];
export const categoryData: Array<Record<string, any>> = [];
export const initialRequests: Array<Record<string, any>> = [];

export const mockInventory: Array<Record<string, any>> = [];
export const recentApprovedRequests: Array<Record<string, any>> = [];
export const returningBooksData: Array<Record<string, any>> = [];
export const mockStudents: Array<Record<string, any>> = [];
export const mockAuditLogs: Array<Record<string, any>> = [];
export const mockNotifications: Array<Record<string, any>> = [];

export default {
  emptyKpiData, kpiData, procurementStages,
  requestTrendData, inventoryTrendData, categoryData, initialRequests,
  mockInventory, recentApprovedRequests, returningBooksData, mockStudents, mockAuditLogs, mockNotifications,
};

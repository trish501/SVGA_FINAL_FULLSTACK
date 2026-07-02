import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { AuthProvider, ProtectedRoute } from "./contexts/AuthContext";
import { Home } from "./pages/Home";
import { AdminLogin } from "./pages/AdminLogin";
import { StudentLogin } from "./pages/StudentLogin";
import { PortalShell } from "./layouts/PortalShell";

const StudentPortalPage = lazy(() => import("./pages/student/StudentPortal"));
const AdminPortalPage = lazy(() => import("./pages/admin/AdminPortal"));

const withProvider = (element: ReactNode) => <AuthProvider>{element}</AuthProvider>;
const portalFallback = (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
    Loading portal...
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: withProvider(<Home />),
  },
  {
    path: "/student/login",
    element: withProvider(<StudentLogin />),
  },
  {
    path: "/admin/login",
    element: withProvider(<AdminLogin />),
  },
  {
    path: "/student-login",
    element: <Navigate to="/student/login" replace />,
  },
  {
    path: "/admin-login",
    element: <Navigate to="/admin/login" replace />,
  },
  {
    path: "/student",
    element: withProvider(
      <ProtectedRoute requiredRole="student" redirectTo="/student/login">
        <PortalShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={portalFallback}>
            <StudentPortalPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/admin",
    element: withProvider(
      <ProtectedRoute requiredRole="admin" redirectTo="/admin/login">
        <PortalShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={portalFallback}>
            <AdminPortalPage />
          </Suspense>
        ),
      },
    ],
  },
  {
    path: "/student-dashboard",
    element: <Navigate to="/student" replace />,
  },
  {
    path: "/admin-dashboard",
    element: <Navigate to="/admin" replace />,
  },
]);
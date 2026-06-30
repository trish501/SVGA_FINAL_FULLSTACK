import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { AdminLogin } from "./pages/AdminLogin";
import { StudentLogin } from "./pages/StudentLogin";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/admin-login",
    Component: AdminLogin,
  },
  {
    path: "/student-login",
    Component: StudentLogin,
  },
  {
    path: "/student-dashboard",
    Component: () => (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-slate-800">Student Dashboard Placeholder</h1>
          <p className="text-slate-500">Authentication successful. Welcome to SVGA Book Bank.</p>
          <a href="/" className="text-blue-500 hover:underline block">Return to Home</a>
        </div>
      </div>
    ),
  }
]);
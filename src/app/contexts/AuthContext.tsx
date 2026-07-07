import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

type UserType = "guest" | "student" | "admin";
type ThemeMode = "light" | "dark";

interface IssuedBook {
  bookId?: string;
  bookTitle: string;
  bookAuthor: string;
  issueDate?: string;
  returnDate?: string;
  returned?: boolean;
}

interface UserProfile {
  name: string;
  email: string;
  role: UserType;
  phone?: string;
  aadhaarNumber?: string;
  profileCompleted?: boolean;
  studentId?: string;
  course?: string;
  college?: string;
  academicYear?: string;
  createdAt?: string;
  aadhaar?: string;
  issuedBooks?: IssuedBook[];
  membershipStatus?: string;
}

interface TempLoginData {
  phone?: string;
  aadhaarNumber?: string;
  token?: string;
  email?: string;
}

interface NotificationState {
  unreadCount: number;
  items: string[];
}

interface AuthState {
  userType: UserType;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  token: string | null;
  theme: ThemeMode;
  notifications: NotificationState;
  tempLoginData: TempLoginData | null;
}

interface AuthContextValue extends AuthState {
  loginStudent: (profile?: Partial<UserProfile>, token?: string, tempLoginData?: TempLoginData) => void;
  loginAdmin: (profile?: Partial<UserProfile>) => void;
  logout: () => void;
  setTheme: (theme: ThemeMode) => void;
  markNotificationsRead: () => void;
  setTempLoginData: (data: TempLoginData | null) => void;
}

const STORAGE_KEY = "svga-portal-auth";

const initialState: AuthState = {
  userType: "guest",
  isAuthenticated: false,
  profile: null,
  token: null,
  theme: "light",
  notifications: {
    unreadCount: 0,
    items: [],
  },
  tempLoginData: null,
};

function readStoredAuthState(): AuthState {
  if (typeof window === "undefined") {
    return initialState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialState;
    }

    const parsed = JSON.parse(raw) as Partial<AuthState>;
    return {
      ...initialState,
      ...parsed,
      notifications: {
        unreadCount: parsed.notifications?.unreadCount ?? 0,
        items: parsed.notifications?.items ?? [],
      },
    };
  } catch {
    return initialState;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(readStoredAuthState);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const loginStudent = (profile?: Partial<UserProfile>, token?: string, tempLoginData?: TempLoginData) => {
    setState((current) => ({
      ...current,
      userType: "student",
      isAuthenticated: true,
      token: token || current.token,
      profile: {
        name: profile?.name ?? "Student User",
        email: profile?.email ?? "student@svga.local",
        role: "student",
        phone: profile?.phone,
        aadhaarNumber: profile?.aadhaarNumber,
        profileCompleted: profile?.profileCompleted,
        studentId: profile?.studentId,
        course: profile?.course,
        college: profile?.college,
        academicYear: profile?.academicYear,
        createdAt: profile?.createdAt,
        aadhaar: profile?.aadhaar,
        issuedBooks: (profile as any)?.issuedBooks ?? [],
        membershipStatus: (profile as any)?.membershipStatus,
      },
      tempLoginData: tempLoginData || current.tempLoginData,
    }));
  };

  const loginAdmin = (profile?: Partial<UserProfile>, token?: string) => {
    setState((current) => ({
      ...current,
      userType: "admin",
      isAuthenticated: true,
      token: token || current.token,
      profile: {
        name: profile?.name ?? "Admin User",
        email: profile?.email ?? "admin@svga.local",
        role: "admin",
      },
    }));
  };

  const logout = () => {
    setState(initialState);
  };

  const setTheme = (theme: ThemeMode) => {
    setState((current) => ({ ...current, theme }));
  };

  const setTempLoginData = (data: TempLoginData | null) => {
    setState((current) => ({ ...current, tempLoginData: data }));
  };

  const markNotificationsRead = () => {
    setState((current) => ({
      ...current,
      notifications: {
        ...current.notifications,
        unreadCount: 0,
      },
    }));
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      loginStudent,
      loginAdmin,
      logout,
      setTheme,
      markNotificationsRead,
      setTempLoginData,
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export function ProtectedRoute({
  children,
  requiredRole,
  redirectTo,
}: {
  children: ReactNode;
  requiredRole: "student" | "admin";
  redirectTo?: string;
}) {
  const { isAuthenticated, userType } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo ?? (requiredRole === "student" ? "/student/login" : "/admin/login")} replace state={{ from: location }} />;
  }

  if (userType !== requiredRole) {
    return <Navigate to={userType === "student" ? "/student" : "/admin"} replace />;
  }

  return <>{children}</>;
}

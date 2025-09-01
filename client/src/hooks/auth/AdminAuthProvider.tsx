import {
  deleteCookie,
  getCookie,
  setCookie,
  TOKEN_COOKIE,
} from "@/utils/cookie.utils";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type AdminAuthState = {
  token: string | null;
  username: string | null;
  isAuthed: boolean;
  isLoading: boolean;
  login: (args: { username: string; password: string }) => Promise<void>;
  logout: () => void;
};

export const AdminAuthContext = createContext<AdminAuthState>({
  token: null,
  username: null,
  isAuthed: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = getCookie(TOKEN_COOKIE);

    setToken(t);

    setIsLoading(false);
  }, []);

  const login = useCallback(
    async ({ username, password }: { username: string; password: string }) => {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Invalid credentials");
      }

      const t = data.token as string;
      const u = (data.username as string) ?? null;

      setCookie(TOKEN_COOKIE, t, 86400);

      setToken(t);

      setUsername(u);
    },
    [],
  );

  const logout = useCallback(() => {
    deleteCookie(TOKEN_COOKIE);
    setToken(null);
    setUsername(null);
  }, []);

  const value = useMemo(
    () => ({
      token,
      username,
      isAuthed: Boolean(token),
      isLoading,
      login,
      logout,
    }),
    [token, username, isLoading, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

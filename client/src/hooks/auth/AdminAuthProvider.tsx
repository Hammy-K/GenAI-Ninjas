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
  // noop defaults
  login: async () => {},
  logout: () => {},
});

const STORAGE_KEY = "admin_auth_token_v1";

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token) {
          setToken(parsed.token);
          setUsername(parsed.username ?? null);
        }
      }
    } finally {
      setIsLoading(false);
    }
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

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setToken(data.token);
      setUsername(data.username ?? null);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
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

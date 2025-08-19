import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useAuthModal() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const params = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  );

  // Deep link: ?auth=sign-in
  useEffect(() => {
    if (params.get("auth") === "sign-in") setOpen(true);
  }, [params]);

  const close = () => {
    setOpen(false);
    if (params.has("auth")) {
      params.delete("auth");
      navigate(
        { pathname: location.pathname, search: params.toString() },
        { replace: true },
      );
    }
  };

  return { open, setOpen, close };
}

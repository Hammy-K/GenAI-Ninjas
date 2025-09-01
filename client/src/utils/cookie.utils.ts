export const TOKEN_COOKIE = "admin_token";

export function setCookie(
  name: string,
  value: string,
  maxAgeSeconds: number,
  opts?: { domain?: string; path?: string },
) {
  const parts = [
    `${name}=${value}`,
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`,
    `Path=${opts?.path ?? "/"}`,
    "SameSite=Lax",
    "Secure", // assume HTTPS
  ];

  if (opts?.domain) parts.push(`Domain=${opts.domain}`);

  document.cookie = parts.join("; ");
}

export function getCookie(name: string): string | null {
  return (
    document.cookie
      .split("; ")
      .map((c) => c.split("="))
      .find(([k]) => k === name)?.[1] ?? null
  );
}

export function deleteCookie(
  name: string,
  opts?: { domain?: string; path?: string },
) {
  document.cookie = `${name}=; Max-Age=0; Path=${opts?.path ?? "/"}; ${opts?.domain ? `Domain=${opts.domain}; ` : ""}SameSite=Lax; Secure`;
}

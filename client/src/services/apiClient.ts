export const apiClient = (() => {
  let token: string | null = null;

  function setToken(t: string | null) {
    token = t;
  }

  async function get<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`/api/admin${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    if (res.status === 401) throw new Error("Unauthorized");

    if (!res.ok) throw new Error(await res.text());

    return res.json() as Promise<T>;
  }

  return { setToken, get };
})();

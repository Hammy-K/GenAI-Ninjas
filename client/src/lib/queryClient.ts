import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getUserId } from "../services/firebase-auth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Function to get a session ID from localStorage or create a new one
function getSessionId(prefix: string = 'user'): string {
  const key = `${prefix}_session_id`;
  let sessionId = localStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `${prefix}_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
    localStorage.setItem(key, sessionId);
  }
  
  return sessionId;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Add user identity information to the request data
  const firebaseUid = getUserId();
  const sessionId = getSessionId();
  
  // Combine original data with user identity
  const enrichedData = data 
    ? { 
        ...(typeof data === 'object' ? data : {}), 
        firebaseUid, 
        sessionId
      } 
    : { firebaseUid, sessionId };
  
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(enrichedData),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add user identity as query parameters for GET requests
    const url = new URL(queryKey[0] as string, window.location.origin);
    const firebaseUid = getUserId();
    const sessionId = getSessionId();
    
    // Add user identity to query params if available
    if (firebaseUid) {
      url.searchParams.append('firebaseUid', firebaseUid);
    }
    url.searchParams.append('sessionId', sessionId);
    
    const res = await fetch(url.toString(), {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

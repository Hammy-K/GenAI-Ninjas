import { useEffect } from "react";

/**
 * Keeps a scroll container pinned to bottom whenever deps change.
 * Pass a ref to a "bottom sentinel" div.
 */
export function useAutoScroll(
  bottomRef: React.RefObject<HTMLElement>,
  deps: any[],
) {
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

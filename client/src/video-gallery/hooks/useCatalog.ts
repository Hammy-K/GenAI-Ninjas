import { useMemo } from "react";
import { getAllCategories } from "../lib/video-gallery.selectors";

export function useCatalog() {
  const categories = useMemo(() => getAllCategories(), []);

  return { categories };
}

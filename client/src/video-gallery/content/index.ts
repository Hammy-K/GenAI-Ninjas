import { chatgptBasicsCategory } from "./categories/chatgpt-basics.config";
import { genaiForUtilityTasksCategory } from "./categories/genai-for-utility-tasks.config";
import { imageGeneration } from "./categories/image-generation.config";
import { programmingAndDevelopment } from "./categories/programming-and-development.config";
import { promptEngineering } from "./categories/prompt-engineering.config";
import { researchAndDataAnalysis } from "./categories/research-and-data-analysis";
import { Category } from "./video-gallery.types";

export const ALL_CATEGORIES: Category[] = [
  chatgptBasicsCategory,
  genaiForUtilityTasksCategory,
  imageGeneration,
  programmingAndDevelopment,
  promptEngineering,
  researchAndDataAnalysis,
].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

// Quick maps for O(1) lookups
export const CATEGORY_BY_SLUG: Record<string, Category> = Object.fromEntries(
  ALL_CATEGORIES.map((c) => [c.slug, c]),
);

export interface Message {
  role: "user" | "assistant";
  content: string;
  className?: string;
}
export interface ApiResponse {
  content: string;
}

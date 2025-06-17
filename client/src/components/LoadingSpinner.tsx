import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-32">
      <div className="relative">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
        <div className="absolute inset-0 w-12 h-12 border-2 border-purple-200 rounded-full animate-pulse"></div>
      </div>
    </div>
  );
}

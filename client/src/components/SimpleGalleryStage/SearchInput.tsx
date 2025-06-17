import React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = "... ابحث باسم الطالب",
}: SearchInputProps) {
  return (
    <div className="mb-6 max-w-md mx-auto">
      <div className="relative">
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-white pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-sm text-right"
          dir="auto"
        />

        {value && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
              onClick={() => onChange("")}
            >
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        )}
      </div>
      {/* {value && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          البحث عن: "{value}"
        </p>
      )} */}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useSchoolsSearch } from "@/hooks/useSearchSchools";

type Props = {
  value: { id: number | "other" | null; label: string } | null;
  onChange: (v: { id: number | "other" | null; label: string }) => void;
  className?: string; // control grid span from parent
};

export function SchoolSelect({ value, onChange, className }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const { data, isFetching } = useSchoolsSearch(input);
  const boxRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const results = useMemo(() => data ?? [], [data]);

  return (
    <div className={`relative ${className ?? ""}`} ref={boxRef} dir="rtl">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        المدرسة
      </label>

      <div className="relative">
        <input
          value={input}
          onChange={(e) => {
            const v = e.target.value;
            // typing clears selection chip
            if (value?.id) onChange({ id: null, label: "" });
            setInput(v);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="ابحث"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

        {/* chip inside the input (RTL: right side) */}
        {value?.id && (
          <button
            type="button"
            onClick={() => {
              onChange({ id: null, label: "" });
              setInput("");
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 max-w-[55%] truncate px-2 py-1 text-xs rounded-full border border-gray-300 bg-gray-50 hover:bg-gray-100"
            title={value.label}
          >
            <span className="font-medium">{value.label}</span>
            {/* {value.id === "other" && (
              <span className="text-amber-600"> (أخرى)</span>
            )} */}
            <span className="mx-1 text-gray-500">×</span>
          </button>
        )}
      </div>

      {open && (input.trim() || isFetching) && (
        <div
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto"
          role="listbox"
        >
          {isFetching && (
            <div className="p-3 text-sm text-gray-500">جاري البحث…</div>
          )}

          {!isFetching && results.length === 0 && (
            <div className="p-3 text-sm text-gray-500">لا توجد نتائج</div>
          )}

          {!isFetching &&
            results.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange({ id: s.id, label: s.name });
                  setInput(""); // rely on chip to show selection
                  setOpen(false);
                }}
                className={`w-full text-right px-3 py-2 text-sm hover:bg-gray-50 ${
                  value?.id === s.id
                    ? "bg-purple-50 border-r-2 border-purple-400"
                    : ""
                }`}
                role="option"
                aria-selected={value?.id === s.id}
              >
                <div className="font-medium">{s.name}</div>
                {s.city && (
                  <div className="text-gray-500 text-xs">{s.city}</div>
                )}
              </button>
            ))}

          {/* "Other" option */}
          {!isFetching && (
            <>
              <div className="my-1 border-t border-gray-100" />
              <button
                type="button"
                onClick={() => {
                  onChange({ id: "other", label: "مدرسة أخرى" });
                  setInput(""); // encourage writing name in notes
                  setOpen(false);
                }}
                className={`w-full text-right px-3 py-2 text-sm hover:bg-amber-50 ${
                  value?.id === "other"
                    ? "bg-amber-50 border-r-2 border-amber-400"
                    : ""
                }`}
                role="option"
                aria-selected={value?.id === "other"}
              >
                <span className="font-medium">مدرسة أخرى</span>
                <span className="text-gray-500 text-xs mr-2">
                  (ليست ضمن القائمة)
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

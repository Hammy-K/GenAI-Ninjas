type Props = {
  view: "featured" | "all";
  onChange: (v: "featured" | "all") => void;
};

export default function LovableViewSwitch({ view, onChange }: Props) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-1 shadow border border-purple-200">
      <div className="flex">
        <button
          className={`px-3 py-1 rounded-lg transition-all ${
            view === "featured"
              ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow"
              : "text-purple-700 hover:bg-purple-100"
          }`}
          onClick={() => onChange("featured")}
        >
          المميزة
        </button>
        <button
          className={`px-3 py-1 rounded-lg transition-all ${
            view === "all"
              ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow"
              : "text-purple-700 hover:bg-purple-100"
          }`}
          onClick={() => onChange("all")}
        >
          الكل
        </button>
      </div>
    </div>
  );
}

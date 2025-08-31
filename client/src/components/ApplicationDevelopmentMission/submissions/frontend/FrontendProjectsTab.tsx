export type FrontendSubMission =
  | "inputs-outputs"
  | "buttons-events"
  | "random-selection"
  | "conditional-logic"
  | "layout-design"
  | "dynamic-images";

type TabsProps = {
  activeTab: FrontendSubMission;
  onTabChange: (tab: FrontendSubMission) => void;
};

const TABS: { key: FrontendSubMission; label: string }[] = [
  { key: "inputs-outputs", label: "المدخلات والمخرجات" },
  { key: "buttons-events", label: "الأزرار والأحداث" },
  { key: "random-selection", label: "الاختيار العشوائي" },
  { key: "conditional-logic", label: "المنطق الشرطي" },
  { key: "layout-design", label: "التصميم والتخطيط" },
  { key: "dynamic-images", label: "الصور الديناميكية" },
];

export default function ProjectTabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="overflow-x-auto py-1">
      <div className="inline-flex bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-1 shadow border border-purple-200">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              className={`px-2 py-1 rounded-lg transition-all whitespace-nowrap ${
                active
                  ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow"
                  : "text-purple-700 hover:bg-purple-100"
              }`}
              onClick={() => onTabChange(t.key)}
              aria-pressed={active}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

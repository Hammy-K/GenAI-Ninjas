import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type Tab = { key: string; label: string };
type Props = {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
};

export default function CategoryTabs({
  tabs,
  active,
  onChange,
  className,
}: Props) {
  return (
    <div className={cn("flex justify-center", className)} dir="rtl">
      <motion.div
        className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-2 shadow-lg border border-purple-200 backdrop-blur-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex gap-2" role="tablist">
          {tabs.map((t, index) => {
            const isActive = t.key === active;
            return (
              <motion.button
                key={t.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(t.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md font-medium whitespace-nowrap text-sm",
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md"
                    : "text-purple-700 hover:bg-purple-100 hover:text-purple-800",
                )}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: isActive ? 1.05 : 1 }}
                whileHover={{ scale: isActive ? 1.05 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
              >
                {t.label}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

// import { cn } from "@/lib/utils";

// type Tab = { key: string; label: string };

// type Props = {
//   tabs: Tab[];
//   active: string;
//   onChange: (key: string) => void;
//   className?: string;
// };

// export default function CategoryTabs({
//   tabs,
//   active,
//   onChange,
//   className,
// }: Props) {
//   return (
//     <div className={cn("w-full", className)} dir="rtl" role="tablist">
//       <div className="flex flex-wrap gap-2 justify-center">
//         {tabs.map((t) => {
//           const isActive = t.key === active;
//           return (
//             <button
//               key={t.key}
//               role="tab"
//               aria-selected={isActive}
//               onClick={() => onChange(t.key)}
//               className={cn(
//                 "px-4 py-2 rounded-full text-sm font-medium border transition",
//                 isActive
//                   ? "bg-violet-600 text-white border-violet-700 shadow"
//                   : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50",
//               )}
//             >
//               {t.label}
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

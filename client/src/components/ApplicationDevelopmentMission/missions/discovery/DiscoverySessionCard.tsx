// import React from "react";
// import {
//   Lightbulb,
//   Users,
//   Trophy,
//   Clock,
//   Target,
//   ArrowLeft,
//   Sparkles,
//   Code,
// } from "lucide-react";
// import { useQuest } from "@/hooks/useQuest";
// import { Header } from "../layout/Header";

// // Reusable Session Card Component
// const SessionCard = ({
//   icon: Icon,
//   title,
//   goal,
//   concept,
//   flow,
//   duration,
//   color,
//   isCompleted = false,
// }) => (
//   <div
//     className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border-l-4"
//     style={{ borderLeftColor: color }}
//   >
//     <div className="flex items-center justify-between mb-4">
//       <div className="flex items-center gap-3">
//         <div
//           className="p-2 rounded-lg"
//           style={{ backgroundColor: `${color}20` }}
//         >
//           <Icon className="w-5 h-5" style={{ color }} />
//         </div>
//         <h3 className="text-lg font-bold text-gray-800">{title}</h3>
//       </div>
//       {isCompleted && <Trophy className="w-5 h-5 text-yellow-500" />}
//     </div>

//     <div className="space-y-4">
//       <div>
//         <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
//           <Target className="w-4 h-4 text-green-600" />
//           الهدف:
//         </h4>
//         <p className="text-gray-600">{goal}</p>
//       </div>

//       <div>
//         <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
//           <Lightbulb className="w-4 h-4 text-yellow-600" />
//           المفهوم:
//         </h4>
//         <p className="text-gray-600">{concept}</p>
//       </div>

//       <div>
//         <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
//           <Clock className="w-4 h-4 text-blue-600" />
//           التدفق ({duration} دقيقة):
//         </h4>
//         <ol className="text-gray-600 space-y-1">
//           {flow.map((step, index) => (
//             <li key={index} className="flex gap-2">
//               <span className="text-sm font-medium text-gray-400 mt-0.5">
//                 {index + 1}.
//               </span>
//               <span>{step}</span>
//             </li>
//           ))}
//         </ol>
//       </div>
//     </div>
//   </div>
// );

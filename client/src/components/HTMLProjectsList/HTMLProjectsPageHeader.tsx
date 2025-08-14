import { useLocation } from "wouter";
import { Button } from "../ui/button";
import { Gamepad2 } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import NoonBlacklogo from "@/assets/noon-black-logo.svg";
import MCITWhiteLogo from "@/assets/MCITlogo.png";

export default function HTMLProjectsPageHeader() {
  const [location, setLocation] = useLocation();
  const organization = useOrganization();

  const goToHtmlGenerator = () => {
    const destinationUrl = organization.isMain
      ? "/missions/ai-html-generator"
      : `/${organization.name}/missions/ai-html-generator`;

    setLocation(destinationUrl);
  };

  return (
    <div className="w-full">
      <div className="flex items-center mb-2 justify-center">
        <div className="w-40 h-16">
          <img
            src={MCITWhiteLogo}
            alt="MCIT Logo"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="text-gray-400 text-sm select-none ml-8">×</div>

        <div className="w-24 h-8 flex items-center justify-center overflow-hidden">
          <img
            src={NoonBlacklogo}
            alt="GenAI Quest Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {!organization.isMain && (
          <>
            <div className="text-gray-400 text-sm select-none mx-8">×</div>
            <div className="w-32 h-16 rounded-lg overflow-hidden">
              <img
                src={organization.logo}
                alt={`${organization.name} logo`}
                className="w-full h-full object-contain"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex flex-rows w-full justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="text-right">
              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-800 to-indigo-700 bg-clip-text text-transparent">
                مشاريع الطلاب
              </h1>
              <p className="text-lg text-gray-700 leading-relaxed">
                جميع المشاريع المعروضة في هذا التطبيق تم إنشاؤها بواسطة الطلاب
                باستخدام الذكاء الاصطناعي
              </p>
            </div>
          </div>
        </div>

        <div>
          <Button
            variant="default"
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
            onClick={goToHtmlGenerator}
          >
            <Gamepad2 className="h-5 w-5" />
            <span>العودة الى تصميم الالعاب</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// import { useLocation } from "wouter";
// import { Button } from "../ui/button";
// import { Gamepad2 } from "lucide-react";
// import { useOrganization } from "@/hooks/useOrganization";

// export default function HTMLProjectsPageHeader() {
//   const [location, setLocation] = useLocation();
//   const organization = useOrganization();

//   const goToHtmlGenerator = () => {
//     setLocation("/missions/ai-html-generator");
//   };
//   return (
//     <div className="w-full">
//       {!organization.isMain && (
//         <div className="w-full mb-2">
//           <div className="w-64 h-20 rounded-lg mx-auto">
//             <img
//               src={organization.logo}
//               alt={`${organization.name} logo`}
//               className="w-full h-full object-contain"
//             />
//           </div>
//         </div>
//       )}

//       <div className="flex flex-rows w-full justify-between">
//         <div className="">
//           <div className="flex items-center justify-between mb-6">
//             <div className="text-right">
//               <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-800 to-indigo-700 bg-clip-text text-transparent">
//                 مشاريع الطلاب
//               </h1>
//               <p className="text-lg text-gray-700 leading-relaxed">
//                 جميع المشاريع المعروضة في هذا التطبيق تم إنشاؤها بواسطة الطلاب
//                 باستخدام الذكاء الاصطناعي
//               </p>
//             </div>
//           </div>
//         </div>

//         <div className="">
//           <Button
//             variant="default"
//             className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold"
//             onClick={goToHtmlGenerator}
//           >
//             <Gamepad2 className="h-5 w-5" />
//             <span>العودة الى تصميم الالعاب</span>
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// }

import MCITWhiteLogo from "@/assets/MCITlogo.png";
import logoImage from "@/assets/noon-black-logo.svg";

export function LogosHeader() {
  return (
    <div className="w-full flex items-center justify-center gap-6">
      <img
        src={MCITWhiteLogo}
        alt="MCIT"
        className="h-16 w-auto object-contain"
      />

      <span className="text-gray-300">×</span>

      <img src={logoImage} alt="Noon" className="h-6 w-auto object-contain" />
    </div>
  );
}

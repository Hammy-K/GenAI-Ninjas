import NoonBlacklogo from "@/assets/noon-black-logo.svg";
import MCITWhiteLogo from "@/assets/MCITlogo.png";
import { useOrganization } from "@/hooks/useOrganization";

export default function AppDecHeaderLogos() {
  const organization = useOrganization();

  return (
    <div className="flex items-center justify-center">
      <div className="w-40 h-12">
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
  );
}

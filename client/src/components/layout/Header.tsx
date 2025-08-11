import { useTranslation } from "react-i18next";
import { Home, ImageIcon } from "lucide-react";
import { useLocation } from "wouter";
import logoImage from "../../assets/logo.png";
// import { useOrganization } from "@/hooks/useOrganization";
import MCITWhiteLogo from "@/assets/MCIT-white-logo.png";

interface HeaderProps {
  xp: number;
}

export function Header({ xp }: HeaderProps) {
  const { t } = useTranslation();
  const [location, navigate] = useLocation();

  // const organization = useOrganization();

  const handleHomeClick = () => {
    navigate("/");
  };

  const handleGalleryClick = () => {
    navigate("/gallery");
  };

  return (
    <header className="bg-primary px-4 py-1 flex justify-between items-center sticky top-0 z-30 shadow-md">
      <div className="flex items-center space-x-reverse space-x-2">
        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
          <img
            src={logoImage}
            alt="GenAI Quest Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-white font-bold text-xl">{t("app_name")}</h1>

        <div className="border border-right border-gray-300 rounded-lg h-10" />

        <div className="w-40 h-16">
          <img
            src={MCITWhiteLogo}
            alt="MCIT Logo"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* {!organization.isMain && (
        <div className="w-40 h-14 bg-white rounded-lg">
          <img
            src={organization.logo}
            alt={`${organization.name} logo`}
            className="w-full h-full object-contain"
          />
        </div>
      )} */}

      <div className="flex items-center space-x-reverse space-x-3">
        <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full flex items-center">
          <span className="text-white font-bold">{t("xp", { count: xp })}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-yellow-300 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <button
          className="text-white hover:text-white/80 focus:outline-none transition-colors ml-2"
          title={t("gallery")}
          aria-label={t("gallery")}
          onClick={handleGalleryClick}
        >
          <ImageIcon className="h-6 w-6" />
        </button>

        <button
          className="text-white hover:text-white/80 focus:outline-none transition-colors"
          title={t("home")}
          aria-label={t("home")}
          onClick={handleHomeClick}
        >
          <Home className="h-6 w-6" />
        </button>
      </div>
    </header>
  );
}

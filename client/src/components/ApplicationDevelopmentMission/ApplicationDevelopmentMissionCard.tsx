import { useOrganization } from "@/hooks/useOrganization";
import React from "react";
import { useLocation } from "wouter";
import { Lock, ArrowRight } from "lucide-react";

interface ApplicationDevelopmentMissionCardPropsType {
  icon: any;
  title: string;
  description: string;
  features: string[];
  path: string;
  colorVar: string;
  missions: number;
  isLocked: boolean;
}

export const ApplicationDevelopmentMissionCard = ({
  icon: Icon,
  title,
  description,
  features,
  path,
  colorVar,
  missions,
  isLocked = false,
}: ApplicationDevelopmentMissionCardPropsType) => {
  const [location, navigate] = useLocation();
  const organization = useOrganization();

  const handleClick = () => {
    if (!isLocked) {
      const destinationUrl = organization.isMain
        ? path
        : `/${organization.name}${path}`;
      navigate(destinationUrl);
    }
  };

  return (
    <div
      className={`bg-card/80 backdrop-blur-sm rounded-2xl shadow-normal border transition-all duration-300 overflow-hidden ${
        isLocked
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:shadow-elevated hover:-translate-y-1"
      }`}
      style={{ borderColor: isLocked ? "var(--color-border)" : colorVar }}
      onClick={handleClick}
    >
      {/* Header Section */}
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-subtle"
              style={{ backgroundColor: colorVar, opacity: 0.15 }}
            >
              <Icon className="w-6 h-6" style={{ color: colorVar }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              <span className="text-xs text-muted">{missions} مهام</span>
            </div>
          </div>

          {isLocked ? (
            <Lock className="w-5 h-5 text-muted" />
          ) : (
            <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary transition-colors" />
          )}
        </div>

        <p className="text-muted text-sm leading-relaxed mb-4">
          {description}
        </p>
      </div>

      {/* Features Section */}
      <div className="px-6 pb-6">
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 text-sm text-foreground"
            >
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: colorVar }}
              />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Accent */}
      <div className="h-1 w-full" style={{ backgroundColor: colorVar }} />
    </div>
  );
};

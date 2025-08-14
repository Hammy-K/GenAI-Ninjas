import { useOrganization } from "@/hooks/useOrganization";
import React from "react";
import { useLocation } from "wouter";

interface ApplicationDevelopmentMissionCardPropsType {
  icon: any;
  title: string;
  description: string;
  features: string[];
  path: string;
  color: string;
  isLocked: boolean;
}

export const ApplicationDevelopmentMissionCard = ({
  icon: Icon,
  title,
  description,
  features,
  path,
  color,
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
      className={`bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-l-4 ${
        isLocked
          ? "opacity-60 cursor-not-allowed"
          : "cursor-pointer hover:scale-105"
      }`}
      style={{ borderLeftColor: color }}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="p-3 rounded-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        {isLocked && <span className="text-sm text-gray-500">🔒</span>}
      </div>

      <p className="text-gray-600 mb-4 leading-relaxed">{description}</p>

      <div className="space-y-2">
        {features.map((feature, index) => (
          <div
            key={index}
            className="flex items-center gap-2 text-sm text-gray-600"
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color }}
            ></div>
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

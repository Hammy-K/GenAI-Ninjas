import React from "react";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useOrganization } from "@/hooks/useOrganization";
import { Concept } from "../../playground/config/types";

export const FrontendConceptCard = ({
  Icon,
  title,
  description,
  examples, // Keep for compatibility but won't use
  color,
  isCompleted = false,
  url,
}: Concept) => {
  const [location, navigate] = useLocation();
  const organization = useOrganization();

  const handleClick = () => {
    const destinationUrl = organization.isMain
      ? url
      : `/${organization.name}${url}`;
    navigate(destinationUrl);
  };

  return (
    <div
      className={`bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isCompleted
          ? "border-green-300 bg-green-50"
          : "border-gray-200 hover:border-purple-300"
      }`}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
            isCompleted ? "bg-green-100" : ""
          }`}
          style={{ backgroundColor: isCompleted ? "#dcfce7" : `${color}20` }}
        >
          <Icon
            className="w-6 h-6"
            style={{ color: isCompleted ? "#10b981" : color }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
        </div>

        <div className="flex-shrink-0">
          {isCompleted ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-xs font-semibold text-green-600">
                مكتمل
              </span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xs">ابدأ</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

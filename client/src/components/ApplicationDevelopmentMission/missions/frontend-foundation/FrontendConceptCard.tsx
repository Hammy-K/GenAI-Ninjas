import React from "react";
import { CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useOrganization } from "@/hooks/useOrganization";

interface FrontendConceptPropsType {
  Icon: any;
  title: string;
  description: string;
  examples: string[];
  color: string;
  isCompleted?: boolean;
  url: string;
}

export const FrontendConceptCard = ({
  Icon,
  title,
  description,
  examples,
  color,
  isCompleted = false,
  url,
}: FrontendConceptPropsType) => {
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
      className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border-l-4"
      style={{ borderLeftColor: color }}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        </div>
        {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
      </div>

      <p className="text-gray-600 mb-4">{description}</p>

      <div>
        <h4 className="font-semibold text-gray-700 mb-2">أمثلة التطبيق:</h4>
        <ul className="space-y-1">
          {examples.map((example, index) => (
            <li
              key={index}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              ></div>
              <span>{example}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

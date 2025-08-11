import { useLocation } from "wouter";
import FFMLogo from "@/assets/ffm-logo.png";

type OrganizationInfo = {
  name: string;
  logo?: string;
  isMain?: boolean;
};

const ORG_MAP: Record<string, OrganizationInfo> = {
  ffm: {
    name: "ffm",
    logo: FFMLogo,
  },
  general: {
    name: "general",
    isMain: true,
  },
} as const;

export function useOrganization(): OrganizationInfo {
  const [location] = useLocation();
  const firstSegment = location.split("/")[1]?.toLowerCase();

  const org =
    firstSegment && firstSegment in ORG_MAP
      ? ORG_MAP[firstSegment]
      : ORG_MAP.general;

  return {
    ...org,
    isMain: org.isMain ?? false,
  };
}

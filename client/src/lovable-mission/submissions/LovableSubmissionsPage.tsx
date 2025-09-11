import { useLocation } from "wouter";
import LovableProjectsPageHeader from "./LovableProjectsPageHeader";
import LovableFeaturedList from "./LovableFeaturedList";

export default function LovableSubmissionsPage() {
  const [, navigate] = useLocation();

  return (
    <div
      className="px-48 mx-auto bg-[#f5f2e8] text-foreground font-tajawal h-screen"
      dir="rtl"
    >
      <LovableProjectsPageHeader
        title="📂 مشاريع Lovable"
        subtitle="تصفح المشاريع المنشورة من الطلاب"
        onGoHome={() => navigate("/missions/lovable")}
      />

      <LovableFeaturedList />
    </div>
  );
}

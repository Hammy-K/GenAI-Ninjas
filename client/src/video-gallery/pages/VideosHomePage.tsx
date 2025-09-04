import { useState, useMemo } from "react";
import { useCatalog } from "../hooks/useCatalog";
import { useCategory } from "../hooks/useCategory";
import CategoryTabs from "../components/CategoryTabs";
import VideoList from "../components/VideoList";
import { FileVideo, Sparkles, Home } from "lucide-react";
import { Link } from "wouter";
import { useOrganization } from "@/hooks/useOrganization";

export default function VideosHomePage() {
  const { categories } = useCatalog();
  const initial = categories[0]?.slug;
  const [active, setActive] = useState(initial);

  const { category, videos } = useCategory(active);
  const tabs = useMemo(
    () => categories.map((c) => ({ key: c.slug, label: c.title })),
    [categories],
  );

  const organization = useOrganization();
  const homeHref = organization.isMain ? "/" : `/${organization.name}`;

  return (
    <div className="min-h-screen bg-[#f5f2e8] font-sans" dir="rtl">
      <div className="max-w-6xl mx-auto p-2">
        <div className="mb-4 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-4 rounded-2xl border border-purple-200 shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2 justify-center">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileVideo className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold text-white">
                  معرض الفيديوهات
                </h1>
                <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
              </div>
            </div>

            <p className="text-purple-100 text-center">
              اختر فئة من التبويبات أدناه لعرض فيديوهاتها
            </p>

            <div className="mt-3 flex justify-center">
              <Link to={homeHref}>
                <a
                  className="
                    inline-flex items-center gap-2 px-4 py-1 rounded-xl
                    bg-white/15 text-white border border-white/20
                    hover:bg-white/25 transition
                  "
                >
                  <Home className="w-4 h-4" />
                  <span>العودة للرئيسية</span>
                </a>
              </Link>
            </div>
          </div>
        </div>

        <CategoryTabs
          tabs={tabs}
          active={active ?? ""}
          onChange={setActive}
          className="mb-4"
        />

        {category?.description && (
          // {<div className="bg-white rounded-xl p-4 shadow-md border border-purple-100 mb-6 text-gray-700 text-center">}
          <div className="text-gray-700 text-center mb-4">
            {category.description}
          </div>
        )}

        {active && <VideoList categorySlug={active} videos={videos} />}
      </div>
    </div>
  );
}

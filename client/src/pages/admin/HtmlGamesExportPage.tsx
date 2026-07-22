import { useState } from "react";
import * as Select from "@radix-ui/react-select";
import * as Label from "@radix-ui/react-label";
import {
  Download,
  Calendar,
  User,
  School,
  Hash,
  AlertCircle,
  Check,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { useHtmlGamesExport } from "@/hooks/html-projects/useHtmlGamesExport";
import { HtmlGamesExportFormData } from "@/types/admin/html-games.types";
import * as Tooltip from "@radix-ui/react-tooltip";

export default function HtmlGamesExportPage() {
  const { isExporting, error, exportProjects, clearError } =
    useHtmlGamesExport();

  const [formData, setFormData] = useState<HtmlGamesExportFormData>({
    organization: "all",
    from: "",
    to: "",
    school: "",
    name: "",
    n: "1",
  });

  const handleInputChange = (
    field: keyof HtmlGamesExportFormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await exportProjects(formData);
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-background rounded-lg shadow-sm p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              تصدير مشاريع HTML الألعاب
            </h1>
            <p className="text-muted text-sm">
              قم بتخصيص معايير التصدير واحصل على ملف CSV
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Organization (Radix Select + small help tooltip) */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label.Root
                    htmlFor="org-select"
                    className="block text-sm font-medium text-foreground"
                  >
                    الجهة (Organization)
                  </Label.Root>

                  <Tooltip.Provider delayDuration={150}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          type="button"
                          aria-label="شرح الخيارات"
                          className="inline-flex items-center rounded p-0.5 text-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <HelpCircle className="w-4 h-4" />
                        </button>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          side="left"
                          align="center"
                          className="max-w-xs rounded-md bg-card px-3 py-2 text-foreground shadow-lg text-left"
                          dir="ltr"
                        >
                          <div>
                            <span className="font-semibold">1. all</span>:
                            fetches all projects
                          </div>
                          <div>
                            <span className="font-semibold">2. main</span>:
                            GenAI (الرئيسية)
                          </div>
                          <div>
                            <span className="font-semibold">3. ffm</span>: Fund
                            for Martyr — صندوق الشهداء والمصابين والأسرى
                            والمفقودين
                          </div>
                          <Tooltip.Arrow className="fill-gray-100" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                </div>

                <Select.Root
                  value={formData.organization}
                  onValueChange={(v) =>
                    handleInputChange(
                      "organization",
                      v as HtmlGamesExportFormData["organization"],
                    )
                  }
                >
                  <Select.Trigger
                    id="org-select"
                    className="inline-flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-sm shadow-sm hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Organization"
                  >
                    <Select.Value />
                    <Select.Icon>
                      <ChevronDown className="w-4 h-4" />
                    </Select.Icon>
                  </Select.Trigger>

                  <Select.Portal>
                    <Select.Content className="overflow-hidden rounded-md border border-border bg-background shadow-lg">
                      <Select.Viewport className="p-1">
                        <SelectItem value="all" text="all" />
                        <SelectItem value="main" text="main" />
                        <SelectItem value="ffm" text="ffm" />
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              {/* n per student */}
              <div className="space-y-1.5">
                <Label.Root
                  htmlFor="n"
                  className="block text-sm font-medium text-foreground"
                >
                  <Hash className="w-4 h-4 inline ml-2" />
                  عدد المشاريع لكل طالب
                </Label.Root>
                <input
                  id="n"
                  type="number"
                  min="1"
                  value={formData.n}
                  onChange={(e) => handleInputChange("n", e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="1"
                  inputMode="numeric"
                />
              </div>

              {/* From */}
              <div className="space-y-1.5">
                <Label.Root
                  htmlFor="from"
                  className="block text-sm font-medium text-foreground"
                >
                  <Calendar className="w-4 h-4 inline ml-2" />
                  من تاريخ
                </Label.Root>
                <input
                  id="from"
                  type="date"
                  value={formData.from}
                  onChange={(e) => handleInputChange("from", e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* To */}
              <div className="space-y-1.5">
                <Label.Root
                  htmlFor="to"
                  className="block text-sm font-medium text-foreground"
                >
                  <Calendar className="w-4 h-4 inline ml-2" />
                  إلى تاريخ
                </Label.Root>
                <input
                  id="to"
                  type="date"
                  value={formData.to}
                  onChange={(e) => handleInputChange("to", e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* School */}
              <div className="space-y-1.5 md:col-span-1">
                <Label.Root
                  htmlFor="school"
                  className="block text-sm font-medium text-foreground"
                >
                  <School className="w-4 h-4 inline ml-2" />
                  المدرسة
                </Label.Root>
                <input
                  id="school"
                  type="text"
                  value={formData.school}
                  onChange={(e) => handleInputChange("school", e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="اسم المدرسة (اختياري)"
                />
              </div>

              {/* Student name */}
              <div className="space-y-1.5 md:col-span-1">
                <Label.Root
                  htmlFor="name"
                  className="block text-sm font-medium text-foreground"
                >
                  <User className="w-4 h-4 inline ml-2" />
                  اسم الطالب
                </Label.Root>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="اسم الطالب (اختياري)"
                />
              </div>
            </div>

            <div className="mt-8 w-full flex justify-center">
              <button
                type="submit"
                disabled={isExporting}
                className="w-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 rounded-md transition-colors flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    جاري التصدير...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    تصدير CSV
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/** Small helper to render Radix Select items consistently */
function SelectItem({
  value,
  text,
}: {
  value: "all" | "main" | "ffm";
  text: string;
}) {
  return (
    <Select.Item
      value={value}
      className="relative flex w-full select-none items-center rounded-[6px] px-3 py-2 text-sm outline-none data-[highlighted]:bg-card data-[state=checked]:font-medium"
    >
      <Select.ItemText>{text}</Select.ItemText>
      <Select.ItemIndicator className="absolute right-2 inline-flex items-center">
        <Check className="w-4 h-4" />
      </Select.ItemIndicator>
    </Select.Item>
  );
}

import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useLocation } from "wouter";
import { Database } from "lucide-react";

type HtmlProject = {
  id: number;
  projectId: string;
  html: string;
  firebaseUid: string | null;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
};

type Student = {
  id: string;
  fullName: string;
  schoolName: string;
  phoneNumber: string;
  createdAt: string;
};

type ProjectWithStudent = HtmlProject & {
  student?: Student;
};

export default function HtmlProjectsList() {
  const [projects, setProjects] = useState<ProjectWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchProjectsAndStudents() {
      try {
        const res = await fetch("/api/html-projects/submissions");
        if (!res.ok) throw new Error("فشل في تحميل المشاريع");
        const projectData: HtmlProject[] = await res.json();

        // Extract unique user IDs
        const userIds = Array.from(
          new Set(projectData.map((p) => p.userId).filter(Boolean)),
        );

        // Fetch students in parallel
        const studentPromises = userIds.map((id) =>
          fetch(`/api/students/${id}`).then((res) =>
            res.ok ? res.json() : null,
          ),
        );
        const studentResults = await Promise.all(studentPromises);

        // Map userId -> student
        const studentMap = new Map<string, Student>();

        studentResults.forEach((student) => {
          if (student && student.id) {
            studentMap.set(String(student.id), student);
          }
        });

        // Attach student to each project
        const enrichedProjects = projectData.map((project) => ({
          ...project,
          student: project.userId ? studentMap.get(project.userId) : undefined,
        }));

        setProjects(enrichedProjects);
      } catch (err: any) {
        setError(err.message || "حدث خطأ ما");
      } finally {
        setLoading(false);
      }
    }

    fetchProjectsAndStudents();
  }, []);

  const goToHtmlGenerator = () => {
    setLocation("/missions/html-generator");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-center text-red-500 bg-[#f5f2e8]">خطأ: {error}</p>
    );
  }

  return (
    <div className="bg-[#f5f2e8]">
      <div className="p-6 font-sans max-w-7xl mx-auto min-h-screen">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">مشاريع الطلاب</h1>
          <p className="text-gray-600 mb-4">
            جميع المشاريع المعروضة في هذا التطبيق تم إنشاؤها بواسطة الطلاب
            باستخدام تقنيات الذكاء الاصطناعي
          </p>

          <Button
            variant="default"
            className="flex items-center gap-2 mx-auto"
            onClick={goToHtmlGenerator}
          >
            <Database className="h-4 w-4" />
            <span>منشئ الويب بالذكاء الاصطناعي</span>
          </Button>
        </div>

        <div className="mb-6 max-w-md mx-auto">
          <input
            type="text"
            placeholder="ابحث باسم الطالب..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {projects.length === 0 ? (
          <p className="text-center text-gray-500 p-8">لا توجد مشاريع حالياً</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects
              .filter(
                (project) =>
                  !searchTerm.trim() ||
                  project.student?.fullName
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()),
              )
              .map((project) => (
                <div
                  key={project.id}
                  className="relative bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 cursor-pointer h-64"
                >
                  {/* Transparent overlay to capture clicks */}
                  <div
                    className="absolute inset-0 z-10"
                    onClick={() =>
                      window.open(
                        `https://noongenai.replit.app/project/${project.projectId}`,
                        "_blank",
                      )
                    }
                  ></div>

                  {/* iframe preview */}
                  <iframe
                    srcDoc={project.html}
                    title={`Preview of ${project.projectId}`}
                    sandbox="allow-scripts"
                    className="w-full h-2/3 border-0"
                    style={{ pointerEvents: "none" }}
                  ></iframe>

                  {/* Student Info Section */}
                  <div className="p-3 bg-[#fafafa] border-t text-sm z-20">
                    <p className="font-semibold text-lg text-center">
                      👤 {project.student?.fullName || "طالب غير معروف"}
                    </p>
                    <p className="text-gray-600 text-center">
                      🏫 {project.student?.schoolName || "مدرسة غير معروفة"}
                    </p>
                    <p className="text-gray-500 text-xs text-center">
                      🗓️ تاريخ المشروع:{" "}
                      {new Date(project.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

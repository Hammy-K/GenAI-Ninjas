import { useEffect, useState } from "react";

type HtmlProject = {
  id: number;
  project_id: string;
  html: string;
  firebase_uid: string | null;
  created_at: string;
  updated_at: string;
};

export default function HtmlProjectsList() {
  const [projects, setProjects] = useState<HtmlProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<HtmlProject | null>(
    null,
  );
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const res = await fetch("/api/html-projects/submissions");
        if (!res.ok) throw new Error("Failed to fetch submissions");
        const data = await res.json();
        setProjects(data);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const openProjectModal = (project: HtmlProject) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedProject(null);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );

  if (error) return <p className="text-center text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 font-sans max-w-6xl mx-auto bg-purple-100 min-h-screen">
      <div className="text-right mb-8">
        <h1 className="text-3xl font-bold mb-2">مشاريع الطلاب</h1>
        <p className="text-gray-600 mb-4">
          جميع المشاريع المقدمة في تطبيق Lovable
        </p>
      </div>

      {projects.length === 0 ? (
        <p className="text-center text-gray-500 p-8">لا توجد مشاريع حالياً</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 cursor-pointer h-48"
              onClick={() => openProjectModal(project)}
            >
              <iframe
                srcDoc={project.html}
                title={`Preview of ${project.project_id}`}
                className="w-full h-full"
                sandbox="allow-scripts"
              ></iframe>
            </div>
          ))}
        </div>
      )}

      {/* Modal for viewing project details */}
      {showModal && selectedProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold"></h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              <div className="bg-gray-100 rounded-lg h-full w-full overflow-hidden">
                <iframe
                  srcDoc={selectedProject.html}
                  title={`Full preview of ${selectedProject.project_id}`}
                  className="w-full h-full min-h-[80vh]"
                  sandbox="allow-scripts"
                ></iframe>
              </div>
            </div>
            <div className="border-t p-4 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// import { useEffect, useState } from "react";

// type HtmlProject = {
//   id: number;
//   project_id: string;
//   html: string;
//   firebase_uid: string | null;
//   created_at: string;
//   updated_at: string;
// };

// export default function HtmlProjectsList() {
//   const [projects, setProjects] = useState<HtmlProject[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     async function fetchProjects() {
//       try {
//         const res = await fetch("/api/html-projects/submissions");
//         if (!res.ok) throw new Error("Failed to fetch submissions");

//         const data = await res.json();
//         console.log("Fetched HTML projects data frontend:", data);
//         setProjects(data);
//       } catch (err: any) {
//         setError(err.message || "Something went wrong");
//       } finally {
//         setLoading(false);
//       }
//     }

//     fetchProjects();
//   }, []);

//   if (loading)
//     return (
//       <p className="text-center text-gray-600">Loading HTML projects...</p>
//     );
//   if (error) return <p className="text-center text-red-500">Error: {error}</p>;

//   return (
//     <div className="p-6 font-sans max-w-4xl mx-auto">
//       <h2 className="text-2xl font-semibold mb-4">HTML Project Submissions</h2>
//       {projects.length === 0 ? (
//         <p className="text-gray-500">No submissions found.</p>
//       ) : (
//         <ul className="space-y-6">
//           {projects.map((project) => (
//             <li
//               key={project.id}
//               className="p-4 border border-gray-300 rounded-lg shadow-sm"
//             >
//               <p>
//                 <span className="font-medium">Project ID:</span>{" "}
//                 {project.project_id}
//               </p>
//               <p>
//                 <span className="font-medium">Firebase UID:</span>{" "}
//                 {project.firebase_uid || "N/A"}
//               </p>
//               <p>
//                 <span className="font-medium">Created At:</span>{" "}
//                 {new Date(project.created_at).toLocaleString()}
//               </p>
//               <p>
//                 <span className="font-medium">Updated At:</span>{" "}
//                 {new Date(project.updated_at).toLocaleString()}
//               </p>
//               <details className="mt-2">
//                 <summary className="cursor-pointer text-blue-600 hover:underline">
//                   View HTML Content
//                 </summary>
//                 <pre className="bg-gray-100 p-2 mt-2 rounded overflow-x-auto text-sm">
//                   {project.html}
//                 </pre>
//               </details>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );
// }

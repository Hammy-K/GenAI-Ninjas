import React, { useState, useEffect } from "react";

const SubmissionsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("supervisor");
  const [submissionType, setSubmissionType] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");

  useEffect(() => {
    fetchSubmissionData();
  }, []);

  const fetchSubmissionData = async () => {
    try {
      const response = await fetch("/api/submissions-analytics");
      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading submissions data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center text-red-600">
          <p>Error loading data. Please try again.</p>
        </div>
      </div>
    );
  }

  const views = ["supervisor", "school", "grade", "gender"];

  const getTableData = () => {
    const viewKey = `by${activeView.charAt(0).toUpperCase()}${activeView.slice(1)}`;
    const viewData = data[viewKey] || {};

    return Object.entries(viewData)
      .map(([key, value]: [string, any]) => {
        let videoCount = 0;
        let lovableCount = 0;

        if (value.byProject) {
          Object.entries(value.byProject).forEach(
            ([project, count]: [string, any]) => {
              if (project.toLowerCase().includes("lovable")) {
                lovableCount += count;
              } else {
                videoCount += count;
              }
            },
          );
        }

        return {
          name: key || "Unknown",
          total: value.total || 0,
          video: videoCount,
          lovable: lovableCount,
          supervisorGender: value.supervisorGender || "unknown",
        };
      })
      .filter((row) => {
        // Apply gender filter based on supervisor's student gender
        if (genderFilter === "male") return row.supervisorGender === "male";
        if (genderFilter === "female") return row.supervisorGender === "female";
        return true;
      })
      .sort((a, b) => b.total - a.total);
  };

  const tableData = getTableData();
  const totalSubmissions = data.total || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Student Submissions Dashboard
          </h1>
          <p className="text-gray-600">
            Analytics across video and Lovable submissions
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Submissions</p>
              <p className="text-3xl font-bold text-blue-600">
                {totalSubmissions}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Video Submissions</p>
              <p className="text-3xl font-bold text-green-600">
                {data.videoTotal || 0}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Lovable Submissions</p>
              <p className="text-3xl font-bold text-purple-600">
                {data.lovableTotal || 0}
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Unique Students</p>
              <p className="text-3xl font-bold text-orange-600">
                {data.uniqueStudents || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Breakdown by Category
            </h2>

            <div className="flex flex-wrap gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  View By
                </label>
                <div className="flex gap-2">
                  {views.map((view) => (
                    <button
                      key={view}
                      onClick={() => setActiveView(view)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeView === view
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Submission Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSubmissionType("all")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      submissionType === "all"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSubmissionType("video")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      submissionType === "video"
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Video
                  </button>
                  <button
                    onClick={() => setSubmissionType("lovable")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      submissionType === "lovable"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Lovable
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender Filter
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGenderFilter("all")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      genderFilter === "all"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setGenderFilter("male")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      genderFilter === "male"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => setGenderFilter("female")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      genderFilter === "female"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Video
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lovable
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tableData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {row.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center justify-center w-16 h-8 rounded-full bg-blue-100 text-blue-800 font-semibold">
                        {row.total}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center justify-center w-16 h-8 rounded-full bg-green-100 text-green-800 font-semibold">
                        {row.video}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center justify-center w-16 h-8 rounded-full bg-purple-100 text-purple-800 font-semibold">
                        {row.lovable}
                      </span>
                    </td>
                  </tr>
                ))}
                {tableData.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No data available for this view
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionsDashboard;

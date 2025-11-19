import { FileEdit } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  color: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface DraftProjectsTableProps {
  projects: Project[];
  onPlan: (projectId: string) => void;
}

export default function DraftProjectsTable({
  projects,
  onPlan,
}: DraftProjectsTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-black w-12">
                Color
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                Project Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                Description
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                Start Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                Created At
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-black w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div
                    className="w-8 h-8 rounded-lg border border-gray-200"
                    style={{ backgroundColor: project.color }}
                    title={project.color}
                  />
                </td>
                <td className="px-6 py-4 text-sm text-black font-medium">
                  {project.name}
                </td>
                <td className="px-6 py-4 text-sm text-black">
                  {project.description || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-black">
                  {project.startDate
                    ? new Date(project.startDate).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-6 py-4 text-sm text-black">
                  {new Date(project.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => onPlan(project.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#2E6F40] text-white rounded-lg hover:bg-[#253D2C] transition-colors"
                    >
                      <FileEdit className="w-4 h-4" />
                      Plan
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

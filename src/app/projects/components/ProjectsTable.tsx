import { Pencil, Trash2, Map } from "lucide-react";
import { useRouter } from "next/navigation";

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

interface ProjectsTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export default function ProjectsTable({
  projects,
  onEdit,
  onDelete,
}: ProjectsTableProps) {
  const router = useRouter();

  const handleRoadmapClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

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
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                Start Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-black">
                Created At
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-black">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-black">
                  No projects yet. Create your first project to get started!
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
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
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : project.status === "Paused"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {project.status}
                    </span>
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
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleRoadmapClick(project.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Roadmap"
                      >
                        <Map className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(project)}
                        className="p-2 text-[#2E6F40] hover:bg-[#CFFFDC] rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(project)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

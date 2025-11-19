import { Pencil, Trash2 } from "lucide-react";

interface PlanningTask {
  id: string;
  title: string;
  description: string | null;
  order: number;
  projectId: string;
}

interface PlanningCardGalleryProps {
  tasks: PlanningTask[];
  projectColor: string;
  onEdit: (task: PlanningTask) => void;
  onDelete: (task: PlanningTask) => void;
  loading: boolean;
}

function PlanningSkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-6 bg-linear-to-b from-gray-100 to-white">
        {/* Order Badge Skeleton */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
        </div>

        {/* Title Skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
        </div>

        {/* Description Skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-4/6"></div>
        </div>
      </div>
    </div>
  );
}

export default function PlanningCardGallery({
  tasks,
  projectColor,
  onEdit,
  onDelete,
  loading,
}: PlanningCardGalleryProps) {
  // Convert hex to rgba for background
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h3 className="text-lg font-semibold text-black mb-2">
            No Planning Tasks Yet
          </h3>
          <p className="text-gray-600">
            Start planning by adding your first task
          </p>
        </div>
      </div>
    );
  }

  // Sort tasks by order
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedTasks.map((task, index) => {
        // Check if it's a temporary task (skeleton)
        const isTemporary = task.id.startsWith("temp-");

        if (isTemporary) {
          return <PlanningSkeletonCard key={task.id} />;
        }

        return (
          <div
            key={task.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
            style={{
              borderLeftWidth: "4px",
              borderLeftColor: projectColor,
            }}
          >
            <div
              className="p-6"
              style={{
                background: `linear-gradient(to bottom, ${hexToRgba(projectColor, 0.05)}, white)`,
              }}
            >
              {/* Order Badge */}
              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold"
                  style={{ backgroundColor: projectColor }}
                >
                  {index + 1}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEdit(task)}
                    disabled={loading}
                    className="p-2 text-[#2E6F40] hover:bg-[#CFFFDC] rounded-lg transition-colors disabled:opacity-50"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(task)}
                    disabled={loading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Task Title */}
              <h3 className="text-lg font-semibold text-black mb-2 line-clamp-2">
                {task.title}
              </h3>

              {/* Task Description */}
              {task.description && (
                <p className="text-sm text-gray-600 line-clamp-3">
                  {task.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

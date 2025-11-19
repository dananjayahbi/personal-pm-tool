import { Pencil, Trash2 } from "lucide-react";

interface PlanningTask {
  id: string;
  title: string;
  description: string | null;
  order: number;
  projectId: string;
}

interface RoadmapTaskCardProps {
  task: PlanningTask;
  index: number;
  isEven: boolean;
  onEdit: (task: PlanningTask) => void;
  onDelete: (task: PlanningTask) => void;
  loading: boolean;
  isTemporary?: boolean;
}

export default function RoadmapTaskCard({
  task,
  index,
  isEven,
  onEdit,
  onDelete,
  loading,
  isTemporary = false,
}: RoadmapTaskCardProps) {
  if (isTemporary) {
    return (
      <div className={`roadmap-step ${isEven ? "roadmap-step-right" : "roadmap-step-left"}`}>
        <div className="roadmap-card roadmap-card-skeleton">
          <div className="roadmap-card-content">
            <div className="h-5 bg-gray-300 rounded w-3/4 animate-pulse mb-3"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`roadmap-step ${isEven ? "roadmap-step-right" : "roadmap-step-left"}`}>
      {/* Milestone Circle */}
      <div className="roadmap-milestone">
        <div className="roadmap-milestone-inner">
          <span className="roadmap-milestone-number">{index + 1}</span>
        </div>
        <div className="roadmap-pulse"></div>
      </div>

      {/* Task Card */}
      <div className="roadmap-card group">
        <div className="roadmap-card-content">
          <h3 className="roadmap-card-title">{task.title}</h3>
          {task.description && (
            <p className="roadmap-card-description">{task.description}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="roadmap-card-actions">
          <button
            onClick={() => onEdit(task)}
            disabled={loading}
            className="roadmap-btn roadmap-btn-edit"
            title="Edit Task"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task)}
            disabled={loading}
            className="roadmap-btn roadmap-btn-delete"
            title="Delete Task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Decorative Arrow */}
        <div className="roadmap-arrow">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="roadmap-arrow-icon"
          >
            <path
              d={isEven ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

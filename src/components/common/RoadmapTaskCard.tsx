import { Pencil, Trash2, Eye } from "lucide-react";

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
  onView: (task: PlanningTask) => void;
  loading: boolean;
  isTemporary?: boolean;
}

export default function RoadmapTaskCard({
  task,
  index,
  isEven,
  onEdit,
  onDelete,
  onView,
  loading,
  isTemporary = false,
}: RoadmapTaskCardProps) {
  if (isTemporary) {
    return (
      <div className="roadmap-serpentine-task-card">
        <div className="roadmap-milestone-serpentine">
          <div className="roadmap-milestone-inner-serpentine">
            <span className="roadmap-milestone-number-serpentine animate-pulse">
              {index + 1}
            </span>
          </div>
        </div>
        <div className="roadmap-card-serpentine roadmap-card-skeleton">
          <div className="roadmap-card-content-serpentine">
            <div className="h-5 bg-gray-300 rounded w-3/4 animate-pulse mb-3"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="roadmap-serpentine-task-card">
      {/* Milestone Circle */}
      <div className="roadmap-milestone-serpentine">
        <div className="roadmap-milestone-inner-serpentine">
          <span className="roadmap-milestone-number-serpentine">{index + 1}</span>
        </div>
        <div className="roadmap-pulse-serpentine"></div>
      </div>

      {/* Task Card */}
      <div className="roadmap-card-serpentine group">
        <div className="roadmap-card-content-serpentine">
          <h3 className="roadmap-card-title-serpentine">{task.title}</h3>
        </div>

        {/* Action Buttons */}
        <div className="roadmap-card-actions-serpentine">
          <button
            onClick={() => onView(task)}
            disabled={loading}
            className="roadmap-btn roadmap-btn-view"
            title="View Task Details"
          >
            <Eye className="w-4 h-4" />
          </button>
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
      </div>
    </div>
  );
}

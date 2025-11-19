import { Pencil, Trash2, GripVertical } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  projectId: string;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onDragStart,
}: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="bg-gray-50 rounded-lg p-3 cursor-move hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-black mb-1">{task.title}</h4>
          {task.description && (
            <p className="text-sm text-black line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1 mt-2">
        <button
          onClick={() => onEdit(task)}
          className="p-1.5 text-[#2E6F40] hover:bg-[#CFFFDC] rounded transition-colors"
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(task)}
          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

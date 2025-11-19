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
  projectColor: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export default function TaskCard({
  task,
  projectColor,
  onEdit,
  onDelete,
  onDragStart,
}: TaskCardProps) {
  // Check if this is a temporary task (skeleton)
  const isTemporary = task.id.startsWith("temp-");

  // Convert hex color to RGB and apply opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(91, 79, 207, ${opacity})`; // fallback
    return `rgba(${
      parseInt(result[1], 16)}, ${
      parseInt(result[2], 16)}, ${
      parseInt(result[3], 16)}, ${
      opacity})`;
  };

  if (isTemporary) {
    return (
      <div
        className="rounded-lg p-3 border border-gray-200 bg-gray-50 animate-pulse"
      >
        <div className="flex items-start gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-5 bg-gray-300 rounded w-3/4" />
            <div className="h-4 bg-gray-300 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="rounded-lg p-3 cursor-move hover:shadow-md transition-all border border-gray-100"
      style={{ backgroundColor: hexToRgba(projectColor, 0.25) }}
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

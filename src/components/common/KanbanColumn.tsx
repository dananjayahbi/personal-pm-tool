import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  projectId: string;
}

interface KanbanColumnProps {
  status: {
    id: string;
    label: string;
    color: string;
  };
  tasks: Task[];
  onAddTask: (statusId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, statusId: string) => void;
}

export default function KanbanColumn({
  status,
  tasks,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDragStart,
  onDragOver,
  onDrop,
}: KanbanColumnProps) {
  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, status.id)}
    >
      {/* Column Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${status.color}`} />
          <h3 className="font-semibold text-gray-900">{status.label}</h3>
          <span className="text-sm text-black bg-gray-100 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status.id)}
          className="p-1 text-[#2E6F40] hover:bg-[#CFFFDC] rounded transition-colors"
          title="Add task"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Tasks */}
      <div className="space-y-3 min-h-[400px]">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import showToast from "@/lib/utils/toast";
import TaskCard from "@/app/task-board/components/TaskCard";
import TaskModal from "@/app/task-board/components/TaskModal";
import DeleteConfirmModal from "@/app/task-board/components/DeleteConfirmModal";
import { Calendar, RefreshCw } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  projectId: string;
  dueDate: string | null;
  dueTime: string | null;
  project: {
    id: string;
    name: string;
    color: string;
  };
}

interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
}

export default function UniversalKanbanPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [draggedOverTask, setDraggedOverTask] = useState<string | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
  });

  const statuses = [
    { id: "todo", label: "To Do", color: "bg-gray-500" },
    { id: "in-progress", label: "In Progress", color: "bg-blue-500" },
    { id: "done", label: "Done", color: "bg-green-500" },
  ];

  useEffect(() => {
    fetchTodaysTasks();
  }, []);

  const fetchTodaysTasks = async (silent: boolean = false) => {
    if (!silent) {
      setRefreshing(true);
    }
    try {
      const response = await fetch("/api/tasks/today");
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        showToast.error("Failed to fetch today's tasks");
      }
    } catch (error) {
      showToast.error("Failed to fetch today's tasks");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      dueTime: task.dueTime || "",
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (task: Task) => {
    setSelectedTask(task);
    setIsDeleteModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;

    if (!formData.title.trim()) {
      showToast.error("Task title is required");
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast.success("Task updated successfully");
        setIsEditModalOpen(false);
        fetchTodaysTasks(true);
      } else {
        showToast.error("Failed to update task");
      }
    } catch (error) {
      showToast.error("An error occurred while updating task");
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast.success("Task deleted successfully");
        setIsDeleteModalOpen(false);
        fetchTodaysTasks(true);
      } else {
        showToast.error("Failed to delete task");
      }
    } catch (error) {
      showToast.error("An error occurred while deleting task");
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      e.dataTransfer.setData("currentStatus", task.status);
    }
  };

  const handleDragOverTask = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDraggedOverTask(taskId);
  };

  const handleDragLeave = () => {
    setDraggedOverTask(null);
  };

  const handleDropOnTask = async (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverTask(null);

    const draggedTaskId = e.dataTransfer.getData("taskId");
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    const draggedTask = tasks.find(t => t.id === draggedTaskId);
    const targetTask = tasks.find(t => t.id === targetTaskId);
    if (!draggedTask || !targetTask) return;

    // Detect drop position (top half vs bottom half of card)
    const targetElement = e.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    const mouseY = e.clientY;
    const cardMiddle = rect.top + rect.height / 2;
    const insertBefore = mouseY < cardMiddle;

    // Get all tasks in the target status for proper ordering
    const targetStatus = targetTask.status;
    const tasksInTargetStatus = tasks.filter(t => t.status === targetStatus && t.id !== draggedTaskId);
    
    // Find the insertion index
    const targetIndexInStatus = tasksInTargetStatus.findIndex(t => t.id === targetTaskId);
    const insertIndex = insertBefore ? targetIndexInStatus : targetIndexInStatus + 1;

    // Insert the dragged task at the correct position
    tasksInTargetStatus.splice(insertIndex, 0, { ...draggedTask, status: targetStatus });

    // Recalculate order numbers
    tasksInTargetStatus.forEach((task, index) => {
      task.order = index + 1;
    });

    // Merge back with tasks from other statuses
    const otherStatusTasks = tasks.filter(t => t.status !== targetStatus && t.id !== draggedTaskId);
    const updatedTasks = [...otherStatusTasks, ...tasksInTargetStatus].sort((a, b) => {
      if (a.status !== b.status) {
        const statusOrder = { 'todo': 0, 'in-progress': 1, 'done': 2 };
        return (statusOrder[a.status as keyof typeof statusOrder] || 0) - (statusOrder[b.status as keyof typeof statusOrder] || 0);
      }
      return a.order - b.order;
    });

    // Optimistic UI update
    setTasks(updatedTasks);

    // Update backend
    try {
      const updatedTask = tasksInTargetStatus.find(t => t.id === draggedTaskId);
      if (updatedTask) {
        await fetch(`/api/tasks/${draggedTaskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            status: targetStatus,
            order: updatedTask.order 
          }),
        });
      }
    } catch (error) {
      showToast.error("Failed to reorder task");
      fetchTodaysTasks(true);
    }
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    setDraggedOverTask(null);

    const taskId = e.dataTransfer.getData("taskId");
    const currentStatus = e.dataTransfer.getData("currentStatus");

    if (currentStatus === newStatus) return;

    // Find the task being moved
    const taskToUpdate = tasks.find((task) => task.id === taskId);
    if (!taskToUpdate) return;

    // Store the old status for potential rollback
    const oldStatus = taskToUpdate.status;

    // Optimistic UI update
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    // Update database in background
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Rollback on failure
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, status: oldStatus } : task
          )
        );
        showToast.error("Failed to update task status");
      }
    } catch (error) {
      // Rollback on error
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: oldStatus } : task
        )
      );
      showToast.error("An error occurred while updating task status");
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2E6F40]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-black">Today's Tasks</h1>
            <button
              onClick={() => fetchTodaysTasks()}
              disabled={refreshing}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <p className="text-sm">{getTodayDate()}</p>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {tasks.length} task{tasks.length !== 1 ? "s" : ""} due today across all projects
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {statuses.map((status) => {
          const statusTasks = getTasksByStatus(status.id);
          return (
            <div
              key={status.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, status.id)}
            >
              {/* Column Header */}
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${status.color}`} />
                  <h3 className="font-semibold text-black">{status.label}</h3>
                  <span className="text-sm text-black bg-gray-100 px-2 py-0.5 rounded-full">
                    {statusTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-3 min-h-[400px]">
                {statusTasks.map((task) => (
                  <div
                    key={task.id}
                    className="relative"
                    onDragOver={(e) => handleDragOverTask(e, task.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDropOnTask(e, task.id)}
                  >
                    <TaskCard
                      task={task}
                      projectColor={task.project.color}
                      onEdit={() => handleEditTask(task)}
                      onDelete={() => handleDeleteClick(task)}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      isDraggedOver={draggedOverTask === task.id}
                    />
                    {/* Project Badge */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm border border-gray-200 pointer-events-none">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: task.project.color }}
                      />
                      <span className="text-xs font-medium text-gray-700">
                        {task.project.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* No Tasks Message */}
      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Calendar className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Tasks Due Today</h3>
          <p className="text-gray-500 text-center max-w-md">
            Great! You don't have any tasks due today. Take a break or work ahead on future tasks.
          </p>
        </div>
      )}

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateTask}
        formData={formData}
        setFormData={setFormData}
        loading={false}
        title="Edit Task"
        submitText="Update Task"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteTask}
        loading={false}
        title="Delete Task"
        message={`Are you sure you want to delete "${selectedTask?.title}"? This action cannot be undone.`}
        confirmText="Delete"
      />
    </div>
  );
}

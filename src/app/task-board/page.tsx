"use client";

import { useState, useEffect } from "react";
import showToast from "@/lib/utils/toast";
import KanbanSkeleton from "./components/KanbanSkeleton";
import KanbanColumn from "./components/KanbanColumn";
import TaskModal from "./components/TaskModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import ProjectDropdown from "./components/ProjectDropdown";
import SubTasksModal from "./components/SubTasksModal";

interface Project {
  id: string;
  name: string;
  color: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  projectId: string;
  dueDate: string | null;
  dueTime: string | null;
}

interface TaskFormData {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
}

export default function TaskBoardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [draggedOverTask, setDraggedOverTask] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubTasksModalOpen, setIsSubTasksModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("todo");

  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    dueDate: "",
    dueTime: "",
  });

  const statuses = [
    { id: "todo", label: "To Do", color: "bg-gray-100" },
    { id: "in-progress", label: "In Progress", color: "bg-blue-100" },
    { id: "done", label: "Done", color: "bg-green-100" },
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        // Filter to show only Active projects
        const activeProjects = data.projects.filter(
          (project: Project) => project.status === "Active"
        );
        setProjects(activeProjects);
        if (activeProjects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(activeProjects[0].id);
        }
      }
    } catch (error) {
      showToast.error("Failed to fetch projects");
    } finally {
      setPageLoading(false);
    }
  };

  const fetchTasks = async (projectId: string, silent: boolean = false) => {
    if (!silent) {
      setTasksLoading(true);
    }
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      showToast.error("Failed to fetch tasks");
    } finally {
      if (!silent) {
        setTasksLoading(false);
      }
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast.error("Task title is required");
      return;
    }

    // Create a temporary task ID for the skeleton
    const tempId = `temp-${Date.now()}`;
    const tempTask: Task = {
      id: tempId,
      title: formData.title,
      description: formData.description,
      status: selectedStatus,
      order: tasks.filter(t => t.status === selectedStatus).length + 1,
      projectId: selectedProjectId,
      dueDate: formData.dueDate || null,
      dueTime: formData.dueTime || null,
    };

    // Optimistic UI: Add skeleton task immediately and close modal
    setTasks((prevTasks) => [...prevTasks, tempTask]);
    setIsAddModalOpen(false);
    setFormData({ title: "", description: "", dueDate: "", dueTime: "" });

    // Add to database in background
    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: tempTask.title,
          description: tempTask.description,
          status: selectedStatus,
          dueDate: formData.dueDate || null,
          dueTime: formData.dueTime || null,
        }),
      });

      if (response.ok) {
        showToast.success("Task created successfully");
        // Refresh tasks to replace skeleton with actual data (silently, no full page loader)
        await fetchTasks(selectedProjectId, true);
      } else {
        showToast.error("Failed to create task");
        // Remove the skeleton task on failure
        setTasks((prevTasks) => prevTasks.filter((t) => t.id !== tempId));
      }
    } catch (error) {
      showToast.error("An error occurred");
      // Remove the skeleton task on error
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== tempId));
    }
  };

  const handleEditTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !formData.title.trim()) {
      showToast.error("Task title is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast.success("Task updated successfully");
        setIsEditModalOpen(false);
        setSelectedTask(null);
        setFormData({ title: "", description: "", dueDate: "", dueTime: "" });
        fetchTasks(selectedProjectId);
      } else {
        showToast.error("Failed to update task");
      }
    } catch (error) {
      showToast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast.success("Task deleted successfully");
        setIsDeleteModalOpen(false);
        setSelectedTask(null);
        fetchTasks(selectedProjectId);
      } else {
        showToast.error("Failed to delete task");
      }
    } catch (error) {
      showToast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragOverTask = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
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
    const insertBefore = mouseY < cardMiddle; // True if dropping on top half

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
      fetchTasks(selectedProjectId, true);
    }
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");

    // Find the task being moved
    const taskToUpdate = tasks.find((task) => task.id === taskId);
    if (!taskToUpdate) return;

    // Store the old status for potential rollback
    const oldStatus = taskToUpdate.status;

    // Optimistic UI update - update immediately
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    // Update database in background
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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
      showToast.error("An error occurred");
    }
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : "",
      dueTime: task.dueTime || "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (task: Task) => {
    setSelectedTask(task);
    setIsDeleteModalOpen(true);
  };

  const openSubTasksModal = (task: Task) => {
    setSelectedTask(task);
    setIsSubTasksModalOpen(true);
  };

  const closeSubTasksModal = () => {
    setIsSubTasksModalOpen(false);
    // Refresh tasks to update subtask counts
    if (selectedProjectId) {
      fetchTasks(selectedProjectId, true);
    }
    setSelectedTask(null);
  };

  const openAddModal = (status: string) => {
    setSelectedStatus(status);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setFormData({ title: "", description: "", dueDate: "", dueTime: "" });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTask(null);
    setFormData({ title: "", description: "", dueDate: "", dueTime: "" });
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTask(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  if (pageLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Task Board</h1>
            <p className="text-black mt-2">Manage your tasks with Kanban board</p>
          </div>
        </div>
        {/* Skeleton Loader */}
        <KanbanSkeleton />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-black">Task Board</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-black mb-4">
            No projects found. Create a project first to start managing tasks.
          </p>
          <a
            href="/projects"
            className="inline-block bg-[#2E6F40] text-white px-6 py-2 rounded-lg hover:bg-[#253D2C] transition-colors"
          >
            Go to Projects
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Task Board</h1>
          <p className="text-black mt-2">Manage your tasks with Kanban board</p>
        </div>
        <div className="flex items-center gap-4">
          <ProjectDropdown
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelect={setSelectedProjectId}
          />
        </div>
      </div>

      {/* Kanban Board */}
      {tasksLoading ? (
        <KanbanSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statuses.map((status) => (
            <KanbanColumn
              key={status.id}
              status={status}
              tasks={getTasksByStatus(status.id)}
              projectColor={projects.find(p => p.id === selectedProjectId)?.color || "#5B4FCF"}
              onAddTask={openAddModal}
              onEditTask={openEditModal}
              onDeleteTask={openDeleteModal}
              onViewSubTasks={openSubTasksModal}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragOverTask={handleDragOverTask}
              onDropOnTask={handleDropOnTask}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              draggedOverTaskId={draggedOverTask}
            />
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      <TaskModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSubmit={handleAddTask}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        title="Add New Task"
        submitText="Create Task"
      />

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleEditTask}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        title="Edit Task"
        submitText="Update Task"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteTask}
        loading={loading}
        title="Delete Task"
        message={`Are you sure you want to delete "${selectedTask?.title}"? This action cannot be undone.`}
        confirmText="Delete"
      />

      {/* SubTasks Modal */}
      <SubTasksModal
        isOpen={isSubTasksModalOpen}
        onClose={closeSubTasksModal}
        taskId={selectedTask?.id || ""}
        taskTitle={selectedTask?.title || ""}
      />
    </div>
  );
}

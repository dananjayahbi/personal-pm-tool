"use client";

import { useState, useEffect } from "react";
import showToast from "@/lib/utils/toast";
import KanbanColumn from "./components/KanbanColumn";
import TaskModal from "./components/TaskModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";

interface Project {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  order: number;
  projectId: string;
}

interface TaskFormData {
  title: string;
  description: string;
}

export default function TaskBoardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("todo");

  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
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
        setProjects(data.projects);
        if (data.projects.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data.projects[0].id);
        }
      }
    } catch (error) {
      showToast.error("Failed to fetch projects");
    }
  };

  const fetchTasks = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      showToast.error("Failed to fetch tasks");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      showToast.error("Task title is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: selectedStatus,
        }),
      });

      if (response.ok) {
        showToast.success("Task created successfully");
        setIsAddModalOpen(false);
        setFormData({ title: "", description: "" });
        fetchTasks(selectedProjectId);
      } else {
        showToast.error("Failed to create task");
      }
    } catch (error) {
      showToast.error("An error occurred");
    } finally {
      setLoading(false);
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
        setFormData({ title: "", description: "" });
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
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");

    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        showToast.success("Task status updated");
        fetchTasks(selectedProjectId);
      } else {
        showToast.error("Failed to update task status");
      }
    } catch (error) {
      showToast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (task: Task) => {
    setSelectedTask(task);
    setIsDeleteModalOpen(true);
  };

  const openAddModal = (status: string) => {
    setSelectedStatus(status);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setFormData({ title: "", description: "" });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTask(null);
    setFormData({ title: "", description: "" });
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTask(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

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
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E6F40] text-black bg-white"
          >
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statuses.map((status) => (
          <KanbanColumn
            key={status.id}
            status={status}
            tasks={getTasksByStatus(status.id)}
            onAddTask={openAddModal}
            onEditTask={openEditModal}
            onDeleteTask={openDeleteModal}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>

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
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import showToast from "@/lib/utils/toast";
import ProjectRoadmapGallery from "./components/ProjectRoadmapGallery";
import ProjectTaskModal from "./components/ProjectTaskModal";
import ProjectDeleteConfirmModal from "./components/ProjectDeleteConfirmModal";

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  order: number;
  projectId: string;
  status: string;
}

interface TaskFormData {
  title: string;
  description: string;
}

export default function ProjectRoadmapPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
  });

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchTasks();
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else {
        showToast.error("Failed to fetch project");
        router.push("/projects");
      }
    } catch (error) {
      showToast.error("An error occurred");
      router.push("/projects");
    } finally {
      setPageLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (response.ok) {
        const data = await response.json();
        // Filter tasks that belong to this project and are not planning tasks
        const projectTasks = data.tasks.filter(
          (task: Task) => task.projectId === projectId && task.status !== "planning"
        );
        setTasks(projectTasks);
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

    // Create a temporary task ID for the skeleton
    const tempId = `temp-${Date.now()}`;
    const tempTask: Task = {
      id: tempId,
      title: formData.title,
      description: formData.description,
      order: tasks.length + 1,
      projectId,
      status: "todo",
    };

    // Optimistic UI: Add skeleton card immediately and close modal
    setTasks((prevTasks) => [...prevTasks, tempTask]);
    setIsAddModalOpen(false);
    setFormData({ title: "", description: "" });

    // Add to database in background
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "todo",
        }),
      });

      if (response.ok) {
        showToast.success("Task created successfully");
        // Refresh tasks to replace skeleton with actual data
        await fetchTasks();
      } else {
        showToast.error("Failed to create task");
        // Remove the skeleton task on failure
        setTasks((prevTasks) => prevTasks.filter((t) => t.id !== tempId));
      }
    } catch (error) {
      showToast.error("An error occurred");
      // Remove the skeleton task on error
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== tempId));
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
        fetchTasks();
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
        fetchTasks();
      } else {
        showToast.error("Failed to delete task");
      }
    } catch (error) {
      showToast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (task: Task) => {
    setSelectedTask(task);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedTask(null);
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
    });
    setIsEditModalOpen(true);
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

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-black" />
          </button>
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/projects")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-black" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-lg"
                style={{ backgroundColor: project.color }}
              />
              <h1 className="text-3xl font-bold text-gray-900">
                {project.name}
              </h1>
            </div>
            <p className="text-black mt-2">
              {project.description || "Manage your project tasks"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2E6F40] text-white rounded-lg hover:bg-[#253D2C] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      {/* Roadmap Gallery */}
      <ProjectRoadmapGallery
        tasks={tasks}
        projectColor={project.color}
        onEdit={openEditModal}
        onDelete={openDeleteModal}
        loading={loading}
      />

      {/* Add Task Modal */}
      <ProjectTaskModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSubmit={handleAddTask}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        title="Add Task"
        submitText="Create Task"
      />

      {/* Edit Task Modal */}
      <ProjectTaskModal
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
      <ProjectDeleteConfirmModal
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

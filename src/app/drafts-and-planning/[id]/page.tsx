"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import showToast from "@/lib/utils/toast";
import PlanningCardGallery from "../components/PlanningCardGallery";
import PlanningTaskModal from "../components/PlanningTaskModal";

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  status: string;
}

interface PlanningTask {
  id: string;
  title: string;
  description: string | null;
  order: number;
  projectId: string;
}

interface PlanningTaskFormData {
  title: string;
  description: string;
}

export default function ProjectPlanningPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<PlanningTask | null>(null);

  // Form state
  const [formData, setFormData] = useState<PlanningTaskFormData>({
    title: "",
    description: "",
  });

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchPlanningTasks();
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
        router.push("/drafts-and-planning");
      }
    } catch (error) {
      showToast.error("An error occurred");
      router.push("/drafts-and-planning");
    } finally {
      setPageLoading(false);
    }
  };

  const fetchPlanningTasks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`);
      if (response.ok) {
        const data = await response.json();
        // Filter tasks that belong to this project
        const planningTasks = data.tasks.filter(
          (task: PlanningTask) => task.projectId === projectId
        );
        setTasks(planningTasks);
      }
    } catch (error) {
      showToast.error("Failed to fetch planning tasks");
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
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: "todo",
        }),
      });

      if (response.ok) {
        showToast.success("Planning task created successfully");
        setIsAddModalOpen(false);
        setFormData({ title: "", description: "" });
        fetchPlanningTasks();
      } else {
        showToast.error("Failed to create planning task");
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
        showToast.success("Planning task updated successfully");
        setIsEditModalOpen(false);
        setSelectedTask(null);
        setFormData({ title: "", description: "" });
        fetchPlanningTasks();
      } else {
        showToast.error("Failed to update planning task");
      }
    } catch (error) {
      showToast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast.success("Planning task deleted successfully");
        fetchPlanningTasks();
      } else {
        showToast.error("Failed to delete planning task");
      }
    } catch (error) {
      showToast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (task: PlanningTask) => {
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
            onClick={() => router.push("/drafts-and-planning")}
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
              {project.description || "Plan your project tasks"}
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

      {/* Planning Card Gallery */}
      <PlanningCardGallery
        tasks={tasks}
        projectColor={project.color}
        onEdit={openEditModal}
        onDelete={handleDeleteTask}
        loading={loading}
      />

      {/* Add Task Modal */}
      <PlanningTaskModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSubmit={handleAddTask}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        title="Add Planning Task"
        submitText="Create Task"
      />

      {/* Edit Task Modal */}
      <PlanningTaskModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleEditTask}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        title="Edit Planning Task"
        submitText="Update Task"
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import showToast from "@/lib/utils/toast";
import TableSkeleton from "@/components/common/TableSkeleton";
import ProjectModal from "./components/ProjectModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import ProjectsTable from "./components/ProjectsTable";

interface Project {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      showToast.error("Failed to fetch projects");
    } finally {
      setPageLoading(false);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast.error("Project name is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast.success("Project created successfully");
        setIsAddModalOpen(false);
        setFormData({ name: "", description: "", startDate: "" });
        fetchProjects();
      } else {
        showToast.error("Failed to create project");
      }
    } catch (error) {
      showToast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !formData.name.trim()) {
      showToast.error("Project name is required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast.success("Project updated successfully");
        setIsEditModalOpen(false);
        setSelectedProject(null);
        setFormData({ name: "", description: "", startDate: "" });
        fetchProjects();
      } else {
        showToast.error("Failed to update project");
      }
    } catch (error) {
      showToast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast.success("Project deleted successfully");
        setIsDeleteModalOpen(false);
        setSelectedProject(null);
        fetchProjects();
      } else {
        showToast.error("Failed to delete project");
      }
    } catch (error) {
      showToast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description || "",
      startDate: project.startDate
        ? new Date(project.startDate).toISOString().split("T")[0]
        : "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (project: Project) => {
    setSelectedProject(project);
    setIsDeleteModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setFormData({ name: "", description: "", startDate: "" });
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProject(null);
    setFormData({ name: "", description: "", startDate: "" });
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedProject(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-black">Projects</h1>
          <p className="text-black mt-2">
            Manage your projects and organize your tasks
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#2E6F40] text-white px-4 py-2 rounded-lg hover:bg-[#253D2C] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Project
        </button>
      </div>

      {/* Projects Table or Skeleton */}
      {pageLoading ? (
        <TableSkeleton />
      ) : (
        <ProjectsTable
          projects={projects}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
        />
      )}

      {/* Add Project Modal */}
      <ProjectModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSubmit={handleAddProject}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        title="Add New Project"
        submitText="Create Project"
      />

      {/* Edit Project Modal */}
      <ProjectModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleEditProject}
        formData={formData}
        setFormData={setFormData}
        loading={loading}
        title="Edit Project"
        submitText="Update Project"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteProject}
        loading={loading}
        title="Delete Project"
        message={`Are you sure you want to delete "${selectedProject?.name}"? This action cannot be undone and will delete all associated tasks.`}
        confirmText="Delete"
      />
    </div>
  );
}

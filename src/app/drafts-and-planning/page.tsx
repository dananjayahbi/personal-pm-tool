"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import showToast from "@/lib/utils/toast";
import DraftProjectsTable from "./components/DraftProjectsTable";

interface Project {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  color: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function DraftsAndPlanningPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    fetchDraftProjects();
  }, []);

  const fetchDraftProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (response.ok) {
        const data = await response.json();
        // Filter to show only Draft projects
        const draftProjects = data.projects.filter(
          (project: Project) => project.status === "Draft"
        );
        setProjects(draftProjects);
      }
    } catch (error) {
      showToast.error("Failed to fetch draft projects");
    } finally {
      setPageLoading(false);
    }
  };

  const handlePlan = (projectId: string) => {
    router.push(`/drafts-and-planning/${projectId}`);
  };

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Drafts and Planning</h1>
            <p className="text-black mt-2">Organize and plan your draft projects</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drafts and Planning</h1>
          <p className="text-black mt-2">Organize and plan your draft projects</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="max-w-md mx-auto">
            <svg
              className="mx-auto h-16 w-16 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-black mb-2">
              No Draft Projects
            </h3>
            <p className="text-gray-600 mb-6">
              Create a project with "Draft" status to start planning
            </p>
            <a
              href="/projects"
              className="inline-block bg-[#2E6F40] text-white px-6 py-2.5 rounded-lg hover:bg-[#253D2C] transition-colors"
            >
              Go to Projects
            </a>
          </div>
        </div>
      ) : (
        <DraftProjectsTable projects={projects} onPlan={handlePlan} />
      )}
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import RoadmapTaskCard from "@/components/common/RoadmapTaskCard";

interface PlanningTask {
  id: string;
  title: string;
  description: string | null;
  order: number;
  projectId: string;
}

interface RoadmapGalleryProps {
  tasks: PlanningTask[];
  projectColor: string;
  onEdit: (task: PlanningTask) => void;
  onDelete: (task: PlanningTask) => void;
  loading: boolean;
}

export default function RoadmapGallery({
  tasks,
  projectColor,
  onEdit,
  onDelete,
  loading,
}: RoadmapGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sort tasks by order
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  // Scroll animation on mount
  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.roadmap-step');
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add('roadmap-step-visible');
        }, index * 100);
      });
    }
  }, [sortedTasks]);

  if (sortedTasks.length === 0) {
    return (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
          <h3 className="text-lg font-semibold text-black mb-2">
            No Planning Tasks Yet
          </h3>
          <p className="text-gray-600">
            Start planning by adding your first task to the roadmap
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="roadmap-container">
      {/* Start Marker */}
      <div className="roadmap-start-marker">
        <div className="roadmap-start-icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
        <span className="roadmap-start-text">START</span>
      </div>

      {/* Roadmap Path */}
      <div className="roadmap-path">
        <div className="roadmap-path-line"></div>

        {/* Task Cards */}
        {sortedTasks.map((task, index) => {
          const isEven = index % 2 === 0;
          const isTemporary = task.id.startsWith("temp-");

          return (
            <RoadmapTaskCard
              key={task.id}
              task={task}
              index={index}
              isEven={isEven}
              onEdit={onEdit}
              onDelete={onDelete}
              loading={loading}
              isTemporary={isTemporary}
            />
          );
        })}
      </div>

      {/* Finish Marker */}
      <div className="roadmap-finish-marker">
        <div className="roadmap-finish-icon">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <span className="roadmap-finish-text">FINISH</span>
      </div>
    </div>
  );
}

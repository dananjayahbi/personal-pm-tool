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
  const svgRef = useRef<SVGSVGElement>(null);

  // Sort tasks by order
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  // Calculate position for serpentine layout
  const getTaskPosition = (index: number) => {
    const cardsPerRow = 3; // Desktop: 3 cards per row
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;
    
    // On even rows (0, 2, 4...), go left to right
    // On odd rows (1, 3, 5...), go right to left (reverse)
    const isEvenRow = row % 2 === 0;
    const position = isEvenRow ? col : (cardsPerRow - 1 - col);
    
    return { row, col: position, isEvenRow };
  };

  // Draw curved paths between consecutive tasks
  useEffect(() => {
    if (!svgRef.current || sortedTasks.length < 2) return;

    const drawPaths = () => {
      const svg = svgRef.current;
      const container = containerRef.current;
      if (!svg || !container) return;

      const containerRect = container.getBoundingClientRect();
      
      sortedTasks.forEach((task, index) => {
        if (index >= sortedTasks.length - 1) return;

        const currentCard = container.querySelector(`[data-task-id="${task.id}"]`);
        const nextCard = container.querySelector(`[data-task-id="${sortedTasks[index + 1].id}"]`);

        if (!currentCard || !nextCard) return;

        // Get the milestone circles instead of card centers
        const currentMilestone = currentCard.querySelector('.roadmap-milestone-inner-serpentine');
        const nextMilestone = nextCard.querySelector('.roadmap-milestone-inner-serpentine');

        if (!currentMilestone || !nextMilestone) return;

        const currentRect = currentMilestone.getBoundingClientRect();
        const nextRect = nextMilestone.getBoundingClientRect();

        // Calculate center points of milestones relative to container
        const x1 = currentRect.left + currentRect.width / 2 - containerRect.left;
        const y1 = currentRect.top + currentRect.height / 2 - containerRect.top;
        const x2 = nextRect.left + nextRect.width / 2 - containerRect.left;
        const y2 = nextRect.top + nextRect.height / 2 - containerRect.top;

        const path = svg.querySelector(`.path-${index}`) as SVGPathElement;
        if (!path) return;

        // Create smooth S-curve
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Adjust control points based on distance and direction
        const offset = Math.min(distance * 0.4, 100);
        
        const cp1x = x1 + (dx > 0 ? offset : -offset);
        const cp1y = y1 + offset;
        const cp2x = x2 + (dx > 0 ? -offset : offset);
        const cp2y = y2 - offset;

        const pathData = `M ${x1},${y1} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
        path.setAttribute('d', pathData);
      });
    };

    // Draw paths after layout
    setTimeout(drawPaths, 100);
    setTimeout(drawPaths, 300);
    
    window.addEventListener('resize', drawPaths);
    
    const resizeObserver = new ResizeObserver(drawPaths);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', drawPaths);
      resizeObserver.disconnect();
    };
  }, [sortedTasks]);

  // Animate cards on mount
  useEffect(() => {
    if (containerRef.current) {
      const cards = containerRef.current.querySelectorAll('.roadmap-serpentine-card');
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
    <div ref={containerRef} className="roadmap-serpentine-container">
      {/* Start Marker */}
      <div className="roadmap-start-marker-serpentine">
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

      {/* SVG for curved paths */}
      <svg ref={svgRef} className="roadmap-serpentine-svg">
        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2E6F40" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#68BA7F" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {sortedTasks.map((task, index) => {
          if (index >= sortedTasks.length - 1) return null;
          
          return (
            <path
              key={`path-${task.id}`}
              className={`roadmap-serpentine-path path-${index}`}
              stroke="url(#pathGradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="10,5"
              d=""
            />
          );
        })}
      </svg>

      {/* Task Cards in Serpentine Grid */}
      <div className="roadmap-serpentine-grid">
        {sortedTasks.map((task, index) => {
          const isTemporary = task.id.startsWith("temp-");
          const { row, col } = getTaskPosition(index);

          return (
            <div
              key={task.id}
              className="roadmap-serpentine-card"
              data-task-id={task.id}
              style={{
                gridRow: row + 1,
                gridColumn: col + 1,
              }}
            >
              <RoadmapTaskCard
                task={task}
                index={index}
                isEven={col === 1}
                onEdit={onEdit}
                onDelete={onDelete}
                loading={loading}
                isTemporary={isTemporary}
              />
            </div>
          );
        })}
      </div>

      {/* Finish Marker */}
      <div className="roadmap-finish-marker-serpentine">
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

"use client";

import { useEffect, useRef } from "react";
import HexagonTaskCard from "@/components/common/HexagonTaskCard";

interface PlanningTask {
  id: string;
  title: string;
  description: string | null;
  order: number;
  projectId: string;
}

interface PlanningCardGalleryProps {
  tasks: PlanningTask[];
  projectColor: string;
  onEdit: (task: PlanningTask) => void;
  onDelete: (task: PlanningTask) => void;
  loading: boolean;
}

export default function PlanningCardGallery({
  tasks,
  projectColor,
  onEdit,
  onDelete,
  loading,
}: PlanningCardGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Function to draw curved connector lines between ALL consecutive tasks
  useEffect(() => {
    if (!containerRef.current || !svgRef.current || tasks.length < 2) return;

    const drawConnectors = () => {
      const container = containerRef.current;
      const svg = svgRef.current;
      if (!container || !svg) return;

      const items = container.querySelectorAll('.planning-hex-grid-item');
      if (items.length < 2) return;

      const containerRect = container.getBoundingClientRect();

      items.forEach((item, index) => {
        if (index === items.length - 1) return;

        const currentCard = item.querySelector('.hex-card-wrapper');
        const nextItem = items[index + 1];
        const nextCard = nextItem?.querySelector('.hex-card-wrapper');

        if (!currentCard || !nextCard) return;

        const currentRect = currentCard.getBoundingClientRect();
        const nextRect = nextCard.getBoundingClientRect();

        // Calculate center points relative to container
        const x1 = currentRect.left + currentRect.width / 2 - containerRect.left;
        const y1 = currentRect.top + currentRect.height / 2 - containerRect.top;
        const x2 = nextRect.left + nextRect.width / 2 - containerRect.left;
        const y2 = nextRect.top + nextRect.height / 2 - containerRect.top;

        // Calculate direction and distance
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Determine if it's a horizontal or cross-row connection
        const isHorizontal = Math.abs(dy) < 50; // Same row
        const isCrossRow = dy > 50; // Going to next row
        
        let pathData;
        
        if (isHorizontal) {
          // Horizontal connection (same row) - gentle arc
          const midX = (x1 + x2) / 2;
          const midY = y1 - 30; // Arc upward
          pathData = `M ${x1} ${y1} Q ${midX} ${midY}, ${x2} ${y2}`;
        } else if (isCrossRow) {
          // Cross-row connection - S-curve
          const cp1x = x1 + dx * 0.5;
          const cp1y = y1 + dy * 0.2;
          const cp2x = x2 - dx * 0.5;
          const cp2y = y2 - dy * 0.2;
          pathData = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
        } else {
          // Default smooth curve
          const cp1x = x1 + dx * 0.4;
          const cp1y = y1 + dy * 0.1;
          const cp2x = x2 - dx * 0.4;
          const cp2y = y2 - dy * 0.1;
          pathData = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
        }

        const path = svg.querySelector(`.connector-${index}`) as SVGPathElement;
        if (path) {
          path.setAttribute('d', pathData);
        }
      });
    };

    // Initial draw with delay to ensure layout is ready
    const timeoutId = setTimeout(drawConnectors, 100);

    // Redraw on window resize
    const handleResize = () => {
      drawConnectors();
    };

    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver for better responsiveness
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(drawConnectors);
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, [tasks]);

  if (tasks.length === 0) {
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
            Start planning by adding your first task
          </p>
        </div>
      </div>
    );
  }

  // Sort tasks by order
  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);

  return (
    <div ref={containerRef} className="planning-hexagon-gallery-container">
      {/* SVG for connector lines */}
      <svg ref={svgRef} className="connector-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="connectorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="50%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#d1d5db" />
          </linearGradient>
        </defs>
        {sortedTasks.map((task, index) => {
          if (index === sortedTasks.length - 1) return null;
          
          return (
            <path
              key={`connector-${task.id}`}
              className={`connector-path connector-${index}`}
              stroke="url(#connectorGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="8,4"
            />
          );
        })}
      </svg>

      {/* Grid of hexagon cards */}
      <div className="planning-hexagon-grid">
        {sortedTasks.map((task, index) => {
          const isTemporary = task.id.startsWith("temp-");

          return (
            <div
              key={task.id}
              className="planning-hex-grid-item"
              data-index={index}
            >
              <HexagonTaskCard
                task={task}
                index={index}
                onEdit={onEdit}
                onDelete={onDelete}
                loading={loading}
                isTemporary={isTemporary}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

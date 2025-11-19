import { Pencil, Trash2 } from "lucide-react";

interface PlanningTask {
  id: string;
  title: string;
  description: string | null;
  order: number;
  projectId: string;
}

interface HexagonTaskCardProps {
  task: PlanningTask;
  index: number;
  onEdit: (task: PlanningTask) => void;
  onDelete: (task: PlanningTask) => void;
  loading: boolean;
  isTemporary?: boolean;
}

// Color palettes for hexagons - not using project colors
const hexagonPalettes = [
  {
    primary: "#FF6B6B", // Red
    dark: "#FF4444",
    light: "#FFB3B3",
  },
  {
    primary: "#4ECDC4", // Teal
    dark: "#2BA39F",
    light: "#95E1D3",
  },
  {
    primary: "#A78BFA", // Purple
    dark: "#7C3AED",
    light: "#E9D5FF",
  },
  {
    primary: "#60A5FA", // Blue
    dark: "#2563EB",
    light: "#BFDBFE",
  },
  {
    primary: "#34D399", // Green
    dark: "#059669",
    light: "#A7F3D0",
  },
  {
    primary: "#FBBF24", // Amber
    dark: "#F59E0B",
    light: "#FEF3C7",
  },
];

export default function HexagonTaskCard({
  task,
  index,
  onEdit,
  onDelete,
  loading,
  isTemporary = false,
}: HexagonTaskCardProps) {
  const palette = hexagonPalettes[index % hexagonPalettes.length];

  if (isTemporary) {
    return (
      <div className="hex-card-wrapper">
        <div className="hex-skeleton">
          <div className="h-4 bg-gray-300 rounded w-2/3 animate-pulse"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2 animate-pulse mt-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="hex-card-wrapper group">
      {/* SVG Hexagon with better proportions */}
      <svg
        viewBox="0 0 200 220"
        className="hex-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id={`grad-${task.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.primary} />
            <stop offset="100%" stopColor={palette.dark} />
          </linearGradient>
          <linearGradient id={`grad-shadow-${task.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={palette.dark} />
            <stop offset="100%" stopColor={palette.dark} />
          </linearGradient>
          <filter id={`shadow-${task.id}`}>
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.25" />
          </filter>
          <filter id={`glow-${task.id}`}>
            <feDropShadow dx="0" dy="12" stdDeviation="8" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* Shadow hexagon behind */}
        <polygon
          points="100,15 175,55 175,135 100,175 25,135 25,55"
          fill={palette.dark}
          opacity="0.15"
          transform="translate(0, 4)"
        />

        {/* Main hexagon */}
        <polygon
          points="100,15 175,55 175,135 100,175 25,135 25,55"
          fill={`url(#grad-${task.id})`}
          filter={`url(#shadow-${task.id})`}
          className="hex-main"
        />

        {/* Hexagon highlight/shine effect */}
        <polygon
          points="100,15 175,55 145,75 75,40"
          fill="white"
          opacity="0.15"
        />

        {/* Index badge circle */}
        <circle
          cx="100"
          cy="45"
          r="22"
          fill="white"
          filter={`url(#shadow-${task.id})`}
          className="hex-badge"
        />
        <text
          x="100"
          y="54"
          textAnchor="middle"
          fontSize="20"
          fontWeight="700"
          fill={palette.primary}
          className="hex-badge-text"
        >
          {index + 1}
        </text>
      </svg>

      {/* Content overlay */}
      <div className="hex-content">
        <div className="hex-text">
          <h3 className="hex-title">{task.title}</h3>
          {task.description && (
            <p className="hex-description">{task.description}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="hex-actions">
          <button
            onClick={() => onEdit(task)}
            disabled={loading}
            className="hex-btn hex-btn-edit"
            title="Edit"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(task)}
            disabled={loading}
            className="hex-btn hex-btn-delete"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface ProjectDropdownProps {
  projects: Project[];
  selectedProjectId: string;
  onSelect: (projectId: string) => void;
}

export default function ProjectDropdown({ projects, selectedProjectId, onSelect }: ProjectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (projectId: string) => {
    onSelect(projectId);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors min-w-[200px]"
      >
        {selectedProject && (
          <>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedProject.color }}
            />
            <span className="flex-1 text-left text-black font-medium">
              {selectedProject.name}
            </span>
            <ChevronDown 
              className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
          <div className="max-h-60 overflow-y-auto">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelect(project.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                  project.id === selectedProjectId ? 'bg-gray-50' : ''
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-black font-medium text-left">
                  {project.name}
                </span>
                {project.id === selectedProjectId && (
                  <svg
                    className="w-4 h-4 text-[#2E6F40] ml-auto"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

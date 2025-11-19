interface Project {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  startDate: string;
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: ProjectFormData;
  setFormData: (data: ProjectFormData) => void;
  loading: boolean;
  title: string;
  submitText: string;
}

export default function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  loading,
  title,
  submitText,
}: ProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-black mb-4">{title}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E6F40] text-black"
              placeholder="Enter project name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E6F40] text-black resize-none"
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E6F40] text-black"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-black rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#2E6F40] text-white rounded-lg hover:bg-[#253D2C] transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? `${submitText}...` : submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { X } from "lucide-react";

interface SubTaskImage {
  id: string;
  filename: string;
  base64Data: string;
  mimeType: string;
  order: number;
}

interface SubTask {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  order: number;
  images?: SubTaskImage[];
}

interface ViewSubTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  subTask: SubTask | null;
}

export default function ViewSubTaskModal({
  isOpen,
  onClose,
  subTask,
}: ViewSubTaskModalProps) {
  if (!isOpen || !subTask) return null;

  console.log('=== VIEW MODAL - DISPLAYING SUBTASK ===');
  console.log('SubTask ID:', subTask.id);
  console.log('Title:', subTask.title);
  console.log('Description length:', subTask.description?.length || 0);
  console.log('Description content:', subTask.description);
  console.log('Images count:', subTask.images?.length || 0);
  if (subTask.images && subTask.images.length > 0) {
    console.log('Image IDs:', subTask.images.map(img => img.id));
  }
  console.log('=== END VIEW MODAL ===\n');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-60 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Subtask Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-900 font-medium">{subTask.title}</p>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50">
                <div
                  className={`w-3 h-3 rounded-full ${
                    subTask.isCompleted ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <span className="text-gray-900 font-medium">
                  {subTask.isCompleted ? "Completed" : "In Progress"}
                </span>
              </div>
            </div>

            {/* Description */}
            {subTask.description && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <div className="p-4 bg-gray-50 rounded-lg prose prose-sm max-w-none">
                  {/* Description text with embedded images */}
                  <div dangerouslySetInnerHTML={{ __html: subTask.description }} />
                </div>
              </div>
            )}

            {/* Empty State for No Description */}
            {!subTask.description && (
              <div className="text-center py-8">
                <p className="text-gray-500">No additional details available</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#2E6F40] text-white rounded-lg hover:bg-[#68BA7F] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

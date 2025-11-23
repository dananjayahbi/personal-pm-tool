"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { showToast } from "@/lib/utils/toast";
import RichTextEditor from "@/components/common/RichTextEditor";

interface AddSubTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, description: string) => Promise<void>;
}

export default function AddSubTaskModal({
  isOpen,
  onClose,
  onAdd,
}: AddSubTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) {
      showToast.error("Subtask title is required");
      return;
    }

    // Close modal immediately for better UX
    const titleToAdd = title.trim();
    const descriptionToAdd = description;
    
    setTitle("");
    setDescription("");
    onClose();

    // Add subtask in background with optimistic UI
    try {
      await onAdd(titleToAdd, descriptionToAdd);
    } catch (error) {
      // Error is handled in parent component
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-55 flex items-center justify-center p-4"
      onClick={handleCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add Subtask</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter subtask title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Rich Text Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optional)
            </label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder="Describe your subtask... You can add images, formatting, links, etc."
              readOnly={false}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-[#2E6F40] text-white rounded-lg hover:bg-[#68BA7F] transition-colors"
          >
            Add Subtask
          </button>
        </div>
      </div>
    </div>
  );
}

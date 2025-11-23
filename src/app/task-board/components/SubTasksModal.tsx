"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, GripVertical, Check, Edit2, ExternalLink, Eye } from "lucide-react";
import { showToast } from "@/lib/utils/toast";
import AddSubTaskModal from "../subtasks/[id]/components/AddSubTaskModal";
import EditSubTaskModal from "../subtasks/[id]/components/EditSubTaskModal";
import ViewSubTaskModal from "../subtasks/[id]/components/ViewSubTaskModal";

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

interface SubTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  taskTitle: string;
}

export default function SubTasksModal({
  isOpen,
  onClose,
  taskId,
  taskTitle,
}: SubTasksModalProps) {
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSubTask, setEditingSubTask] = useState<SubTask | null>(null);
  const [draggedSubTaskId, setDraggedSubTaskId] = useState<string | null>(null);
  const [viewingSubTask, setViewingSubTask] = useState<SubTask | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && taskId) {
      fetchSubTasks();
    }
  }, [isOpen, taskId]);

  const fetchSubTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks`);
      if (response.ok) {
        const data = await response.json();
        setSubTasks(data.subTasks || []);
      } else {
        showToast.error("Failed to load subtasks");
      }
    } catch (error) {
      showToast.error("Failed to load subtasks");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubTask = async (title: string, description: string) => {
    // Create temporary subtask for optimistic UI
    const tempId = `temp-${Date.now()}`;
    const tempSubTask: SubTask = {
      id: tempId,
      title,
      description,
      isCompleted: false,
      order: subTasks.length + 1,
      images: [],
    };

    // Optimistic UI: Add skeleton subtask immediately
    setSubTasks((prev) => [...prev, tempSubTask]);

    // Add to database in background
    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Replace temp subtask with real data from API
        setSubTasks((prev) =>
          prev.map((st) => (st.id === tempId ? data.subTask : st))
        );
        showToast.success("Subtask added");
      } else {
        // Remove skeleton on failure
        setSubTasks((prev) => prev.filter((st) => st.id !== tempId));
        showToast.error("Failed to add subtask");
        throw new Error("Failed to add subtask");
      }
    } catch (error) {
      // Remove skeleton on error
      setSubTasks((prev) => prev.filter((st) => st.id !== tempId));
      showToast.error("Failed to add subtask");
      throw error;
    }
  };

  const handleToggleComplete = async (subTaskId: string, isCompleted: boolean) => {
    // Optimistic UI update
    setSubTasks((prev) =>
      prev.map((st) =>
        st.id === subTaskId ? { ...st, isCompleted: !isCompleted } : st
      )
    );

    try {
      const response = await fetch(`/api/subtasks/${subTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      });

      if (!response.ok) {
        // Rollback on failure
        setSubTasks((prev) =>
          prev.map((st) =>
            st.id === subTaskId ? { ...st, isCompleted } : st
          )
        );
        showToast.error("Failed to update subtask");
      }
    } catch (error) {
      // Rollback on error
      setSubTasks((prev) =>
        prev.map((st) =>
          st.id === subTaskId ? { ...st, isCompleted } : st
        )
      );
      showToast.error("Failed to update subtask");
    }
  };

  const handleDeleteSubTask = async (subTaskId: string) => {
    // Optimistic UI update
    const oldSubTasks = [...subTasks];
    setSubTasks((prev) => prev.filter((st) => st.id !== subTaskId));

    try {
      const response = await fetch(`/api/subtasks/${subTaskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast.success("Subtask deleted");
      } else {
        setSubTasks(oldSubTasks);
        showToast.error("Failed to delete subtask");
      }
    } catch (error) {
      setSubTasks(oldSubTasks);
      showToast.error("Failed to delete subtask");
    }
  };

  const handleEditClick = (subtask: SubTask) => {
    setEditingSubTask(subtask);
  };

  const handleUpdateSubTask = async (subtaskId: string, title: string, description: string) => {
    if (!title.trim()) {
      showToast.error("Subtask title is required");
      return;
    }

    // Optimistic UI: Update in list immediately
    const previousSubTasks = [...subTasks];
    setSubTasks((prev) =>
      prev.map((st) =>
        st.id === subtaskId
          ? { ...st, title: title.trim(), description: description || null }
          : st
      )
    );

    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update with real data from API
        setSubTasks((prev) =>
          prev.map((st) => (st.id === subtaskId ? data.subTask : st))
        );
        showToast.success("Subtask updated");
      } else {
        // Rollback on failure
        setSubTasks(previousSubTasks);
        showToast.error("Failed to update subtask");
      }
    } catch (error) {
      // Rollback on error
      setSubTasks(previousSubTasks);
      showToast.error("Failed to update subtask");
    }
  };

  const handleDragStart = (e: React.DragEvent, subTaskId: string) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedSubTaskId(subTaskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSubTaskId || draggedSubTaskId === targetId) return;

    const draggedIndex = subTasks.findIndex((st) => st.id === draggedSubTaskId);
    const targetIndex = subTasks.findIndex((st) => st.id === targetId);

    const newSubTasks = [...subTasks];
    const [draggedItem] = newSubTasks.splice(draggedIndex, 1);
    newSubTasks.splice(targetIndex, 0, draggedItem);

    // Update order numbers
    const reorderedSubTasks = newSubTasks.map((st, index) => ({
      ...st,
      order: index + 1,
    }));

    setSubTasks(reorderedSubTasks);
    setDraggedSubTaskId(null);

    // Update backend
    try {
      await fetch(`/api/subtasks/${draggedSubTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: targetIndex + 1 }),
      });
    } catch (error) {
      showToast.error("Failed to reorder subtask");
      fetchSubTasks();
    }
  };

  const completedCount = subTasks.filter((st) => st.isCompleted).length;
  const totalCount = subTasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Subtasks</h2>
              <p className="text-sm text-gray-600">{taskTitle}</p>
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progress: {completedCount} of {totalCount} completed
                  </span>
                  <span className="text-sm font-medium text-gray-700">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2E6F40] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => {
                  window.open(`/task-board/subtasks/${taskId}`, "_blank");
                }}
                className="text-gray-400 hover:text-[#2E6F40] transition-colors"
                title="Open in new tab"
              >
                <ExternalLink className="w-6 h-6" />
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E6F40]"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Subtasks List */}
                {subTasks.map((subTask) => (
                  <div
                    key={subTask.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, subTask.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, subTask.id)}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                      subTask.id.startsWith("temp-")
                        ? "bg-gray-100 border-gray-300 animate-pulse"
                        : `bg-gray-50 ${
                            draggedSubTaskId === subTask.id
                              ? "border-[#2E6F40] opacity-50 cursor-move"
                              : "border-transparent hover:border-gray-200 cursor-move"
                          }`
                    }`}
                  >
                    <GripVertical className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                    <button
                      onClick={() => handleToggleComplete(subTask.id, subTask.isCompleted)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        subTask.isCompleted
                          ? "bg-[#2E6F40] border-[#2E6F40]"
                          : "border-gray-300 hover:border-[#2E6F40]"
                      }`}
                    >
                      {subTask.isCompleted && <Check className="w-3 h-3 text-white" />}
                    </button>

                    {/* View Mode */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-medium ${
                          subTask.isCompleted
                            ? "text-gray-400 line-through"
                            : "text-gray-900"
                        }`}
                      >
                        {subTask.title}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => setViewingSubTask(subTask)}
                        className="text-[#2E6F40] hover:text-[#68BA7F] transition-colors p-1"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditClick(subTask)}
                        className="text-blue-500 hover:text-blue-600 transition-colors p-1"
                        title="Edit subtask"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubTask(subTask.id)}
                        className="text-red-500 hover:text-red-600 transition-colors p-1"
                        title="Delete subtask"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add Subtask Button */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-[#2E6F40] hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-[#2E6F40]"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Add Subtask</span>
                </button>

                {/* Empty State */}
                {subTasks.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No Subtasks Yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Break down this task into smaller, manageable steps
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Subtask Modal */}
      <AddSubTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSubTask}
      />

      {/* Edit Subtask Modal */}
      <EditSubTaskModal
        isOpen={!!editingSubTask}
        onClose={() => setEditingSubTask(null)}
        onUpdate={handleUpdateSubTask}
        subTask={editingSubTask}
      />

      {/* View Subtask Modal */}
      <ViewSubTaskModal
        isOpen={!!viewingSubTask}
        onClose={() => setViewingSubTask(null)}
        subTask={viewingSubTask}
      />
    </>
  );
}

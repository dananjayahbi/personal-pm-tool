"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Check,
  Edit2,
} from "lucide-react";
import { showToast } from "@/lib/utils/toast";

interface SubTask {
  id: string;
  title: string;
  description: string | null;
  isCompleted: boolean;
  order: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
}

export default function SubTasksPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [newSubTaskDescription, setNewSubTaskDescription] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [draggedSubTaskId, setDraggedSubTaskId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (taskId) {
      fetchTask();
      fetchSubTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
      } else {
        showToast.error("Failed to load task");
      }
    } catch (error) {
      showToast.error("Failed to load task");
    }
  };

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

  const handleAddSubTask = async () => {
    if (!newSubTaskTitle.trim()) {
      showToast.error("Subtask title is required");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const tempSubTask: SubTask = {
      id: tempId,
      title: newSubTaskTitle.trim(),
      description: newSubTaskDescription.trim() || null,
      isCompleted: false,
      order: subTasks.length + 1,
    };

    setSubTasks((prev) => [...prev, tempSubTask]);
    const titleValue = newSubTaskTitle.trim();
    const descValue = newSubTaskDescription.trim();
    setNewSubTaskTitle("");
    setNewSubTaskDescription("");
    setAdding(false);

    try {
      const response = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleValue,
          description: descValue || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSubTasks((prev) =>
          prev.map((st) => (st.id === tempId ? data.subTask : st))
        );
        showToast.success("Subtask added");
      } else {
        setSubTasks((prev) => prev.filter((st) => st.id !== tempId));
        showToast.error("Failed to add subtask");
      }
    } catch (error) {
      setSubTasks((prev) => prev.filter((st) => st.id !== tempId));
      showToast.error("Failed to add subtask");
    }
  };

  const handleToggleComplete = async (
    subTaskId: string,
    isCompleted: boolean
  ) => {
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
        setSubTasks((prev) =>
          prev.map((st) => (st.id === subTaskId ? { ...st, isCompleted } : st))
        );
        showToast.error("Failed to update subtask");
      }
    } catch (error) {
      setSubTasks((prev) =>
        prev.map((st) => (st.id === subTaskId ? { ...st, isCompleted } : st))
      );
      showToast.error("Failed to update subtask");
    }
  };

  const handleDeleteSubTask = async (subTaskId: string) => {
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
    setEditingId(subtask.id);
    setEditTitle(subtask.title);
    setEditDescription(subtask.description || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handleSaveEdit = async (subtaskId: string) => {
    if (!editTitle.trim()) {
      showToast.error("Subtask title is required");
      return;
    }

    const previousSubTasks = [...subTasks];
    setSubTasks((prev) =>
      prev.map((st) =>
        st.id === subtaskId
          ? {
              ...st,
              title: editTitle.trim(),
              description: editDescription.trim() || null,
            }
          : st
      )
    );

    const titleValue = editTitle.trim();
    const descValue = editDescription.trim();
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");

    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleValue,
          description: descValue || null,
        }),
      });

      if (response.ok) {
        showToast.success("Subtask updated");
      } else {
        setSubTasks(previousSubTasks);
        showToast.error("Failed to update subtask");
      }
    } catch (error) {
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

    const reorderedSubTasks = newSubTasks.map((st, index) => ({
      ...st,
      order: index + 1,
    }));

    setSubTasks(reorderedSubTasks);
    setDraggedSubTaskId(null);

    try {
      await Promise.all(
        reorderedSubTasks.map((st) =>
          fetch(`/api/subtasks/${st.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ order: st.order }),
          })
        )
      );
    } catch (error) {
      showToast.error("Failed to update order");
      fetchSubTasks();
    }
  };

  const completedCount = subTasks.filter((st) => st.isCompleted).length;
  const totalCount = subTasks.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">Subtasks</h1>
              <p className="text-sm text-gray-600">{task?.title || "Loading..."}</p>
            </div>
          </div>

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
      </div>

      {/* Content */}
      <div ref={contentRef} className="max-w-5xl mx-auto px-6 py-8">
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
                draggable={editingId !== subTask.id}
                onDragStart={(e) => handleDragStart(e, subTask.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, subTask.id)}
                className={`flex items-start gap-3 p-4 bg-white rounded-xl border-2 transition-all ${
                  subTask.id.startsWith("temp-")
                    ? "border-gray-300 animate-pulse"
                    : editingId === subTask.id
                    ? "border-blue-200 shadow-sm"
                    : `${
                        draggedSubTaskId === subTask.id
                          ? "border-[#2E6F40] opacity-50 cursor-move"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm cursor-move"
                      }`
                }`}
              >
                {editingId !== subTask.id && (
                  <GripVertical className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                )}
                {editingId !== subTask.id && (
                  <button
                    onClick={() =>
                      handleToggleComplete(subTask.id, subTask.isCompleted)
                    }
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      subTask.isCompleted
                        ? "bg-[#2E6F40] border-[#2E6F40]"
                        : "border-gray-300 hover:border-[#2E6F40]"
                    }`}
                  >
                    {subTask.isCompleted && <Check className="w-3 h-3 text-white" />}
                  </button>
                )}

                {editingId === subTask.id ? (
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveEdit(subTask.id);
                        } else if (e.key === "Escape") {
                          handleCancelEdit();
                        }
                      }}
                      placeholder="Subtask title *"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent"
                      autoFocus
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Description (optional)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(subTask.id)}
                        className="px-4 py-2 bg-[#2E6F40] text-white rounded-lg hover:bg-[#68BA7F] transition-colors text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
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
                      {subTask.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {subTask.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
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
                  </>
                )}
              </div>
            ))}

            {/* Add Subtask Form */}
            {adding ? (
              <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                <input
                  type="text"
                  value={newSubTaskTitle}
                  onChange={(e) => setNewSubTaskTitle(e.target.value)}
                  placeholder="Subtask title *"
                  className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent"
                  autoFocus
                />
                <textarea
                  value={newSubTaskDescription}
                  onChange={(e) => setNewSubTaskDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full px-3 py-2 mb-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#2E6F40] focus:border-transparent"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSubTask}
                    className="px-4 py-2 bg-[#2E6F40] text-white rounded-lg hover:bg-[#68BA7F] transition-colors font-medium"
                  >
                    Add Subtask
                  </button>
                  <button
                    onClick={() => {
                      setAdding(false);
                      setNewSubTaskTitle("");
                      setNewSubTaskDescription("");
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAdding(true);
                  setTimeout(() => {
                    if (contentRef.current) {
                      contentRef.current.scrollTo({
                        top: contentRef.current.scrollHeight,
                        behavior: "smooth",
                      });
                    }
                  }, 100);
                }}
                className="w-full p-4 bg-white border-2 border-dashed border-gray-300 rounded-xl hover:border-[#2E6F40] hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-gray-600 hover:text-[#2E6F40]"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Add Subtask</span>
              </button>
            )}

            {/* Empty State */}
            {subTasks.length === 0 && !adding && (
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
  );
}

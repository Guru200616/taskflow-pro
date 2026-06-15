import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, User, Tag, AlertTriangle, CheckSquare } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => Promise<void>;
  task?: Task | null;
}

const CATEGORIES = ['Engineering', 'Design', 'Marketing', 'Product', 'QA', 'Operations', 'Personal'];

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, onClose, onSave, task }) => {
  const { teamMembers, profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [assigneeId, setAssigneeId] = useState('');
  const [assigneeName, setAssigneeName] = useState('Unassigned');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate || new Date().toISOString().substring(0, 10));
      setCategory(task.category || 'Engineering');
      setAssigneeId(task.assigneeId || '');
      setAssigneeName(task.assigneeName || 'Unassigned');
    } else {
      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setDueDate(new Date().toISOString().substring(0, 10));
      setCategory('Engineering');
      setAssigneeId('');
      setAssigneeName('Unassigned');
    }
    setValidationError(null);
  }, [task, isOpen]);

  // Sync Assignee Name when AssigneeId changes
  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setAssigneeId(selectedId);
    if (!selectedId) {
      setAssigneeName('Unassigned');
    } else {
      const selectedMember = teamMembers.find(m => m.userId === selectedId);
      setAssigneeName(selectedMember ? selectedMember.displayName : 'Unassigned');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation checks
    if (!title.trim()) {
      setValidationError('Task Title is required');
      return;
    }
    if (title.length > 200) {
      setValidationError('Task Title cannot exceed 200 characters');
      return;
    }
    if (!description.trim()) {
      setValidationError('Task Description is required');
      return;
    }
    if (description.length > 4000) {
      setValidationError('Task Description cannot exceed 4000 characters');
      return;
    }
    if (!dueDate) {
      setValidationError('Task Due Date is required');
      return;
    }

    setIsSubmitting(true);
    const taskPayload: Partial<Task> = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate,
      category,
      assigneeId,
      assigneeName,
    };

    try {
      await onSave(taskPayload);
      onClose();
    } catch (err: any) {
      let message = 'An unexpected safety error occurred.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.error) {
          message = `Security Policy Blocked Request: ${parsed.error}`;
        }
      } catch {
        message = err.message || message;
      }
      setValidationError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
                <h3 className="font-sans font-semibold text-slate-800 text-lg">
                  {task ? 'Edit Task Workspace' : 'Create New Task'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {validationError && (
                <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-100 p-3.5 text-rose-800 text-xs text-left leading-relaxed">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Conduct accessibility audits"
                  maxLength={200}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide precise execution guidelines, key criteria, or reference files..."
                  rows={4}
                  maxLength={4000}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition font-sans"
                  required
                />
              </div>

              {/* Side by Side Grid - Priority, Status, Category, Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white text-slate-800 focus:border-emerald-500 focus:outline-none text-sm transition"
                  >
                    <option value="todo">📋 To Do</option>
                    <option value="in_progress">⚡ In Progress</option>
                    <option value="review">🔍 Under Review</option>
                    <option value="done">✅ Completed</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white text-slate-800 focus:border-emerald-500 focus:outline-none text-sm transition"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5 text-slate-400" />
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white text-slate-800 focus:border-emerald-500 focus:outline-none text-sm transition"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm transition"
                    required
                  />
                </div>
              </div>

              {/* Assign To (Teammates dropdown) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Assign To
                </label>
                <select
                  value={assigneeId}
                  onChange={handleAssigneeChange}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 bg-white text-slate-800 focus:border-emerald-500 focus:outline-none text-sm transition"
                >
                  <option value="">👤 Unassigned</option>
                  {teamMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.displayName === profile?.displayName ? `${member.displayName} (You)` : member.displayName}
                    </option>
                  ))}
                </select>
                <span className="text-slate-400 text-[10px] mt-1 block">
                  Assigning to others lets them update column status securely under our project role policy.
                </span>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 active:bg-slate-950 transition shadow-md shadow-slate-900/10 flex items-center gap-2 disabled:bg-slate-400"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    task ? 'Update Task' : 'Create Task'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

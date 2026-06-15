import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  User, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle,
  Tag
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onMoveTask: (taskId: string, currentStatus: TaskStatus, targetStatus: TaskStatus) => Promise<void>;
  filters: {
    searchQuery: string;
    priority: string;
    category: string;
    assignee: string;
  };
}

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onEditTask, 
  onDeleteTask, 
  onMoveTask,
  filters
}) => {
  const { profile } = useAuth();

  // Apply filtering rules
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(filters.searchQuery.toLowerCase()) || 
      task.description.toLowerCase().includes(filters.searchQuery.toLowerCase());
    
    const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
    const matchesCategory = filters.category === 'all' || task.category === filters.category;
    
    let matchesAssignee = true;
    if (filters.assignee !== 'all') {
      if (filters.assignee === 'unassigned') {
        matchesAssignee = !task.assigneeId;
      } else {
        matchesAssignee = task.assigneeId === filters.assignee;
      }
    }

    return matchesSearch && matchesPriority && matchesCategory && matchesAssignee;
  });

  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'high': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'low': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'todo':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
            📋 Todo
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-100">
            ⚡ In Progress
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-100">
            🔍 Review
          </span>
        );
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
            ✅ Done
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden text-left">
      {filteredTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <Clock className="h-12 w-12 text-slate-300 animate-pulse" />
          <h4 className="mt-4 text-slate-800 font-sans font-medium text-sm">No tasks match selected criteria</h4>
          <p className="mt-1 text-xs text-slate-400">Try modifying your search or filters above</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th scope="col" className="px-6 py-4 font-semibold text-slate-500 uppercase text-[11px] font-mono tracking-wider">Task Info</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-slate-500 uppercase text-[11px] font-mono tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-slate-500 uppercase text-[11px] font-mono tracking-wider">Priority</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-slate-500 uppercase text-[11px] font-mono tracking-wider">Assignee</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-slate-500 uppercase text-[11px] font-mono tracking-wider">Due Date</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-slate-500 uppercase text-[11px] font-mono tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-slate-500 uppercase text-[11px] font-mono tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredTasks.map((task) => {
                  const isOwner = task.ownerId === profile?.userId;
                  const isAssignee = task.assigneeId === profile?.userId;
                  const canEdit = isOwner || isAssignee;

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/50 transition">
                      {/* Name & description */}
                      <td className="px-6 py-4 max-w-sm">
                        <div>
                          <p className="font-sans font-semibold text-slate-800 text-sm line-clamp-1">{task.title}</p>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{task.description}</p>
                          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Created by {task.ownerName}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          {task.category || 'Operations'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center text-xs font-semibold font-mono uppercase px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </td>

                      {/* Assignee */}
                      <td className="px-6 py-4 whitespace-nowrap text-xs">
                        {task.assigneeId ? (
                          <span className="font-medium text-slate-700 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            {task.assigneeName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {task.dueDate}
                        </span>
                      </td>

                      {/* Status select block */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={task.status}
                          disabled={!canEdit}
                          onChange={(e) => onMoveTask(task.id!, task.status, e.target.value as TaskStatus)}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition disabled:opacity-60"
                        >
                          <option value="todo">📋 Todo</option>
                          <option value="in_progress">⚡ In Progress</option>
                          <option value="review">🔍 Under Review</option>
                          <option value="done">✅ Done</option>
                        </select>
                      </td>

                      {/* Operations */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <button
                              onClick={() => onEditTask(task)}
                              className="rounded-lg p-1.5 text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition"
                              title="Edit Task"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                          {isOwner && (
                            <button
                              onClick={() => onDeleteTask(task.id!)}
                              className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                              title="Delete Task"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-List View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredTasks.map((task) => {
              const isOwner = task.ownerId === profile?.userId;
              const isAssignee = task.assigneeId === profile?.userId;
              const canEdit = isOwner || isAssignee;

              return (
                <div key={task.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-sans font-semibold text-slate-800 text-sm leading-snug">{task.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">By {task.ownerName}</span>
                    </div>
                    <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full border ${getPriorityBadgeClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>

                  <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{task.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs py-1 border-t border-b border-dashed border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block font-mono">Category</span>
                      <span className="font-medium text-slate-700">{task.category}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block font-mono">Due Date</span>
                      <span className="font-mono text-slate-600 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        {task.dueDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block font-mono mb-1">State</span>
                      <select
                        value={task.status}
                        disabled={!canEdit}
                        onChange={(e) => onMoveTask(task.id!, task.status, e.target.value as TaskStatus)}
                        className="rounded-xl border border-slate-200 px-3 py-1 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 transition disabled:opacity-60"
                      >
                        <option value="todo">📋 Todo</option>
                        <option value="in_progress">⚡ In Progress</option>
                        <option value="review">🔍 Review</option>
                        <option value="done">✅ Done</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button
                          onClick={() => onEditTask(task)}
                          className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => onDeleteTask(task.id!)}
                          className="rounded-xl border border-rose-100 p-2 text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

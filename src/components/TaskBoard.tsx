import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Plus, 
  Search, 
  SlidersHorizontal,
  ChevronRight,
  UserCheck,
  CheckCircle2,
  CalendarCheck2
} from 'lucide-react';
import { Task, TaskPriority, TaskStatus, BoardColumn } from '../types';
import { useAuth } from '../context/AuthContext';

interface TaskBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => Promise<void>;
  onMoveTask: (taskId: string, currentStatus: TaskStatus, targetStatus: TaskStatus) => Promise<void>;
  onAddTaskClick: (defaultStatus: TaskStatus) => void;
  filters: {
    searchQuery: string;
    priority: string;
    category: string;
    assignee: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    searchQuery: string;
    priority: string;
    category: string;
    assignee: string;
  }>>;
}

const COLUMNS: BoardColumn[] = [
  { id: 'todo', title: '📋 To Do', color: 'slate-600', bgClass: 'bg-slate-50/50', textClass: 'text-slate-800', borderClass: 'border-slate-200' },
  { id: 'in_progress', title: '⚡ In Progress', color: 'amber-600', bgClass: 'bg-amber-50/20', textClass: 'text-amber-800', borderClass: 'border-amber-200/50' },
  { id: 'review', title: '🔍 Under Review', color: 'indigo-600', bgClass: 'bg-indigo-50/20', textClass: 'text-indigo-800', borderClass: 'border-indigo-200/50' },
  { id: 'done', title: '✅ Completed', color: 'emerald-600', bgClass: 'bg-emerald-50/20', textClass: 'text-emerald-800', borderClass: 'border-emerald-200/50' }
];

export const TaskBoard: React.FC<TaskBoardProps> = ({ 
  tasks, 
  onEditTask, 
  onDeleteTask, 
  onMoveTask,
  onAddTaskClick,
  filters,
  setFilters
}) => {
  const { profile, teamMembers } = useAuth();

  // Apply filters
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

  // Unique categories helper
  const availableCategories = ['all', ...Array.from(new Set(tasks.map(t => t.category)))].filter(Boolean);

  const getPriorityBadgeClass = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-rose-50 border border-rose-100 text-rose-700';
      case 'medium':
        return 'bg-amber-50 border border-amber-100 text-amber-700';
      case 'low':
        return 'bg-blue-50 border border-blue-100 text-blue-700';
      default:
        return 'bg-slate-50 border border-slate-100 text-slate-700';
    }
  };

  const isTodayOrPast = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today;
  };

  return (
    <div className="space-y-6">
      {/* Filtering Utility Bar */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between text-left">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Search matching titles, scope..."
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>

        <div className="grid grid-cols-2 sm:flex flex-wrap gap-3 w-full md:w-auto">
          {/* Priority */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Priority</span>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-xs text-slate-700 focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all">⚡ All Priorities</option>
              <option value="low">🟡 Low</option>
              <option value="medium">🟠 Medium</option>
              <option value="high">🔴 High</option>
            </select>
          </div>

          {/* Category */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Category</span>
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-xs text-slate-700 focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all">🏷️ All Categories</option>
              {availableCategories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Allocation */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 font-mono">Allocation</span>
            <select
              value={filters.assignee}
              onChange={(e) => setFilters(prev => ({ ...prev, assignee: e.target.value }))}
              className="rounded-xl border border-slate-200 px-3 py-1.5 bg-white text-xs text-slate-700 focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="all">👥 Anyone</option>
              <option value="unassigned font-mono">👤 Unassigned</option>
              {teamMembers.map(member => (
                <option key={member.userId} value={member.userId}>
                  {member.displayName === profile?.displayName ? 'Self (You)' : member.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {COLUMNS.map((col, cIndex) => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);

          return (
            <motion.div
              key={col.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: cIndex * 0.08 }}
              className={`rounded-2xl border ${col.borderClass} ${col.bgClass} flex flex-col max-h-[750px] min-h-[300px] overflow-hidden text-left`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white/40">
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-semibold ${col.textClass}`}>{col.title}</h4>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold font-mono">
                    {colTasks.length}
                  </span>
                </div>
                {/* Plus button to add direct task inside this status */}
                <button
                  onClick={() => onAddTaskClick(col.id)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <Plus className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Column Task List */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
                {colTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <div className="h-10 w-10 rounded-full border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300">
                      <Plus className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-slate-400 text-xs">No matching cards</p>
                  </div>
                ) : (
                  colTasks.map((task, tIndex) => {
                    const isOwner = task.ownerId === profile?.userId;
                    const isAssignee = task.assigneeId === profile?.userId;
                    const canEdit = isOwner || isAssignee;

                    return (
                      <motion.div
                        key={task.id}
                        layoutId={task.id}
                        className="group relative rounded-xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-slate-200/80 transition-all flex flex-col gap-3"
                      >
                        {/* Title & Priority Badge */}
                        <div className="flex items-start justify-between gap-1.5">
                          <h5 className="font-sans font-medium text-slate-800 text-sm group-hover:text-emerald-700 transition leading-snug">
                            {task.title}
                          </h5>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold font-mono tracking-wider ${getPriorityBadgeClass(task.priority)} uppercase shrink-0`}>
                            {task.priority}
                          </span>
                        </div>

                        {/* Description snippet */}
                        <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>

                        {/* Meta Category and Due Date flags */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-dashed border-slate-50">
                          {task.category && (
                            <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-medium">
                              🏷️ {task.category}
                            </span>
                          )}

                          {task.dueDate && (
                            <span className={`text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono font-medium ${
                              task.status === 'done' 
                                ? 'text-emerald-600 bg-emerald-50/50' 
                                : isTodayOrPast(task.dueDate) 
                                ? 'text-rose-600 bg-rose-50/60 font-bold' 
                                  : 'text-slate-400'
                            }`}>
                              <Calendar className="h-3 w-3" />
                              {task.dueDate}
                            </span>
                          )}
                        </div>

                        {/* Owner & Assignee profile blocks */}
                        <div className="flex items-center justify-between gap-1.5 pt-1">
                          {/* Left: Creator Info */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-sans text-slate-400 bg-slate-50 rounded px-1 max-w-[80px] truncate" title={`Created by: ${task.ownerName}`}>
                              creator: {task.ownerName?.split(' ')[0]}
                            </span>
                          </div>

                          {/* Right: Assignee profile representation */}
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            {task.assigneeId ? (
                              <div className="flex items-center gap-1" title={`Assignee: ${task.assigneeName}`}>
                                <UserCheck className="h-3 w-3 text-emerald-600" />
                                <span className="font-semibold text-slate-600 truncate max-w-[80px]">
                                  {task.assigneeName.split(' ')[0]}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-slate-400 italic">
                                <User className="h-3 w-3 text-slate-300" />
                                <span>unassigned</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Interaction actions / Card Footer */}
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
                          {/* Movement Status Triggers */}
                          <div className="flex items-center gap-1">
                            {/* Move Left */}
                            {cIndex > 0 && (
                              <button
                                onClick={() => onMoveTask(task.id!, task.status, COLUMNS[cIndex - 1].id)}
                                title="Move Left"
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                              >
                                <ArrowLeft className="h-3.5 w-3.5" />
                              </button>
                            )}
                            
                            <span className="text-[10px] text-slate-400 font-mono font-bold select-none px-1">
                              Move
                            </span>

                            {/* Move Right */}
                            {cIndex < COLUMNS.length - 1 && (
                              <button
                                onClick={() => onMoveTask(task.id!, task.status, COLUMNS[cIndex + 1].id)}
                                title="Move Right"
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                              >
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Modify / Trash Gates */}
                          <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition">
                            {canEdit && (
                              <button
                                onClick={() => onEditTask(task)}
                                title="Edit Detail"
                                className="rounded p-1 text-blue-500 hover:bg-blue-50 transition"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {isOwner && (
                              <button
                                onClick={() => onDeleteTask(task.id!)}
                                title="Delete Task"
                                className="rounded p-1 text-rose-500 hover:bg-rose-50 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

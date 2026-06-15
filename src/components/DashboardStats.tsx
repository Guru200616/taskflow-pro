import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BarChart3, 
  PieChart, 
  Tag, 
  TrendingUp 
} from 'lucide-react';
import { Task } from '../types';

interface DashboardStatsProps {
  tasks: Task[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ tasks }) => {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === 'done').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const inReview = tasks.filter(t => t.status === 'review').length;
  const todo = tasks.filter(t => t.status === 'todo').length;

  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Key Priority Numbers
  const pvHigh = tasks.filter(t => t.priority === 'high').length;
  const pvMedium = tasks.filter(t => t.priority === 'medium').length;
  const pvLow = tasks.filter(t => t.priority === 'low').length;

  // Category Distribution calculation
  const categoryCounts: { [key: string]: number } = {};
  tasks.forEach(task => {
    categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
  });

  const categories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Stat Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Metric */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total Workspace</span>
            <div className="rounded-xl bg-slate-50 p-2 text-slate-600">
              <BarChart3 className="h-4 sm:h-5 w-4 sm:w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-sans font-bold text-slate-800 tracking-tight">{total}</h3>
            <p className="mt-1 text-slate-400 text-xs font-mono">registered active cards</p>
          </div>
        </motion.div>

        {/* In Progress Metric */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-widest">Active Sprint</span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Clock className="h-4 sm:h-5 w-4 sm:w-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-sans font-bold text-slate-800 tracking-tight">{inProgress}</h3>
            <p className="mt-1 text-slate-400 text-xs font-mono">{todo} tasks remaining to draft</p>
          </div>
        </motion.div>

        {/* Under Review Metric */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-500 uppercase tracking-widest font-sans">Under Review</span>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600">
              <AlertCircle className="h-4 sm:h-5 w-4 sm:w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-sans font-bold text-slate-800 tracking-tight">{inReview}</h3>
            <p className="mt-1 text-slate-400 text-xs font-mono">awaiting sign off/QA approval</p>
          </div>
        </motion.div>

        {/* Completed Metric */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-widest font-sans">Completed</span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 sm:h-5 w-4 sm:w-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-sans font-bold text-slate-800 tracking-tight">{completed}</h3>
            <p className="mt-1 text-slate-400 text-xs font-mono">{progressPercent}% complete rating</p>
          </div>
        </motion.div>
      </div>

      {/* Interactive Completion Progress Indicators & Rings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Completion Progress Bar */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:col-span-2 text-left">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 animate-bounce" />
              <h4 className="text-sm font-semibold text-slate-800">Workspace Execution Rating</h4>
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-mono">
              {progressPercent}% Complete
            </span>
          </div>

          <div className="relative pt-1">
            <div className="overflow-hidden h-3.5 text-xs flex rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5 text-center">
            <div className="bg-slate-50/50 rounded-xl py-2 px-1">
              <span className="block text-xs text-slate-400 font-mono">To Do</span>
              <span className="text-md font-bold text-slate-700 font-sans">{todo}</span>
            </div>
            <div className="bg-slate-50/50 rounded-xl py-2 px-1">
              <span className="block text-xs text-slate-400 font-mono">In Progress</span>
              <span className="text-md font-bold text-slate-700 font-sans">{inProgress}</span>
            </div>
            <div className="bg-slate-50/50 rounded-xl py-2 px-1">
              <span className="block text-xs text-slate-400 font-mono">Review</span>
              <span className="text-md font-bold text-slate-700 font-sans">{inReview}</span>
            </div>
          </div>
        </div>

        {/* Priority & Top Categories breakdown panel */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm text-left">
          <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 mb-4">
            <PieChart className="h-4 w-4 text-slate-500" />
            Priority Allocation
          </h4>

          <div className="space-y-3">
            {/* High */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1 font-sans">
                <span className="flex items-center gap-1.5 font-medium"><span className="h-2 w-2 rounded-full bg-rose-500" /> High Criticality</span>
                <span className="font-mono font-semibold">{pvHigh} tasks</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: total > 0 ? `${(pvHigh / total) * 100}%` : '0%' }} />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1 font-sans">
                <span className="flex items-center gap-1.5 font-medium"><span className="h-2 w-2 rounded-full bg-amber-500" /> Medium priority</span>
                <span className="font-mono font-semibold">{pvMedium} tasks</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: total > 0 ? `${(pvMedium / total) * 100}%` : '0%' }} />
              </div>
            </div>

            {/* Low */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1 font-sans">
                <span className="flex items-center gap-1.5 font-medium"><span className="h-2 w-2 rounded-full bg-blue-500" /> General/Low</span>
                <span className="font-mono font-semibold">{pvLow} tasks</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: total > 0 ? `${(pvLow / total) * 100}%` : '0%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

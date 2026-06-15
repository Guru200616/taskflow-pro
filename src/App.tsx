import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckSquare, 
  LogOut, 
  Plus, 
  LayoutDashboard, 
  Database,
  User,
  Sliders,
  Sparkles,
  RefreshCw,
  Bell,
  Lock,
  Globe,
  Settings,
  X,
  PlusCircle,
  HelpCircle
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db, OperationType, handleFirestoreError } from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { Task, TaskStatus } from './types';
import { DashboardStats } from './components/DashboardStats';
import { TaskBoard } from './components/TaskBoard';
import { TaskList } from './components/TaskList';
import { TaskModal } from './components/TaskModal';

function MainDashboard() {
  const { user, profile, signOut, teamMembers, updateProfile } = useAuth();
  
  // Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  
  // Modal orchestration
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeEditingTask, setActiveEditingTask] = useState<Task | null>(null);
  
  // Profile editor state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhotoSeed, setEditPhotoSeed] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Global filters
  const [filters, setFilters] = useState({
    searchQuery: '',
    priority: 'all',
    category: 'all',
    assignee: 'all'
  });

  // Load profile state for customization
  useEffect(() => {
    if (profile) {
      setEditName(profile.displayName);
      setEditPhotoSeed(profile.photoURL.split('seed=')[1] || profile.photoURL || '');
    }
  }, [profile]);

  // Real-time synchronization of tasks (live updates)
  useEffect(() => {
    if (!user) return;

    setTasksLoading(true);
    const tasksCollectionPath = 'tasks';
    const q = query(collection(db, tasksCollectionPath), orderBy('createdAt', 'desc'));

    // Secure live onSnapshot listener with proper error standardisation
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks: Task[] = [];
      snapshot.forEach((docSnap) => {
        fetchedTasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
      });
      setTasks(fetchedTasks);
      setTasksLoading(false);
    }, (error) => {
      // Standardise rules exceptions using the handleFirestoreError helper defined in the skills spec
      handleFirestoreError(error, OperationType.LIST, tasksCollectionPath);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateTaskClick = (defaultStatus: TaskStatus = 'todo') => {
    setActiveEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleEditTaskClick = (task: Task) => {
    setActiveEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Create or Update task in Firestore (Atomicity & Secure Policy compliant)
  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (!user || !profile) return;

    try {
      if (activeEditingTask) {
        // UPDATE operation
        const taskDocPath = `tasks/${activeEditingTask.id}`;
        const taskRef = doc(db, 'tasks', activeEditingTask.id!);
        
        const updatePayload = {
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
          category: taskData.category,
          assigneeId: taskData.assigneeId,
          assigneeName: taskData.assigneeName,
          updatedAt: serverTimestamp() // Set database level server timestamp securely
        };

        try {
          await setDoc(taskRef, updatePayload, { merge: true });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, taskDocPath);
        }
      } else {
        // CREATE operation
        const newDocRef = doc(collection(db, 'tasks'));
        const taskDocPath = `tasks/${newDocRef.id}`;
        
        const createPayload: Task = {
          title: taskData.title!,
          description: taskData.description!,
          status: taskData.status!,
          priority: taskData.priority!,
          dueDate: taskData.dueDate!,
          category: taskData.category!,
          ownerId: user.uid,
          ownerName: profile.displayName,
          assigneeId: taskData.assigneeId || '',
          assigneeName: taskData.assigneeName || 'Unassigned',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        try {
          await setDoc(newDocRef, createPayload);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, taskDocPath);
        }
      }
    } catch (error) {
      throw error; // Let TaskModal handles the presentation error reporting
    }
  };

  // Secure Task Deletion (restricted to creation Owner in firestore.rules)
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Determine execution: Delete this task from workspace?')) return;

    const taskDocPath = `tasks/${taskId}`;
    const taskRef = doc(db, 'tasks', taskId);

    try {
      await deleteDoc(taskRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, taskDocPath);
    }
  };

  // Transition Task column statuses (supports partial update keys policy)
  const handleMoveTask = async (taskId: string, currentStatus: TaskStatus, targetStatus: TaskStatus) => {
    if (currentStatus === targetStatus) return;

    const taskDocPath = `tasks/${taskId}`;
    const taskRef = doc(db, 'tasks', taskId);

    try {
      await setDoc(taskRef, {
        status: targetStatus,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, taskDocPath);
    }
  };

  // Profile metadata update handles
  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!editName.trim()) {
      setProfileError('Display Name cannot be empty');
      return;
    }

    setProfileSaving(true);
    const generatedPhotoURL = editPhotoSeed.startsWith('http') 
      ? editPhotoSeed 
      : `https://api.dicebear.com/7.x/adventurer/svg?seed=${editPhotoSeed.trim() || user!.uid}`;

    try {
      await updateProfile(editName.trim(), generatedPhotoURL);
      setIsProfileOpen(false);
    } catch (err: any) {
      setProfileError(err.message || 'Unable to store changes to profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-800">
      
      {/* Dynamic Header */}
      <nav className="border-b border-slate-150/80 bg-white sticky top-0 z-40 shadow-xs px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Moniker */}
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl bg-slate-900 p-2 text-white shadow-md shadow-slate-900/10">
              <CheckSquare className="h-5 w-5 text-emerald-400 shrink-0" />
            </div>
            <div className="hidden sm:block text-left">
              <span className="font-sans font-bold text-slate-900 text-md block leading-tight tracking-tight">
                Collaborative Space
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Full-Stack Role Encapsulation
              </span>
            </div>
          </div>

          {/* Active Collaborators Circle Deck */}
          <div className="hidden md:flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-full py-1 px-3.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-2 font-mono">Active Deck:</span>
            <div className="flex -space-x-2">
              {teamMembers.slice(0, 4).map((member, idx) => (
                <img
                  key={member.userId}
                  src={member.photoURL}
                  alt={member.displayName}
                  title={`${member.displayName}${member.displayName === profile?.displayName ? ' (You)' : ''}`}
                  referrerPolicy="no-referrer"
                  className="h-6 w-6 rounded-full border-2 border-white object-cover bg-slate-100"
                />
              ))}
            </div>
            <span className="text-[10px] text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5 ml-2 font-bold animate-pulse font-mono flex items-center gap-1">
              <span className="h-1 w-1 bg-emerald-600 rounded-full" /> live synced
            </span>
          </div>

          {/* Profile controls and Log-out */}
          <div className="flex items-center gap-3">
            {profile && (
              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-full p-1.5 pr-3.5 hover:bg-slate-100/50 hover:border-slate-250 transition-all text-left group"
              >
                <img
                  src={profile.photoURL}
                  alt={profile.displayName}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-full border border-slate-200 object-cover bg-slate-200"
                />
                <div className="hidden sm:block text-left">
                  <span className="text-[10px] text-slate-400 block font-mono">WORKSPACE ROLE</span>
                  <span className="text-xs font-semibold text-slate-700 leading-none group-hover:text-emerald-700 transition">
                    {profile.displayName}
                  </span>
                </div>
              </button>
            )}

            <button
              onClick={signOut}
              title="Sign Out Workspace"
              className="rounded-full border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Primary Workspace Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        
        {/* Welcome Moniker banner */}
        <div className="rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-left">
          <div className="absolute inset-0 bg-grid-white/[0.03] bg-[size:16px_16px]" />
          <div className="relative z-10 space-y-1.5 max-w-xl">
            <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest font-mono">Secure Enterprise Sprint</span>
            <h1 className="text-2xl sm:text-3xl font-sans font-bold tracking-tight">
              Hello, {profile?.displayName || 'Teammate'}!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm font-sans font-light leading-relaxed">
              Welcome to your real-time collaborative sprint space. Build cards, assign duties, and track completions safely backed by Attribute-Based Access Control security rules.
            </p>
          </div>

          <div className="relative z-10 shrink-0">
            <button
              onClick={() => handleCreateTaskClick('todo')}
              className="w-full sm:w-auto rounded-xl bg-emerald-500 px-5  py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 active:bg-emerald-600 transition shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 font-sans"
            >
              <PlusCircle className="h-5 w-5" />
              Draft New Task Card
            </button>
          </div>
        </div>

        {/* Real-time statistics block */}
        <DashboardStats tasks={tasks} />

        {/* Board Operations header & Workspace Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="text-left">
            <h2 className="text-xl font-bold font-sans text-slate-800 tracking-tight">Active Workboards</h2>
            <p className="text-xs text-slate-400 mt-1">
              Select your optimized layout style to organize and synchronize live items.
            </p>
          </div>

          {/* Tab switches */}
          <div className="flex rounded-xl bg-slate-100 p-1 self-start sm:self-center border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold font-sans transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold font-sans transition-all flex items-center gap-1.5 ${
                viewMode === 'list' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              Detail Matrix
            </button>
          </div>
        </div>

        {/* Board Views with interactive loading feedback */}
        <div className="relative">
          {tasksLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <svg className="animate-spin h-8 w-8 text-emerald-500 mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-xs font-mono">Synchronizing workspace cards...</p>
            </div>
          ) : viewMode === 'kanban' ? (
            <TaskBoard 
              tasks={tasks}
              onEditTask={handleEditTaskClick}
              onDeleteTask={handleDeleteTask}
              onMoveTask={handleMoveTask}
              onAddTaskClick={handleCreateTaskClick}
              filters={filters}
              setFilters={setFilters}
            />
          ) : (
            <TaskList 
              tasks={tasks}
              onEditTask={handleEditTaskClick}
              onDeleteTask={handleDeleteTask}
              onMoveTask={handleMoveTask}
              filters={filters}
            />
          )}
        </div>
      </main>

      {/* Task form Modal */}
      <TaskModal 
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        task={activeEditingTask}
      />

      {/* Edit Profile Modal Dialog */}
      <AnimatePresence>
        {isProfileOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProfileOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-1.5 text-slate-800">
                  <Settings className="h-4 w-4 text-emerald-600" />
                  <h4 className="font-sans font-bold text-md">Configure Public Role</h4>
                </div>
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 transition"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {profileError && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-rose-700 text-xs mb-3 font-sans leading-relaxed">
                  {profileError}
                </div>
              )}

              <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={128}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Avatar Seed Customizer
                  </label>
                  <div className="flex items-center gap-3">
                    <img
                      src={editPhotoSeed ? `https://api.dicebear.com/7.x/adventurer/svg?seed=${editPhotoSeed}` : profile?.photoURL}
                      alt="Avatar Preview"
                      className="h-11 w-11 rounded-full border border-slate-200 object-cover bg-slate-50"
                    />
                    <input
                      type="text"
                      value={editPhotoSeed}
                      onChange={(e) => setEditPhotoSeed(e.target.value)}
                      placeholder="Type seed (e.g. creative names)"
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-slate-800 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Type any keyword to instantly compile high contrast SVG avatars using the adventurer design language.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition disabled:bg-slate-400"
                  >
                    {profileSaving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Welcoming/Authentication view shown to non-authenticated workspace visitors
function LoginScreen() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative ambient blurred backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      
      {/* Absolute grid styling */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-8 text-center flex flex-col items-center">
          
          {/* Logo element */}
          <div className="rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 p-3.5 text-slate-950 shadow-lg shadow-emerald-500/20">
            <CheckSquare className="h-7 w-7" />
          </div>

          <div className="space-y-3">
            <h2 className="text-white text-2xl font-bold font-sans tracking-tight">
              Task Workspace Portal
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm font-sans font-light leading-relaxed max-w-sm">
              An enterprise full-stack workspace featuring secure Attribute-Based Access Controls, real-time sync, and fluid view transformations.
            </p>
          </div>

          {/* Secure Policy Features Badges */}
          <div className="grid grid-cols-2 gap-3 w-full text-left">
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-3">
              <span className="text-[10px] font-mono font-bold text-emerald-400 block mb-1">🔐 SECURE AUTHENTICITY</span>
              <p className="text-[10px] text-slate-400 leading-normal">Google popup validation checks verify active email veridicality before allowing database queries.</p>
            </div>
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-3">
              <span className="text-[10px] font-mono font-bold text-teal-400 block mb-1">⚡ SNAPSHOT INTEGRATION</span>
              <p className="text-[10px] text-slate-400 leading-normal">Interactive listeners update Kanban boards instantly when team collaborators alter cards.</p>
            </div>
          </div>

          {/* Authentication Action Button */}
          <div className="w-full pt-2">
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-slate-950 hover:bg-slate-100 active:bg-slate-200 transition shadow-lg shadow-white/5 flex items-center justify-center gap-3 disabled:bg-slate-700 disabled:text-slate-400"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Initializing security session...
                </>
              ) : (
                <>
                  {/* Google Icon SVG */}
                  <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  Sign In with Google Identity
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Bootstrapper() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400">
        <svg className="animate-spin h-9 w-9 text-emerald-500 mb-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-mono tracking-wider">Verifying security posture...</span>
      </div>
    );
  }

  return user ? <MainDashboard /> : <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <Bootstrapper />
    </AuthProvider>
  );
}

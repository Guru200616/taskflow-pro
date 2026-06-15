export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id?: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  category: string;
  ownerId: string;
  ownerName: string;
  assigneeId: string;
  assigneeName: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface UserProfile {
  userId: string;
  displayName: string;
  photoURL: string;
  updatedAt: any; // Firestore Timestamp
}

export interface UserPrivateInfo {
  email: string;
  updatedAt: any; // Firestore Timestamp
}

export interface BoardColumn {
  id: TaskStatus;
  title: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export interface TaskFilterOptions {
  searchQuery: string;
  status: string; // 'all' or specific
  priority: string; // 'all' or specific
  category: string; // 'all' or specific
  assignee: string; // 'all', 'unassigned', or specific userId
}

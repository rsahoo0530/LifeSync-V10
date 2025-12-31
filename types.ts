
export type TaskType = 'Goal' | 'Habit';
export type Category = 'Wealth' | 'Health' | 'Personal' | 'Career' | 'Other';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  gender?: string;
  dob?: string;
  secretKey?: string; // New field for data deletion security
}

export interface Task {
  id: string;
  userId: string;
  name: string;
  type: TaskType;
  why: string;
  penalty: string;
  startDate: string;
  endDate: string;
  category: Category;
  createdAt: string;
  streaks: number;
  maxStreaks: number;
  completedDates: string[]; // ISO Date strings YYYY-MM-DD
}

export interface Proof {
  id: string;
  taskId: string;
  date: string; // YYYY-MM-DD
  remark: string;
  imageUrl?: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;
  subject: string;
  content: string;
  mood: string; // Emoji
  images?: string[];
  createdAt: string;
}

export interface Todo {
  id: string;
  userId: string;
  text: string;
  completed: boolean;
  dueDate: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string; // Food, Rent, etc.
  description: string;
  date: string;
}

export interface Challenge {
  id: string;
  userId: string;
  title: string;
  description?: string; // Added description
  duration: number; // 3, 7, 21, 30
  startDate: string;
  linkedTaskId?: string | null; // Changed to allow null for Firestore
  status: 'Active' | 'Completed' | 'Failed';
  progress: string[]; // Dates completed YYYY-MM-DD
  rescueUsed: boolean;
}

export interface AppState {
  user: User | null;
  tasks: Task[];
  proofs: Proof[];
  journal: JournalEntry[];
  todos: Todo[];
  expenses: Expense[];
  challenges: Challenge[];
  settings: {
    soundEnabled: boolean;
    darkMode: boolean;
  };
}

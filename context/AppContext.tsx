
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, User, Task, Proof, JournalEntry, Todo, Expense, Challenge } from '../types';
import { auth, db } from '../services/firebase';
import { encryptObject, decryptObject, decryptText, encryptText } from '../services/encryptionService';
import { initRealTime, getRealTime } from '../services/timeService';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  User as FirebaseUser
} from 'firebase/auth';
import { 
    doc, 
    setDoc, 
    collection, 
    deleteDoc, 
    updateDoc,
    onSnapshot
} from 'firebase/firestore';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType extends AppState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (email: string, password: string, name: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  checkEmailExists: (email: string) => boolean; 
  addTask: (task: Task) => void;
  markTask: (taskId: string, proof: Proof) => void;
  addJournal: (entry: JournalEntry) => void;
  updateJournal: (entry: JournalEntry) => void;
  deleteJournal: (id: string) => void;
  addTodo: (todo: Todo) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  addExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  addChallenge: (challenge: Challenge) => void;
  updateChallenge: (challenge: Challenge) => void;
  deleteChallenge: (id: string) => void;
  updateUser: (updates: Partial<User>, newPassword?: string) => Promise<void>;
  toggleSound: () => void;
  toggleDarkMode: () => void;
  playSound: (type: 'click' | 'success' | 'error' | 'sparkle') => void;
  resetData: () => void;
  importData: (data: string) => boolean;
  exportData: () => string;
  toasts: Toast[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  registeredUsers: User[]; 
}

// Storage Key Prefix
const DATA_PREFIX = 'lifesync_data_';

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global State
  const [user, setUser] = useState<User | null>(null);
  
  // User Specific Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [settings, setSettings] = useState({ soundEnabled: true, darkMode: true });
  
  const [toasts, setToasts] = useState<Toast[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize Real Time Service on Mount
  useEffect(() => {
    initRealTime();
  }, []);

  // Load Backup from LocalStorage (initial hydration)
  const loadLocalBackup = useCallback((uid: string) => {
      try {
          const savedData = localStorage.getItem(`${DATA_PREFIX}${uid}`);
          if (savedData) {
              const parsed = JSON.parse(savedData);
              if (parsed.tasks) setTasks(parsed.tasks);
              if (parsed.proofs) setProofs(parsed.proofs);
              if (parsed.journal) setJournal(parsed.journal);
              if (parsed.todos) setTodos(parsed.todos);
              if (parsed.expenses) setExpenses(parsed.expenses);
              if (parsed.challenges) setChallenges(parsed.challenges);
              if (parsed.settings) setSettings(parsed.settings);
              return parsed.profile || {};
          }
      } catch (e) {
          console.error("Error loading local backup", e);
      }
      return {};
  }, []);

  // Save to LocalStorage (Backup)
  useEffect(() => {
    if (user?.id) {
        const userKey = `${DATA_PREFIX}${user.id}`;
        const dataToSave = { 
            tasks, 
            proofs, 
            journal, 
            todos, 
            expenses, 
            challenges,
            settings,
            profile: {
                bio: user.bio,
                gender: user.gender,
                dob: user.dob
            }
        };
        localStorage.setItem(userKey, JSON.stringify(dataToSave));
    }
  }, [user, tasks, proofs, journal, todos, expenses, challenges, settings]);

  // Auth & Real-time Database Listeners
  useEffect(() => {
    let unsubUser: () => void;
    let unsubTasks: () => void;
    let unsubProofs: () => void;
    let unsubJournal: () => void;
    let unsubTodos: () => void;
    let unsubExpenses: () => void;
    let unsubChallenges: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const uid = fbUser.uid;
        // 1. Initial Local Load (Instant UI)
        const localProfile = loadLocalBackup(uid);
        
        setUser({
            id: uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'User',
            avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
            bio: localProfile.bio || 'New Member',
            gender: localProfile.gender || 'Not Specified',
            dob: localProfile.dob || ''
        });

        // 2. Setup Real-time Listeners (Sync & Update)
        
        // User Profile & Settings
        unsubUser = onSnapshot(doc(db, 'users', uid), (docSnap) => {
             if (docSnap.exists()) {
                 const data = docSnap.data() as any;
                 if (data.settings) setSettings(data.settings);
                 
                 // Decrypt Profile Data
                 let profileData = data.profile || {};
                 if (profileData) {
                    profileData = decryptObject(profileData, uid, ['bio']);
                 }

                 setUser(prev => prev ? ({ ...prev, ...profileData }) : null);
             } else {
                 setDoc(docSnap.ref, { 
                    settings: { soundEnabled: true, darkMode: true },
                    profile: {} 
                 }, { merge: true });
             }
        }, (error) => console.log("Sync User Error:", error.message));

        // Tasks
        unsubTasks = onSnapshot(collection(db, 'users', uid, 'tasks'), (snap: any) => {
            const data = snap.docs.map((d: any) => {
                const raw = d.data() as Task;
                return decryptObject(raw, uid, ['name', 'why', 'penalty']);
            });
            setTasks(data);
        }, (error) => console.log("Sync Tasks Error:", error.message));

        // Proofs
        unsubProofs = onSnapshot(collection(db, 'users', uid, 'proofs'), (snap: any) => {
            const data = snap.docs.map((d: any) => {
                const raw = d.data() as Proof;
                return decryptObject(raw, uid, ['remark']);
            });
            setProofs(data);
        }, (error) => console.log("Sync Proofs Error:", error.message));

        // Journal
        unsubJournal = onSnapshot(collection(db, 'users', uid, 'journal'), (snap: any) => {
            const data = snap.docs.map((d: any) => {
                const raw = d.data() as JournalEntry;
                return decryptObject(raw, uid, ['subject', 'content']);
            });
            setJournal(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }, (error) => console.log("Sync Journal Error:", error.message));

        // Todos
        unsubTodos = onSnapshot(collection(db, 'users', uid, 'todos'), (snap: any) => {
            const data = snap.docs.map((d: any) => {
                const raw = d.data() as Todo;
                return decryptObject(raw, uid, ['text']);
            });
            setTodos(data);
        }, (error) => console.log("Sync Todos Error:", error.message));

        // Expenses
        unsubExpenses = onSnapshot(collection(db, 'users', uid, 'expenses'), (snap: any) => {
            const data = snap.docs.map((d: any) => {
                const raw = d.data() as Expense;
                return decryptObject(raw, uid, ['description']);
            });
            setExpenses(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }, (error) => console.log("Sync Expenses Error:", error.message));
        
        // Challenges
        unsubChallenges = onSnapshot(collection(db, 'users', uid, 'challenges'), (snap: any) => {
            const data = snap.docs.map((d: any) => {
                const raw = d.data() as Challenge;
                return decryptObject(raw, uid, ['title']);
            });
            setChallenges(data);
        }, (error) => console.log("Sync Challenges Error:", error.message));

      } else {
        // Logout
        setUser(null);
        setTasks([]);
        setProofs([]);
        setJournal([]);
        setTodos([]);
        setExpenses([]);
        setChallenges([]);
        // Unsubscribe listeners
        if (unsubUser) unsubUser();
        if (unsubTasks) unsubTasks();
        if (unsubProofs) unsubProofs();
        if (unsubJournal) unsubJournal();
        if (unsubTodos) unsubTodos();
        if (unsubExpenses) unsubExpenses();
        if (unsubChallenges) unsubChallenges();
      }
    });

    return () => {
        unsubscribeAuth();
        if (unsubUser) unsubUser();
        if (unsubTasks) unsubTasks();
        if (unsubProofs) unsubProofs();
        if (unsubJournal) unsubJournal();
        if (unsubTodos) unsubTodos();
        if (unsubExpenses) unsubExpenses();
        if (unsubChallenges) unsubChallenges();
    };
  }, [loadLocalBackup]);

  // Apply Dark Mode (Sync with state)
  useEffect(() => {
      if (settings.darkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
  }, [settings.darkMode]);

  // Save Settings to DB when they change
  useEffect(() => {
      if (user?.id) {
          const userDocRef = doc(db, 'users', user.id);
          updateDoc(userDocRef, { settings }).catch(e => {
              if (e.code !== 'permission-denied') console.error(e);
          });
      }
  }, [settings, user?.id]);

  // Audio Logic
  const initAudio = () => {
      if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
  };

  const playSynthSound = (type: 'click' | 'success' | 'error' | 'sparkle') => {
      const ctx = initAudio();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'click') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now);
          osc.stop(now + 0.1);
      } else if (type === 'success') {
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, i) => {
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g);
              g.connect(ctx.destination);
              o.type = 'sine';
              o.frequency.value = freq;
              const start = now + (i * 0.05);
              g.gain.setValueAtTime(0, start);
              g.gain.linearRampToValueAtTime(0.2, start + 0.05);
              g.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
              o.start(start);
              o.stop(start + 0.3);
          });
      } else if (type === 'error') {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(150, now);
          osc.frequency.linearRampToValueAtTime(100, now + 0.2);
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
          osc.start(now);
          osc.stop(now + 0.2);
      } else if (type === 'sparkle') {
          for(let i=0; i<5; i++) {
              const o = ctx.createOscillator();
              const g = ctx.createGain();
              o.connect(g);
              g.connect(ctx.destination);
              o.type = 'sine';
              o.frequency.value = 1000 + Math.random() * 1000;
              const start = now + (Math.random() * 0.2);
              g.gain.setValueAtTime(0.1, start);
              g.gain.exponentialRampToValueAtTime(0.01, start + 0.1);
              o.start(start);
              o.stop(start + 0.1);
          }
      }
  };

  const playSound = useCallback((type: 'click' | 'success' | 'error' | 'sparkle') => {
    if (settings.soundEnabled) {
        try { playSynthSound(type); } catch (e) { console.error(e); }
    }
  }, [settings.soundEnabled]);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // --- Auth Functions ---
  const checkEmailExists = (email: string) => false; 

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
            displayName: name,
            photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
        });
        
        try {
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                profile: { 
                    bio: encryptText('New Member', userCredential.user.uid), 
                    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` 
                },
                settings: { soundEnabled: true, darkMode: true }
            });
        } catch (e) { console.error("Initial doc error", e); }
        
        return true;
    } catch (error: any) {
        console.error("Signup Error", error);
        if (error.code === 'auth/email-already-in-use') {
             showToast('Email already in use.', 'error');
        } else if (error.code === 'auth/weak-password') {
             showToast('Password is too weak.', 'error');
        } else {
             showToast(error.message || 'Signup failed.', 'error');
        }
        return false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        playSound('success');
        showToast('Welcome back!', 'success');
        return true;
    } catch (error: any) {
        console.error("Login Error", error);
        return false;
    }
  };

  const logout = async () => {
    try {
        await signOut(auth);
        playSound('click');
        showToast('Logged out successfully', 'info');
    } catch (error) {
        console.error("Logout Error", error);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
      try {
          await sendPasswordResetEmail(auth, email);
          return true;
      } catch (error: any) {
          console.error("Reset Password Error", error);
          showToast(error.message || 'Failed to send reset email.', 'error');
          return false;
      }
  };

  const updateUser = async (updates: Partial<User>, newPassword?: string) => {
    if (auth.currentUser && user) {
        try {
            if (updates.name || updates.avatar) {
                await updateProfile(auth.currentUser, {
                    displayName: updates.name || auth.currentUser.displayName,
                    photoURL: updates.avatar || auth.currentUser.photoURL
                });
            }
            if (newPassword) {
                await updatePassword(auth.currentUser, newPassword);
                showToast('Password updated successfully.', 'success');
            }
            
            let profileUpdates = {
                bio: updates.bio,
                gender: updates.gender,
                dob: updates.dob,
                avatar: updates.avatar
            };
            
            Object.keys(profileUpdates).forEach(key => (profileUpdates as any)[key] === undefined && delete (profileUpdates as any)[key]);
            const encryptedUpdates = encryptObject(profileUpdates, user.id, ['bio']);

            await updateDoc(doc(db, 'users', user.id), { profile: encryptedUpdates });
            playSound('success');
            showToast('Profile updated.', 'success');
        } catch (error: any) {
            console.error("Update User Error", error);
            showToast('Failed to update profile.', 'error');
        }
    }
  };

  // --- Data Functions (Direct Database Writes) ---
  const addTask = async (task: Task) => {
    if (!user) return;
    try {
        const encryptedTask = encryptObject(task, user.id, ['name', 'why', 'penalty']);
        await setDoc(doc(db, 'users', user.id, 'tasks', task.id), encryptedTask);
        playSound('success');
        showToast('Task created successfully!', 'success');
    } catch(e) {
        console.error("Add Task Error", e);
        showToast('Failed to save task to cloud.', 'error');
    }
  };

  const markTask = async (taskId: string, proof: Proof) => {
    if (!user) return;
    try {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            // Use Real Time for date check logic validation
            const today = getRealTime().toISOString().split('T')[0];
            const lastDate = task.completedDates[task.completedDates.length - 1];
            let newStreaks = task.streaks;
            if (lastDate) {
                const diff = (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24);
                if (diff <= 1) newStreaks += 1;
                else newStreaks = 1;
            } else {
                newStreaks = 1;
            }

            await updateDoc(doc(db, 'users', user.id, 'tasks', taskId), {
                 completedDates: [...task.completedDates, proof.date],
                 streaks: newStreaks,
                 maxStreaks: Math.max(task.maxStreaks, newStreaks)
            });
            
            const encryptedProof = encryptObject(proof, user.id, ['remark']);
            await setDoc(doc(db, 'users', user.id, 'proofs', proof.id), encryptedProof);
            
            playSound('sparkle');
            showToast('Task completed! Keep it up!', 'success');
        }
    } catch(e) {
        console.error("Mark Task Error", e);
    }
  };

  const addJournal = async (entry: JournalEntry) => {
    if (!user) return;
    try {
        const encryptedEntry = encryptObject(entry, user.id, ['subject', 'content']);
        await setDoc(doc(db, 'users', user.id, 'journal', entry.id), encryptedEntry);
        playSound('success');
        showToast('Journal entry saved.', 'success');
    } catch(e) { console.error(e); }
  };

  const updateJournal = async (entry: JournalEntry) => {
    if (!user) return;
    try {
        const encryptedEntry = encryptObject(entry, user.id, ['subject', 'content']);
        await updateDoc(doc(db, 'users', user.id, 'journal', entry.id), encryptedEntry as any);
        playSound('click');
        showToast('Journal updated.', 'success');
    } catch(e) { console.error(e); }
  };

  const deleteJournal = async (id: string) => {
    if (!user) return;
    try {
        await deleteDoc(doc(db, 'users', user.id, 'journal', id));
        playSound('click');
        showToast('Entry deleted.', 'info');
    } catch(e) { console.error(e); }
  };

  const addTodo = async (todo: Todo) => {
    if (!user) return;
    try {
        const encryptedTodo = encryptObject(todo, user.id, ['text']);
        await setDoc(doc(db, 'users', user.id, 'todos', todo.id), encryptedTodo);
        playSound('click');
        showToast('To-Do added.', 'success');
    } catch(e) { console.error(e); }
  };

  const toggleTodo = async (id: string) => {
    if (!user) return;
    const todo = todos.find(t => t.id === id);
    if(todo) {
        try {
            await updateDoc(doc(db, 'users', user.id, 'todos', id), { completed: !todo.completed });
            playSound('click');
        } catch(e) { console.error(e); }
    }
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;
    try {
        await deleteDoc(doc(db, 'users', user.id, 'todos', id));
        playSound('click');
        showToast('Task removed.', 'info');
    } catch(e) { console.error(e); }
  };

  const addExpense = async (expense: Expense) => {
    if (!user) return;
    try {
        const encryptedExpense = encryptObject(expense, user.id, ['description']);
        await setDoc(doc(db, 'users', user.id, 'expenses', expense.id), encryptedExpense);
        playSound('success');
        showToast('Expense recorded.', 'success');
    } catch(e) { console.error(e); }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    try {
        await deleteDoc(doc(db, 'users', user.id, 'expenses', id));
        playSound('click');
        showToast('Expense removed.', 'info');
    } catch(e) { console.error(e); }
  };

  // --- Challenges Functions ---
  const addChallenge = async (challenge: Challenge) => {
      if (!user) return;
      try {
          const encryptedChallenge = encryptObject(challenge, user.id, ['title']);
          await setDoc(doc(db, 'users', user.id, 'challenges', challenge.id), encryptedChallenge);
          playSound('success');
          showToast('New Quest Started! Good Luck!', 'success');
      } catch (e) {
          console.error("Add Challenge Error", e);
          showToast('Failed to create challenge', 'error');
      }
  };

  const updateChallenge = async (challenge: Challenge) => {
      if (!user) return;
      try {
          const encryptedChallenge = encryptObject(challenge, user.id, ['title']);
          await updateDoc(doc(db, 'users', user.id, 'challenges', challenge.id), encryptedChallenge as any);
      } catch (e) {
          console.error(e);
      }
  };

  const deleteChallenge = async (id: string) => {
      if (!user) return;
      try {
          await deleteDoc(doc(db, 'users', user.id, 'challenges', id));
          playSound('click');
          showToast('Challenge removed.', 'info');
      } catch (e) { console.error(e); }
  };

  const toggleSound = () => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }));
  const toggleDarkMode = () => setSettings(s => ({ ...s, darkMode: !s.darkMode }));

  const resetData = async () => {
    if (user) {
        const userKey = `${DATA_PREFIX}${user.id}`;
        localStorage.removeItem(userKey);
        playSound('click');
        showToast('Local backup cleared.', 'info');
    }
  };

  const exportData = () => {
    return JSON.stringify({ user, tasks, proofs, journal, todos, expenses, challenges, settings });
  };

  const importData = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      if (data.tasks) setTasks(data.tasks);
      if (data.proofs) setProofs(data.proofs);
      if (data.journal) setJournal(data.journal);
      if (data.todos) setTodos(data.todos);
      if (data.expenses) setExpenses(data.expenses);
      if (data.challenges) setChallenges(data.challenges);
      if (data.settings) setSettings(data.settings);
      playSound('success');
      showToast('Data imported to view.', 'success');
      return true;
    } catch (e) {
      playSound('error');
      showToast('Import failed: Invalid file.', 'error');
      return false;
    }
  };

  return (
    <AppContext.Provider value={{
      user, tasks, proofs, journal, todos, expenses, challenges, settings, toasts, registeredUsers: [],
      login, logout, signup, resetPassword, checkEmailExists, 
      addTask, markTask, 
      addJournal, updateJournal, deleteJournal,
      addTodo, toggleTodo, deleteTodo, 
      addExpense, deleteExpense, 
      addChallenge, updateChallenge, deleteChallenge,
      updateUser,
      toggleSound, toggleDarkMode, playSound, resetData, importData, exportData, showToast
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

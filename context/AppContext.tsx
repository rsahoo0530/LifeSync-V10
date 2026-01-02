
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState, User, Task, Proof, JournalEntry, Todo, Expense, Challenge, Session } from '../types';
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
    onSnapshot,
    getDocs,
    serverTimestamp,
    query,
    orderBy
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
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
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
  deleteAccountData: () => Promise<void>;
  toggleSound: () => void;
  toggleDarkMode: () => void;
  playSound: (type: 'click' | 'success' | 'error' | 'sparkle') => void;
  resetData: () => void; 
  importData: (data: string) => boolean;
  exportData: () => string;
  toasts: Toast[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  registeredUsers: User[]; 
  activeSessions: Session[];
}

const DATA_PREFIX = 'lifesync_data_';
const AppContext = createContext<AppContextType | undefined>(undefined);

const getDetailedDeviceName = () => {
    const ua = navigator.userAgent;
    let browser = "Web Browser";
    let os = "OS";
    if (ua.indexOf("Firefox") > -1) browser = "Firefox";
    else if (ua.indexOf("Edg") > -1) browser = "Edge";
    else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";
    if (ua.indexOf("Windows NT 10.0") > -1) os = "Windows 10/11";
    else if (ua.indexOf("Macintosh") > -1) os = "Mac";
    else if (ua.indexOf("Android") > -1) os = "Android Device";
    else if (ua.indexOf("iPhone") > -1) os = "iPhone";
    return `${browser} on ${os}`;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [settings, setSettings] = useState({ soundEnabled: true, darkMode: true });
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => { initRealTime(); }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  const loadLocalBackup = useCallback((uid: string) => {
      try {
          const savedData = localStorage.getItem(`${DATA_PREFIX}${uid}`);
          if (savedData) {
              const parsed = JSON.parse(savedData);
              if (parsed.tasks) setTasks(parsed.tasks);
              if (parsed.settings) setSettings(parsed.settings);
              return parsed.profile || {};
          }
      } catch (e) {}
      return {};
  }, []);

  useEffect(() => {
    if (user?.id) {
        localStorage.setItem(`${DATA_PREFIX}${user.id}`, JSON.stringify({ tasks, settings, profile: { bio: user.bio, gender: user.gender, dob: user.dob } }));
    }
  }, [user, tasks, settings]);

  useEffect(() => {
    let unsubUser: () => void;
    let unsubTasks: () => void;
    let unsubSessions: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const uid = fbUser.uid;
        loadLocalBackup(uid);
        setUser({ id: uid, email: fbUser.email || '', name: fbUser.displayName || 'User', avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}` });

        let dId = localStorage.getItem('ls_device_id');
        if (!dId) { dId = crypto.randomUUID(); localStorage.setItem('ls_device_id', dId); }
        
        const sessionRef = doc(db, 'users', uid, 'sessions', dId);
        setDoc(sessionRef, { deviceName: getDetailedDeviceName(), lastActive: serverTimestamp() }, { merge: true });

        unsubSessions = onSnapshot(query(collection(db, 'users', uid, 'sessions'), orderBy('lastActive', 'desc')), (snap) => {
            setActiveSessions(snap.docs.map(d => ({ id: d.id, deviceName: d.data().deviceName, lastActive: d.data().lastActive, isCurrent: d.id === dId })));
        });

        unsubUser = onSnapshot(doc(db, 'users', uid), (docSnap) => {
             if (docSnap.exists()) {
                 const data = docSnap.data();
                 if (data.settings) setSettings(data.settings);
                 let profileData = data.profile ? decryptObject(data.profile, uid, ['bio', 'secretKey']) : {};
                 setUser(prev => prev ? ({ ...prev, ...profileData }) : null);
             }
        });

        unsubTasks = onSnapshot(collection(db, 'users', uid, 'tasks'), (snap) => {
            setTasks(snap.docs.map(d => decryptObject(d.data() as Task, uid, ['name', 'why', 'penalty'])));
        });
        
        onSnapshot(collection(db, 'users', uid, 'proofs'), (snap) => setProofs(snap.docs.map(d => decryptObject(d.data() as Proof, uid, ['remark']))));
        onSnapshot(collection(db, 'users', uid, 'journal'), (snap) => setJournal(snap.docs.map(d => decryptObject(d.data() as JournalEntry, uid, ['subject', 'content'])).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())));
        onSnapshot(collection(db, 'users', uid, 'todos'), (snap) => setTodos(snap.docs.map(d => decryptObject(d.data() as Todo, uid, ['text']))));
        onSnapshot(collection(db, 'users', uid, 'expenses'), (snap) => setExpenses(snap.docs.map(d => decryptObject(d.data() as Expense, uid, ['description'])).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())));
        onSnapshot(collection(db, 'users', uid, 'challenges'), (snap) => setChallenges(snap.docs.map(d => decryptObject(d.data() as Challenge, uid, ['title', 'description']))));

      } else {
        setUser(null); setTasks([]); setProofs([]); setJournal([]); setTodos([]); setExpenses([]); setChallenges([]); setActiveSessions([]);
        if (unsubUser) unsubUser(); if (unsubTasks) unsubTasks(); if (unsubSessions) unsubSessions();
      }
    });
    return () => { unsubscribeAuth(); if (unsubUser) unsubUser(); if (unsubTasks) unsubTasks(); if (unsubSessions) unsubSessions(); };
  }, [loadLocalBackup]);

  useEffect(() => {
      if (settings.darkMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  }, [settings.darkMode]);

  useEffect(() => {
      if (user?.id) updateDoc(doc(db, 'users', user.id), { settings }).catch(() => {});
  }, [settings, user?.id]);

  // Fix: Add missing toggleSound function
  const toggleSound = useCallback(() => {
    setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  }, []);

  // Fix: Add missing toggleDarkMode function
  const toggleDarkMode = useCallback(() => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
  }, []);

  const playSynthSound = useCallback((type: 'click' | 'success' | 'error' | 'sparkle') => {
      if (!settings.soundEnabled) return;
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.connect(gainNode); gainNode.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === 'click') {
          osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
          gainNode.gain.setValueAtTime(0.3, now); gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now); osc.stop(now + 0.1);
      } else if (type === 'success') {
          [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
              const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination);
              o.type = 'sine'; o.frequency.value = freq;
              const start = now + (i * 0.05); g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(0.2, start + 0.05); g.gain.exponentialRampToValueAtTime(0.01, start + 0.3);
              o.start(start); o.stop(start + 0.3);
          });
      } else if (type === 'error') {
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.linearRampToValueAtTime(100, now + 0.2);
          gainNode.gain.setValueAtTime(0.3, now); gainNode.gain.linearRampToValueAtTime(0.01, now + 0.2);
          osc.start(now); osc.stop(now + 0.2);
      } else if (type === 'sparkle') {
          for(let i=0; i<5; i++) {
              const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination);
              o.type = 'sine'; o.frequency.value = 1000 + Math.random() * 1000;
              const start = now + (Math.random() * 0.2); g.gain.setValueAtTime(0.1, start); g.gain.exponentialRampToValueAtTime(0.01, start + 0.1);
              o.start(start); o.stop(start + 0.1);
          }
      }
  }, [settings.soundEnabled]);

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name, photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` });
        await setDoc(doc(db, 'users', userCredential.user.uid), { profile: { bio: encryptText('New Member', userCredential.user.uid) }, settings: { soundEnabled: true, darkMode: true } });
        showToast('Account initialized successfully!', 'success');
        return true;
    } catch (error: any) { 
        if (error.code === 'auth/email-already-in-use') showToast('Email already registered. Try logging in.', 'error');
        else showToast(error.message, 'error');
        playSynthSound('error');
        return false; 
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try { 
        await signInWithEmailAndPassword(auth, email, password); 
        showToast('Welcome back!', 'success');
        return true; 
    } catch (error: any) { 
        showToast('Incorrect email or password.', 'error'); 
        playSynthSound('error');
        return false; 
    }
  };

  const logout = async () => {
      if (user) { const dId = localStorage.getItem('ls_device_id'); if (dId) await deleteDoc(doc(db, 'users', user.id, 'sessions', dId)); }
      await signOut(auth); showToast('Logged out.', 'info');
  };

  const addTask = async (task: Task) => {
    if (!user) return;
    await setDoc(doc(db, 'users', user.id, 'tasks', task.id), encryptObject(task, user.id, ['name', 'why', 'penalty']));
    showToast('Task Created!', 'success'); playSynthSound('success');
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.id, 'tasks', id));
    showToast('Task Deleted.', 'info'); playSynthSound('click');
  };

  const addChallenge = async (challenge: Challenge) => {
      if (!user) return;
      await setDoc(doc(db, 'users', user.id, 'challenges', challenge.id), encryptObject(challenge, user.id, ['title', 'description']));
      showToast('New Quest Started!', 'success'); playSynthSound('success');
  };

  const deleteChallenge = async (id: string) => {
      if (!user) return;
      await deleteDoc(doc(db, 'users', user.id, 'challenges', id));
      showToast('Quest Removed.', 'info'); playSynthSound('click');
  };

  // Other stubs...
  const markTask = async (taskId: string, proof: Proof) => {
    if (!user) return;
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        const today = getRealTime().toISOString().split('T')[0];
        const lastDate = task.completedDates[task.completedDates.length - 1];
        let newStreaks = lastDate ? ((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000 <= 1 ? task.streaks + 1 : 1) : 1;
        await updateDoc(doc(db, 'users', user.id, 'tasks', taskId), { completedDates: [...task.completedDates, proof.date], streaks: newStreaks, maxStreaks: Math.max(task.maxStreaks, newStreaks) });
        await setDoc(doc(db, 'users', user.id, 'proofs', proof.id), encryptObject(proof, user.id, ['remark']));
        showToast('Progress Recorded!', 'success');
    }
  };
  const addJournal = async (entry: JournalEntry) => { if (!user) return; await setDoc(doc(db, 'users', user.id, 'journal', entry.id), encryptObject(entry, user.id, ['subject', 'content'])); showToast('Journal entry saved.', 'success'); };
  const deleteJournal = async (id: string) => { if (!user) return; await deleteDoc(doc(db, 'users', user.id, 'journal', id)); showToast('Entry deleted.', 'info'); };
  const addTodo = async (todo: Todo) => { if (!user) return; await setDoc(doc(db, 'users', user.id, 'todos', todo.id), encryptObject(todo, user.id, ['text'])); showToast('Task added to list.', 'success'); };
  const deleteTodo = async (id: string) => { if (!user) return; await deleteDoc(doc(db, 'users', user.id, 'todos', id)); showToast('Task removed.', 'info'); };
  const addExpense = async (expense: Expense) => { if (!user) return; await setDoc(doc(db, 'users', user.id, 'expenses', expense.id), encryptObject(expense, user.id, ['description'])); showToast('Expense recorded.', 'success'); };
  const deleteExpense = async (id: string) => { if (!user) return; await deleteDoc(doc(db, 'users', user.id, 'expenses', id)); showToast('Expense removed.', 'info'); };

  return (
    <AppContext.Provider value={{
      user, tasks, proofs, journal, todos, expenses, challenges, settings, toasts, activeSessions, registeredUsers: [],
      login, logout, signup, resetPassword: async () => false, checkEmailExists: () => false, 
      addTask, updateTask: async (t) => { if(!user) return; await updateDoc(doc(db, 'users', user.id, 'tasks', t.id), encryptObject(t, user.id, ['name', 'why', 'penalty']) as any); showToast('Task updated.', 'success'); },
      deleteTask, markTask, addJournal, updateJournal: async (j) => { if(!user) return; await updateDoc(doc(db, 'users', user.id, 'journal', j.id), encryptObject(j, user.id, ['subject', 'content']) as any); showToast('Journal updated.', 'success'); },
      deleteJournal, addTodo, toggleTodo: async (id) => { if(!user) return; const t = todos.find(x => x.id === id); if(t) await updateDoc(doc(db, 'users', user.id, 'todos', id), { completed: !t.completed }); },
      deleteTodo, addExpense, deleteExpense, addChallenge, updateChallenge: async (c) => { if(!user) return; await updateDoc(doc(db, 'users', user.id, 'challenges', c.id), encryptObject(c, user.id, ['title', 'description']) as any); },
      deleteChallenge, updateUser: async () => {}, deleteAccountData: async () => {},
      toggleSound, toggleDarkMode, playSound: playSynthSound, resetData: () => {}, importData: () => false, exportData: () => "", showToast
    }}>
      {children}
    </AppContext.Provider>
  );
};
export const useApp = () => { const context = useContext(AppContext); if (!context) throw new Error("useApp error"); return context; };

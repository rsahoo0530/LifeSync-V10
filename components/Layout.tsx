
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, CheckSquare, Book, Calendar, 
  Image, BarChart2, ListTodo, DollarSign, User, Settings, LogOut, Lightbulb, Menu, X, XCircle, CheckCircle, Info, Target
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';

const Toaster: React.FC = () => {
    const { toasts } = useApp();
    return (
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div key={toast.id} className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl transform transition-all duration-300 animate-slide-up pointer-events-auto
                    ${toast.type === 'success' ? 'bg-green-500 text-white' : ''}
                    ${toast.type === 'error' ? 'bg-red-500 text-white' : ''}
                    ${toast.type === 'info' ? 'bg-blue-500 text-white' : ''}
                `}>
                    {toast.type === 'success' && <CheckCircle size={20} />}
                    {toast.type === 'error' && <XCircle size={20} />}
                    {toast.type === 'info' && <Info size={20} />}
                    <span className="font-medium">{toast.message}</span>
                </div>
            ))}
        </div>
    );
};

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, playSound, tasks, todos, user } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notification Logic
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      if (Notification.permission !== "granted") return;
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const pendingHabits = tasks.filter(t => !t.completedDates.includes(todayStr));
      if (pendingHabits.length > 0) {
        new Notification("LifeSync Pro Reminder", {
          body: `You have ${pendingHabits.length} habits left to complete today! Keep your streak alive.`,
          icon: '/favicon.ico'
        });
      }
    };
    const timer = setTimeout(checkReminders, 5000);
    return () => clearTimeout(timer);
  }, [tasks]);

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/challenges', icon: Target, label: 'Challenges' }, // Added
    { to: '/insights', icon: Lightbulb, label: 'Insights' },
    { to: '/journal', icon: Book, label: 'Journal' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/todos', icon: ListTodo, label: 'To-Do' },
    { to: '/proof-wall', icon: Image, label: 'Proof Wall' },
    { to: '/expenses', icon: DollarSign, label: 'Expenses' },
    { to: '/analytics', icon: BarChart2, label: 'Analytics' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleNavClick = () => {
    playSound('click');
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen bg-rose-light dark:bg-dark text-gray-900 dark:text-gray-100 overflow-hidden font-sans transition-colors duration-300">
      <Toaster />
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col glass-panel border-r border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-darkcard/50">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20 animate-pulse-slow">
            L
          </div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">LifeSync Pro</h1>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-primary text-white font-medium shadow-md shadow-primary/30' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon size={20} className="relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-gray-100 dark:bg-black/20 rounded-lg">
                 <img src={user?.avatar || 'https://via.placeholder.com/40'} className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 object-cover" alt="User" />
                 <div className="overflow-hidden">
                     <p className="text-sm font-bold truncate text-gray-800 dark:text-gray-200">{user?.name}</p>
                     <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                 </div>
            </div>
            <button 
                onClick={() => { playSound('click'); logout(); }}
                className="flex items-center gap-3 px-3 py-3 w-full text-left text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/10 rounded-xl transition-colors font-medium"
            >
                <LogOut size={20} />
                <span>Sign Out</span>
            </button>
        </div>
      </aside>

      {/* Mobile Header & Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-darkcard/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-50 flex items-center justify-between px-4 shadow-sm">
         <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">L</div>
             <span className="font-bold text-lg text-gray-900 dark:text-white">LifeSync Pro</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
             <Menu size={28} />
         </button>
      </div>

      {/* Mobile Sidebar Drawer */}
      <div className={`fixed inset-0 z-[60] transform transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="absolute top-0 left-0 bottom-0 w-[80%] max-w-sm bg-white dark:bg-darkcard shadow-2xl flex flex-col h-full border-r border-gray-200 dark:border-gray-700">
              <div className="p-6 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                  <span className="font-bold text-xl text-gray-900 dark:text-white">Menu</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"><X size={24} /></button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                  {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={handleNavClick}
                        className={({ isActive }) =>
                            `flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                            isActive 
                                ? 'bg-primary text-white shadow-lg' 
                                : 'text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium'
                            }`
                        }
                    >
                        <item.icon size={22} />
                        <span className="text-lg">{item.label}</span>
                    </NavLink>
                  ))}
              </nav>
              <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20">
                   <div className="flex items-center gap-3 mb-4">
                        <img src={user?.avatar || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover border border-gray-300" alt="User" />
                        <div>
                             <p className="font-bold text-gray-900 dark:text-white">{user?.name}</p>
                             <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                   </div>
                   <button 
                        onClick={() => { playSound('click'); logout(); }}
                        className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl font-bold transition-colors border border-transparent hover:border-red-100"
                    >
                        <LogOut size={22} />
                        <span>Sign Out</span>
                    </button>
              </div>
          </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8 pb-8 relative">
        <div className="max-w-7xl mx-auto animate-fade-in">
           {children}
        </div>
      </main>
    </div>
  );
};

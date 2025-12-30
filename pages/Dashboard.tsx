
import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { QUOTES } from '../constants';
import { format, subDays, addDays, isBefore, parseISO } from 'date-fns';
import { TrendingUp, CheckCircle, Flame, Activity, Heart, BookOpen, MoreHorizontal, DollarSign, Quote, AlertTriangle, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer, Tooltip as ReTooltip } from 'recharts';
import { Confetti } from '../components/ui/Confetti';
import { getRealTime, getRealDateString } from '../services/timeService';

export const Dashboard: React.FC = () => {
  const { user, tasks, todos, expenses, journal } = useApp();
  const [showConfetti, setShowConfetti] = useState(false);
  const [realNow, setRealNow] = useState(new Date());

  // Update time reference on mount to be sure we have latest synced time
  useEffect(() => {
      setRealNow(getRealTime());
      const interval = setInterval(() => setRealNow(getRealTime()), 60000); // Update minute
      return () => clearInterval(interval);
  }, []);

  const todayStr = getRealDateString();
  const yesterdayStr = format(addDays(realNow, -1), 'yyyy-MM-dd');
  
  const pendingTodos = todos.filter(t => !t.completed).length;
  const quote = QUOTES[realNow.getDate() % QUOTES.length];
  
  // Logic for Broken Streak Alerts (Missed Yesterday)
  const brokenStreaks = useMemo(() => {
      return tasks.filter(t => {
          const startDate = parseISO(t.startDate);
          const yesterday = addDays(realNow, -1);
          // Only care if task started before today
          if (isBefore(startDate, realNow)) {
              // If not done yesterday AND not done today (yet), it's a break/risk
              const doneYesterday = t.completedDates.includes(yesterdayStr);
              return !doneYesterday; 
          }
          return false;
      });
  }, [tasks, yesterdayStr, realNow]);

  const habitsDoneToday = tasks.filter(t => t.completedDates.includes(todayStr)).length;
  const habitsTotal = tasks.length;
  const progressPercent = habitsTotal > 0 ? Math.round((habitsDoneToday / habitsTotal) * 100) : 0;

  useEffect(() => {
    if (habitsTotal > 0 && habitsDoneToday === habitsTotal) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(t);
    }
  }, [habitsDoneToday, habitsTotal]);

  const weeklyData = Array.from({length: 7}, (_, i) => {
      const d = subDays(realNow, 6 - i);
      const dStr = format(d, 'yyyy-MM-dd');
      let count = 0;
      tasks.forEach(t => { if(t.completedDates.includes(dStr)) count++; });
      return { day: format(d, 'EEE'), count };
  });

  // Weekly Review Metrics (Last 7 Days)
  const weeklyReview = useMemo(() => {
      const start = subDays(realNow, 7);
      let totalCompleted = 0;
      let highestStreak = 0;
      let totalSpent = 0;
      const moodCounts: Record<string, number> = {};

      tasks.forEach(t => {
          totalCompleted += t.completedDates.filter(d => new Date(d) >= start).length;
          if (t.streaks > highestStreak) highestStreak = t.streaks;
      });

      expenses.forEach(e => {
          if (new Date(e.date) >= start) totalSpent += e.amount;
      });

      journal.forEach(j => {
          if (new Date(j.date) >= start) {
              moodCounts[j.mood] = (moodCounts[j.mood] || 0) + 1;
          }
      });
      
      const dominantMood = Object.keys(moodCounts).sort((a,b) => moodCounts[b] - moodCounts[a])[0] || '-';

      return { totalCompleted, highestStreak, totalSpent, dominantMood };
  }, [tasks, expenses, journal, realNow]);

  return (
    <div className="space-y-8 animate-fade-in relative">
      <Confetti trigger={showConfetti} />

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 p-8 md:p-12 text-white shadow-2xl transform transition-transform hover:scale-[1.01] duration-500">
        <div className="relative z-10 grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-semibold mb-4 backdrop-blur-md border border-white/20">
                  {format(realNow, 'EEEE, MMMM do')}
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight tracking-tight">
                Good {realNow.getHours() < 12 ? 'Morning' : 'Evening'}, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-purple-200">{user?.name}</span>!
              </h1>
              
              <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 border border-white/10 inline-block max-w-lg mt-4 shadow-lg">
                <p className="italic text-lg md:text-xl font-light opacity-90">"{quote}"</p>
              </div>
            </div>
            
            {/* Today's Snapshot Card */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl relative overflow-hidden group hover:bg-white/15 transition-colors">
                <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-50 transition-opacity animate-pulse-slow"><Activity size={40} /></div>
                <h3 className="font-bold text-xl mb-6">Today's Focus</h3>
                
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between text-sm mb-2 font-medium opacity-90">
                            <span>Daily Habits</span>
                            <span>{habitsDoneToday} / {habitsTotal}</span>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                            <div className="bg-white rounded-full h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.8)]" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-4">
                        <div className="text-center group-hover:translate-y-[-2px] transition-transform">
                            <span className="block text-2xl font-bold">{pendingTodos}</span>
                            <span className="text-xs opacity-70 uppercase tracking-wider">To-Dos</span>
                        </div>
                        <div className="text-center border-l border-white/10 group-hover:translate-y-[-2px] transition-transform delay-75">
                            <span className="block text-2xl font-bold">₹{expenses.filter(e => e.date.startsWith(todayStr)).reduce((a,b)=>a+b.amount,0)}</span>
                            <span className="text-xs opacity-70 uppercase tracking-wider">Spent</span>
                        </div>
                        <div className="text-center border-l border-white/10 group-hover:translate-y-[-2px] transition-transform delay-100">
                            <span className="block text-2xl font-bold">{journal.filter(j=>j.date.startsWith(todayStr)).length}</span>
                            <span className="text-xs opacity-70 uppercase tracking-wider">Entries</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Stats & Charts) */}
        <div className="lg:col-span-2 space-y-8">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Habits', value: tasks.length, icon: TrendingUp, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' },
                    { label: 'Pending', value: pendingTodos, icon: CheckCircle, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300' },
                    { label: 'Mood', value: journal[0]?.mood || '-', icon: Heart, color: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300' },
                    { label: 'Spent', value: `₹${expenses.reduce((a,b)=>a+b.amount,0).toFixed(0)}`, icon: DollarSign, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-darkcard p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform duration-200 cursor-default">
                        <div className={`p-3 rounded-full mb-2 ${stat.color}`}>
                            <stat.icon size={20} />
                        </div>
                        <span className="text-2xl font-bold">{stat.value}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">{stat.label}</span>
                    </div>
                ))}
            </div>

             {/* Streak Broken Alert Section */}
             {brokenStreaks.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400 font-bold text-lg">
                        <AlertTriangle size={24} className="animate-pulse" />
                        <h3>Streak Alert!</h3>
                    </div>
                    <p className="text-sm text-red-500 dark:text-red-300 mb-3">You missed these habits yesterday:</p>
                    <div className="flex flex-wrap gap-2">
                        {brokenStreaks.map(t => (
                            <div key={t.id} className="bg-white dark:bg-black/20 px-3 py-1.5 rounded-lg border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-300 text-sm font-medium">
                                {t.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Weekly Activity Chart */}
            <div className="bg-white dark:bg-darkcard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg">Weekly Momentum</h3>
                    <div className="flex gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    </div>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={weeklyData}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <ReTooltip 
                                contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: 'white', fontSize: '12px'}} 
                                itemStyle={{color: '#fff'}}
                                cursor={{stroke: '#6366f1', strokeWidth: 1}}
                            />
                            <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} activeDot={{r: 6, strokeWidth: 0}} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Top Streaks */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Top Streaks</h2>
                    <Link to="/tasks" className="text-primary text-sm hover:underline font-medium">View All</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {tasks.sort((a,b) => b.streaks - a.streaks).slice(0, 3).map((task, idx) => (
                        <div key={task.id} className="relative overflow-hidden bg-white dark:bg-darkcard p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-all">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-5xl font-black">{idx + 1}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                                <Flame className={idx === 0 ? "text-orange-500" : "text-gray-400"} fill={idx === 0 ? "currentColor" : "none"} />
                                <h3 className="font-bold text-base truncate">{task.name}</h3>
                            </div>
                            <p className="text-2xl font-bold text-primary">{task.streaks} <span className="text-xs text-gray-500 font-normal">days</span></p>
                        </div>
                    ))}
                    {tasks.length === 0 && (
                        <div className="col-span-3 text-center py-8 bg-white dark:bg-darkcard rounded-2xl border border-dashed dark:border-gray-700 text-gray-400">
                            Start a habit to see streaks here.
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
             {/* Weekly Review Card */}
            <div className="bg-white dark:bg-darkcard p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-purple-500"/> Weekly Review
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Total Completed</p>
                        <p className="text-xl font-bold">{weeklyReview.totalCompleted}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Highest Streak</p>
                        <p className="text-xl font-bold">{weeklyReview.highestStreak}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Total Spent</p>
                        <p className="text-xl font-bold">₹{weeklyReview.totalSpent}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-black/20 p-3 rounded-xl">
                        <p className="text-xs text-gray-500 mb-1">Mood Trend</p>
                        <p className="text-xl">{weeklyReview.dominantMood}</p>
                    </div>
                </div>
            </div>

            {/* New Wellness Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/10 p-6 rounded-2xl border border-green-100 dark:border-green-900/30">
                <h3 className="font-bold text-lg flex items-center gap-2 text-green-800 dark:text-green-300 mb-2">
                    <Quote size={20} className="fill-current" /> Daily Wisdom
                </h3>
                <p className="italic text-green-700 dark:text-green-400 text-sm">
                   "Consistency is not about being perfect. It's about refusing to give up."
                </p>
            </div>

            {/* Recent Journal */}
            <div className="bg-white dark:bg-darkcard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen size={20} className="text-pink-500"/> Recent Thoughts</h3>
                    <Link to="/journal"><MoreHorizontal size={20} className="text-gray-400 hover:text-gray-600" /></Link>
                </div>
                <div className="space-y-4">
                    {journal.slice(0, 3).map(entry => (
                        <div key={entry.id} className="p-3 rounded-xl bg-gray-50 dark:bg-black/20 hover:bg-gray-100 dark:hover:bg-black/30 transition-colors cursor-pointer">
                            <div className="flex justify-between mb-1">
                                <span className="text-xs font-bold text-gray-400">{format(new Date(entry.date), 'MMM d')}</span>
                                <span className="text-lg">{entry.mood}</span>
                            </div>
                            <h4 className="font-bold text-sm mb-1">{entry.subject}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2">{entry.content}</p>
                        </div>
                    ))}
                    {journal.length === 0 && <p className="text-center text-sm text-gray-400 py-4">No entries yet.</p>}
                </div>
                <Link to="/journal" className="block mt-4 text-center text-sm text-primary font-medium hover:underline">Write an entry</Link>
            </div>

            {/* Upcoming Todos */}
            <div className="bg-white dark:bg-darkcard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Up Next</h3>
                    <Link to="/todos" className="text-primary text-sm hover:underline">Manage</Link>
                </div>
                <div className="space-y-3">
                    {todos.filter(t => !t.completed).slice(0, 5).map(todo => (
                        <div key={todo.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-black/20">
                            <div className="mt-1 w-2 h-2 rounded-full bg-primary shrink-0"></div>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{todo.text}</p>
                                {todo.dueDate && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <Clock size={10} /> {format(new Date(todo.dueDate), 'MMM d')}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                    {todos.filter(t => !t.completed).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <CheckCircle size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">All caught up!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

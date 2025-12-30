
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Challenge } from '../types';
import { Button } from '../components/ui/Button';
import { Confetti } from '../components/ui/Confetti';
import { Flame, Trophy, Shield, Plus, Clock, Target, Calendar, Award, Star, AlertCircle } from 'lucide-react';
import { getRealDateString, getRealTime } from '../services/timeService';
import { differenceInCalendarDays, addDays, format, parseISO, isSameDay } from 'date-fns';

export const Challenges: React.FC = () => {
  const { challenges, addChallenge, updateChallenge, tasks, playSound, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'active' | 'records' | 'new'>('active');
  const [showConfetti, setShowConfetti] = useState(false);
  
  // New Challenge Form
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState<3 | 7 | 21 | 30>(7);
  const [linkTaskId, setLinkTaskId] = useState('');

  const todayStr = getRealDateString();
  const realNow = getRealTime();

  const activeChallenges = challenges.filter(c => c.status === 'Active');

  const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle) return;

      // 1. Validation: Check if a challenge with this title or linked task is already active
      const isDuplicate = activeChallenges.some(c => 
          c.title.toLowerCase() === newTitle.trim().toLowerCase() || 
          (linkTaskId && c.linkedTaskId === linkTaskId)
      );

      if (isDuplicate) {
          playSound('error');
          showToast('This quest is already active! Complete it first.', 'error');
          return;
      }

      const challenge: Challenge = {
          id: crypto.randomUUID(),
          userId: 'current',
          title: newTitle,
          duration: newDuration,
          startDate: todayStr,
          linkedTaskId: linkTaskId || undefined,
          status: 'Active',
          progress: [],
          rescueUsed: false
      };
      addChallenge(challenge);
      setNewTitle('');
      setLinkTaskId('');
      setActiveTab('active');
  };

  const markToday = (c: Challenge) => {
      if (c.progress.includes(todayStr)) return;
      const newProgress = [...c.progress, todayStr];
      const isFinished = newProgress.length >= c.duration;
      
      updateChallenge({
          ...c,
          progress: newProgress,
          status: isFinished ? 'Completed' : 'Active'
      });
      playSound(isFinished ? 'success' : 'sparkle');
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
  };

  const useRescue = (c: Challenge) => {
      if (c.rescueUsed) return;
      const yesterday = format(addDays(realNow, -1), 'yyyy-MM-dd');
      if (!c.progress.includes(yesterday)) {
          updateChallenge({
              ...c,
              progress: [...c.progress, yesterday],
              rescueUsed: true
          });
          playSound('click');
      }
  };

  const getProgress = (c: Challenge) => {
      return Math.round((c.progress.length / c.duration) * 100);
  };

  const getDaysLeft = (c: Challenge) => {
      const start = parseISO(c.startDate);
      const end = addDays(start, c.duration - 1);
      const diff = differenceInCalendarDays(end, realNow);
      return Math.max(0, diff + 1); // Inclusive today
  };

  const pastChallenges = challenges.filter(c => c.status !== 'Active');
  const completedCount = challenges.filter(c => c.status === 'Completed').length;
  const badges = [
      { id: 1, name: 'First Steps', desc: 'Complete 1 Challenge', icon: Star, color: 'text-orange-400', unlocked: completedCount >= 1 },
      { id: 2, name: 'Consistency King', desc: 'Complete 3 Challenges', icon: Award, color: 'text-gray-400', unlocked: completedCount >= 3 },
      { id: 3, name: 'Unstoppable', desc: 'Complete 5 Challenges', icon: Trophy, color: 'text-yellow-500', unlocked: completedCount >= 5 },
  ];

  return (
    <div className="space-y-6 relative">
      <Confetti trigger={showConfetti} />
      
      {/* Header */}
      <div>
          <h2 className="text-3xl font-bold">Challenge Mode</h2>
          <p className="text-gray-500">Push your limits with time-bound quests.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button 
             onClick={() => { playSound('click'); setActiveTab('active'); }}
             className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              Active
          </button>
          <button 
             onClick={() => { playSound('click'); setActiveTab('records'); }}
             className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'records' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              Records
          </button>
          <button 
             onClick={() => { playSound('click'); setActiveTab('new'); }}
             className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 ${activeTab === 'new' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              New Quest
          </button>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
          {activeTab === 'active' && (
              <div className="grid gap-6">
                  {activeChallenges.length === 0 && (
                      <div className="text-center py-12 bg-gray-50 dark:bg-darkcard rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                          <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
                          <p className="text-gray-500 font-medium">No active challenges.</p>
                          <button onClick={() => setActiveTab('new')} className="text-primary hover:underline mt-2">Start a new quest</button>
                      </div>
                  )}
                  {activeChallenges.map(c => {
                      const progress = getProgress(c);
                      const doneToday = c.progress.includes(todayStr);
                      const daysLeft = getDaysLeft(c);
                      
                      return (
                          <div key={c.id} className="bg-white dark:bg-darkcard rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-purple-600"></div>
                              
                              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                                              <Flame size={20} className={doneToday ? "animate-pulse" : ""} />
                                          </div>
                                          <h3 className="text-xl font-bold">{c.title}</h3>
                                          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">
                                              Day {c.progress.length + (doneToday ? 0 : 1)} / {c.duration}
                                          </span>
                                      </div>
                                      
                                      <div className="space-y-2 max-w-md">
                                          <div className="flex justify-between text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                              <span>{progress}% Locked In</span>
                                              <span>{daysLeft} Days Left</span>
                                          </div>
                                          <div className="w-full bg-gray-200 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                                              <div className="bg-gradient-to-r from-primary to-purple-500 h-full transition-all duration-1000" style={{width: `${progress}%`}}></div>
                                          </div>
                                      </div>
                                  </div>

                                  <div className="flex flex-col items-center gap-3">
                                      {!doneToday ? (
                                          <Button onClick={() => markToday(c)} className="shadow-xl shadow-primary/30 animate-pulse-slow">
                                              Mark Today
                                          </Button>
                                      ) : (
                                          <div className="flex items-center gap-2 text-green-500 font-bold bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl">
                                              <Trophy size={18} /> Done for today!
                                          </div>
                                      )}
                                      
                                      {!c.rescueUsed && !doneToday && (
                                          <button onClick={() => useRescue(c)} className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors">
                                              <Shield size={12} /> Missed yesterday? Rescue (1 left)
                                          </button>
                                      )}
                                  </div>
                              </div>
                          </div>
                      );
                  })}
              </div>
          )}

          {activeTab === 'records' && (
              <div className="space-y-8">
                  {/* Stats Bar */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-wrap justify-around gap-4 text-center">
                      <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">Challenges Crushed</p>
                          <p className="text-3xl font-bold">{completedCount}</p>
                      </div>
                      <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">Current Active</p>
                          <p className="text-3xl font-bold">{activeChallenges.length}</p>
                      </div>
                      <div>
                          <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">Total Days</p>
                          <p className="text-3xl font-bold">{challenges.reduce((acc, c) => acc + c.progress.length, 0)}</p>
                      </div>
                  </div>

                  {/* Badge Tray */}
                  <div>
                      <h3 className="font-bold text-lg mb-4">Your Trophy Case</h3>
                      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                          {badges.map(b => (
                              <div key={b.id} className={`flex-shrink-0 w-32 p-4 rounded-xl border ${b.unlocked ? 'bg-white dark:bg-darkcard border-yellow-200 dark:border-yellow-900 shadow-md' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'} flex flex-col items-center text-center`}>
                                  <div className={`p-3 rounded-full mb-2 ${b.unlocked ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                      <b.icon size={24} className={b.unlocked ? b.color : 'text-gray-400'} />
                                  </div>
                                  <p className="font-bold text-sm">{b.name}</p>
                                  <p className="text-[10px] text-gray-500 mt-1">{b.desc}</p>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* History List */}
                  <div>
                      <h3 className="font-bold text-lg mb-4">History</h3>
                      <div className="space-y-3">
                          {pastChallenges.map(c => (
                              <div key={c.id} className="bg-white dark:bg-darkcard p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center opacity-80 hover:opacity-100 transition-opacity">
                                  <div>
                                      <h4 className="font-bold">{c.title}</h4>
                                      <span className={`text-xs px-2 py-0.5 rounded ${c.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.status}</span>
                                      <span className="text-xs text-gray-500 ml-2">{format(parseISO(c.startDate), 'MMM d')} - {c.duration} Days</span>
                                  </div>
                                  <div className="text-right">
                                      <p className="font-bold text-lg">{getProgress(c)}%</p>
                                      <p className="text-xs text-gray-500">Completion</p>
                                  </div>
                              </div>
                          ))}
                          {pastChallenges.length === 0 && <p className="text-gray-500 italic text-sm">No past challenges yet.</p>}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'new' && (
              <div className="max-w-xl mx-auto bg-white dark:bg-darkcard p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
                  <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                          <Target size={32} />
                      </div>
                      <h3 className="text-2xl font-bold">Design Your Quest</h3>
                      <p className="text-gray-500">Commit to a short-term goal to build momentum.</p>
                  </div>

                  <form onSubmit={handleCreate} className="space-y-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Quest Name</label>
                          <input 
                              required 
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary"
                              placeholder="e.g. No-Scroll Siege"
                              value={newTitle}
                              onChange={e => setNewTitle(e.target.value)}
                          />
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Duration</label>
                          <div className="grid grid-cols-4 gap-2">
                              {[3, 7, 21, 30].map(d => (
                                  <button
                                      key={d}
                                      type="button"
                                      onClick={() => { playSound('click'); setNewDuration(d as any); }}
                                      className={`py-3 rounded-xl font-bold transition-all ${newDuration === d ? 'bg-primary text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200'}`}
                                  >
                                      {d} Days
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tie to Existing Habit? (Optional)</label>
                          <select 
                              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary"
                              value={linkTaskId}
                              onChange={e => {
                                  setLinkTaskId(e.target.value);
                                  // Auto-fill title if empty
                                  if (!newTitle && e.target.value) {
                                      const t = tasks.find(task => task.id === e.target.value);
                                      if (t) setNewTitle(`${t.name} Challenge`);
                                  }
                              }}
                          >
                              <option value="">-- Standalone Challenge --</option>
                              {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                      </div>

                      <div className="pt-4">
                          <Button type="submit" className="w-full py-4 text-lg">
                              <Plus size={20} /> Launch Quest
                          </Button>
                      </div>
                  </form>
              </div>
          )}
      </div>
    </div>
  );
};

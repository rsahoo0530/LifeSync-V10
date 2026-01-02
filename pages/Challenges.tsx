
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Challenge } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Confetti } from '../components/ui/Confetti';
import { Flame, Trophy, Shield, Plus, Clock, Target, Calendar, Award, Star, AlertCircle, Filter, Zap, ArrowRight, BookOpen, Edit2, Trash2 } from 'lucide-react';
import { getRealDateString, getRealTime } from '../services/timeService';
import { differenceInCalendarDays, addDays, format, parseISO, isSameDay } from 'date-fns';

export const Challenges: React.FC = () => {
  const { challenges, addChallenge, updateChallenge, deleteChallenge, tasks, playSound, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'active' | 'records' | 'new'>('active');
  const [showConfetti, setShowConfetti] = useState(false);
  
  // New/Edit Challenge State
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDuration, setNewDuration] = useState<3 | 7 | 21 | 30>(7);
  const [linkTaskId, setLinkTaskId] = useState('');

  // Records Filters
  const [filterDuration, setFilterDuration] = useState<number | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Completed' | 'Failed' | 'Active'>('all');

  const todayStr = getRealDateString();
  const realNow = getRealTime();

  const activeChallenges = challenges.filter(c => c.status === 'Active');

  const handleCreate = (e: React.FormEvent) => {
      e.preventDefault();
      const titleToUse = newTitle.trim();
      
      if (!titleToUse) {
          showToast("Quest title is required.", "error");
          return;
      }

      const isDuplicate = activeChallenges.some(c => {
          const titleMatch = c.title.toLowerCase() === titleToUse.toLowerCase();
          const linkMatch = linkTaskId && c.linkedTaskId === linkTaskId;
          return titleMatch || linkMatch;
      });

      if (isDuplicate) {
          playSound('error');
          showToast('Quest already active! Finish it first.', 'error');
          return;
      }

      const challenge: Challenge = {
          id: crypto.randomUUID(),
          userId: 'current',
          title: titleToUse,
          description: newDescription,
          duration: newDuration,
          startDate: todayStr,
          linkedTaskId: linkTaskId || null,
          status: 'Active',
          progress: [],
          rescueUsed: false
      };
      addChallenge(challenge);
      setNewTitle('');
      setNewDescription('');
      setLinkTaskId('');
      setActiveTab('active');
  };

  const handleEdit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingChallenge) {
          updateChallenge(editingChallenge);
          setIsEditModalOpen(false);
          setEditingChallenge(null);
      }
  };

  const handleDelete = (id: string) => {
      if (confirm('Delete this challenge? Progress will be lost.')) {
          deleteChallenge(id);
      }
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
      playSound('sparkle'); 
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
      return Math.max(0, diff + 1);
  };

  const allChallengesHistory = useMemo(() => {
      return challenges.filter(c => {
          if (filterDuration !== 'all' && c.duration !== filterDuration) return false;
          if (filterStatus !== 'all' && c.status !== filterStatus) return false;
          return true;
      }).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [challenges, filterDuration, filterStatus]);

  const completedCount = challenges.filter(c => c.status === 'Completed').length;
  const badges = [
      { id: 1, name: 'First Steps', desc: 'Complete 1 Challenge', icon: Star, color: 'text-orange-400', unlocked: completedCount >= 1 },
      { id: 2, name: 'Consistency King', desc: 'Complete 3 Challenges', icon: Award, color: 'text-gray-400', unlocked: completedCount >= 3 },
      { id: 3, name: 'Unstoppable', desc: 'Complete 5 Challenges', icon: Trophy, color: 'text-yellow-500', unlocked: completedCount >= 5 },
  ];

  const handleChallengeify = () => {
      setActiveTab('new');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast('Create your new quest below.', 'info');
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";

  return (
    <div className="space-y-6 relative">
      <Confetti trigger={showConfetti} />
      
      <div>
          <h2 className="text-3xl font-bold">Challenge Mode</h2>
          <p className="text-gray-500">Push your limits with time-bound quests.</p>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button onClick={() => { playSound('click'); setActiveTab('active'); }} className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'active' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Active</button>
          <button onClick={() => { playSound('click'); setActiveTab('records'); }} className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'records' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Records</button>
          <button onClick={() => { playSound('click'); setActiveTab('new'); }} className={`px-6 py-3 font-bold text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'new' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>New Quest</button>
      </div>

      <div className="animate-fade-in pb-20">
          {activeTab === 'active' && (
              <div className="space-y-8">
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
                              <div key={c.id} className="bg-white dark:bg-darkcard rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-purple-600"></div>
                                  
                                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                      <div className="flex-1 w-full">
                                          <div className="flex items-center gap-3 mb-2">
                                              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                                                  <Flame size={20} className={doneToday ? "animate-pulse" : ""} />
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                  <h3 className="text-xl font-bold truncate">{c.title}</h3>
                                                  {c.description && <p className="text-xs text-gray-500 truncate max-w-xs">{c.description}</p>}
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <button onClick={() => { setEditingChallenge(c); setIsEditModalOpen(true); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-primary transition-colors"><Edit2 size={16}/></button>
                                                  <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                              </div>
                                              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500 whitespace-nowrap ml-2">
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

                                      <div className="flex flex-col items-center gap-3 w-full md:w-auto">
                                          {!doneToday ? (
                                              <Button onClick={() => markToday(c)} className="shadow-xl shadow-primary/30 w-full md:w-auto">
                                                  <Zap size={18} className="fill-current mr-2" /> Mark Today
                                              </Button>
                                          ) : (
                                              <div className="flex items-center gap-2 text-green-500 font-bold bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl w-full md:w-auto justify-center">
                                                  <Trophy size={18} /> Done!
                                              </div>
                                          )}
                                          {!c.rescueUsed && !doneToday && (
                                              <button onClick={() => useRescue(c)} className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors">
                                                  <Shield size={12} /> Rescue (1 left)
                                              </button>
                                          )}
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {activeTab === 'records' && (
              <div className="space-y-8">
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-wrap justify-around gap-4 text-center">
                      <div><p className="text-slate-400 text-xs uppercase tracking-wider font-bold">Challenges Crushed</p><p className="text-3xl font-bold">{completedCount}</p></div>
                      <div><p className="text-slate-400 text-xs uppercase tracking-wider font-bold">Total Days</p><p className="text-3xl font-bold">{challenges.reduce((acc, c) => acc + c.progress.length, 0)}</p></div>
                      <div><p className="text-slate-400 text-xs uppercase tracking-wider font-bold">Current Active</p><p className="text-3xl font-bold text-green-400">{activeChallenges.length}</p></div>
                  </div>
                  <div className="space-y-3">
                      {allChallengesHistory.map(c => (
                          <div key={c.id} className="bg-white dark:bg-darkcard p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group">
                              <div>
                                  <h4 className="font-bold">{c.title}</h4>
                                  <div className="flex gap-2 mt-1">
                                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${c.status === 'Completed' ? 'bg-green-100 text-green-700' : c.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{c.status}</span>
                                      <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={10} /> {format(parseISO(c.startDate), 'MMM d, yyyy')}</span>
                                  </div>
                              </div>
                              <div className="flex items-center gap-3">
                                  <button onClick={() => { setEditingChallenge(c); setIsEditModalOpen(true); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-primary transition-colors"><Edit2 size={16}/></button>
                                  <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeTab === 'new' && (
              <div className="max-w-xl mx-auto bg-white dark:bg-darkcard p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700">
                  <form onSubmit={handleCreate} className="space-y-6">
                      <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Quest Name</label><input required className={inputClass} placeholder="e.g. No-Scroll Siege" value={newTitle} onChange={e => setNewTitle(e.target.value)} /></div>
                      <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label><textarea rows={2} className={inputClass} placeholder="Goal..." value={newDescription} onChange={e => setNewDescription(e.target.value)} /></div>
                      <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Duration</label><div className="grid grid-cols-4 gap-2">{[3, 7, 21, 30].map(d => (<button key={d} type="button" onClick={() => setNewDuration(d as any)} className={`py-3 rounded-xl font-bold transition-all ${newDuration === d ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{d} Days</button>))}</div></div>
                      <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Link to Habit (Optional)</label><select className={inputClass} value={linkTaskId} onChange={e => { setLinkTaskId(e.target.value); if (!newTitle && e.target.value) { const t = tasks.find(task => task.id === e.target.value); if (t) setNewTitle(`${t.name} Challenge`); } }}><option value="">-- Choose a Task --</option>{tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                      <Button type="submit" className="w-full py-4 text-lg"><Plus size={20} className="mr-2" /> Launch Quest</Button>
                  </form>
              </div>
          )}
      </div>

      {/* Edit Challenge Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Quest">
          {editingChallenge && (
              <form onSubmit={handleEdit} className="space-y-5">
                  <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Quest Name</label><input required className={inputClass} value={editingChallenge.title} onChange={e => setEditingChallenge({...editingChallenge, title: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description</label><textarea rows={2} className={inputClass} value={editingChallenge.description || ''} onChange={e => setEditingChallenge({...editingChallenge, description: e.target.value})} /></div>
                  <div className="flex justify-end gap-3 pt-4"><Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button><Button type="submit">Save Changes</Button></div>
              </form>
          )}
      </Modal>
    </div>
  );
};

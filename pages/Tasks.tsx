import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Task, Category, TaskType, Proof } from '../types';
import { CATEGORIES } from '../constants';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { MarkTaskModal } from '../components/modals/MarkTaskModal';
import { Confetti } from '../components/ui/Confetti';
import { Plus, Check, Target, Repeat, Clock, Filter, Calendar, AlertTriangle, Zap, BarChart2, Info, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { format, parseISO, subDays, differenceInCalendarDays, isSameDay } from 'date-fns';
import { getRealDateString, getRealTime } from '../services/timeService';
import { BarChart, Bar, ResponsiveContainer, Cell, XAxis } from 'recharts';

export const Tasks: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask, markTask, playSound, showToast } = useApp();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedTaskForMark, setSelectedTaskForMark] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Filter States
  const [filterType, setFilterType] = useState<'All' | TaskType>('All');
  const [filterCategory, setFilterCategory] = useState<'All' | Category>('All');

  // Form States
  const [newTask, setNewTask] = useState<Partial<Task>>({ 
      type: 'Habit', 
      category: 'Personal',
      startDate: getRealTime().toISOString() 
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.name) return;
    
    const realNow = getRealTime();
    const task: Task = {
        id: crypto.randomUUID(),
        userId: 'current',
        name: newTask.name!,
        type: newTask.type as TaskType || 'Habit',
        why: newTask.why || '',
        penalty: newTask.penalty || '',
        startDate: newTask.startDate || realNow.toISOString(),
        endDate: newTask.endDate || new Date(realNow.getFullYear() + 1, realNow.getMonth(), realNow.getDate()).toISOString(),
        category: newTask.category as Category || 'Personal',
        createdAt: realNow.toISOString(),
        streaks: 0,
        maxStreaks: 0,
        completedDates: []
    };
    addTask(task);
    setCreateModalOpen(false);
    setNewTask({ type: 'Habit', category: 'Personal', startDate: getRealTime().toISOString() });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
        updateTask(editingTask);
        setEditModalOpen(false);
        setEditingTask(null);
    }
  };

  const handleDelete = (id: string) => {
      if (confirm('Are you sure you want to delete this task? All streaks and history will be lost.')) {
          deleteTask(id);
      }
  };

  const handleMarkConfirm = (taskId: string, proof: Proof) => {
      markTask(taskId, proof);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      setSelectedTaskForMark(null);
  };

  const canMarkToday = (task: Task) => {
      const today = getRealDateString();
      return !task.completedDates.includes(today);
  };

  const filteredTasks = useMemo(() => {
      return tasks.filter(task => {
          const typeMatch = filterType === 'All' || task.type === filterType;
          const catMatch = filterCategory === 'All' || task.category === filterCategory;
          return typeMatch && catMatch;
      });
  }, [tasks, filterType, filterCategory]);

  const getChartData = (task: Task) => {
      const today = getRealTime();
      return Array.from({length: 7}, (_, i) => {
          const d = subDays(today, 6 - i);
          const dStr = format(d, 'yyyy-MM-dd');
          const isDone = task.completedDates.includes(dStr);
          return {
              day: format(d, 'EEE'),
              value: isDone ? 1 : 0
          };
      });
  };

  const getMissedDates = (task: Task) => {
      const missed = [];
      const start = new Date(task.startDate);
      const realNow = getRealTime();
      
      for(let i=1; i<=7; i++) {
          const d = subDays(realNow, i);
          if (d >= start) {
             const dStr = format(d, 'yyyy-MM-dd');
             if (!task.completedDates.includes(dStr)) {
                 missed.push(d);
             }
          }
      }
      return missed;
  };

  const calculateProgress = (task: Task) => {
      const start = parseISO(task.startDate);
      const end = parseISO(task.endDate);
      const today = getRealTime();
      
      const totalDuration = differenceInCalendarDays(end, start) + 1; 
      const daysPassed = differenceInCalendarDays(today, start) + 1;
      const isOngoing = totalDuration > 365;
      const completedCount = task.completedDates.length;
      
      let percentage = 0;
      let label = "";

      if (isOngoing) {
          percentage = Math.min(100, (completedCount / Math.max(1, daysPassed)) * 100);
          label = "Consistency";
      } else {
          percentage = Math.min(100, Math.max(0, (completedCount / totalDuration) * 100));
          label = "Completion";
      }

      return { percentage, completedCount, totalDuration, isOngoing, label };
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="space-y-6 relative">
      <Confetti trigger={showConfetti} />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-bold">My Habits</h2>
           <p className="text-gray-500">Build consistency, one day at a time.</p>
        </div>
        <Button onClick={() => { playSound('click'); setCreateModalOpen(true); }} className="shadow-xl shadow-primary/20 w-full md:w-auto">
            <Plus size={20} /> Add Task
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 bg-white dark:bg-darkcard p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 text-gray-500 text-sm font-bold mr-2">
              <Filter size={16} /> Filters:
          </div>
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value as any)}
            className="bg-gray-50 dark:bg-black/20 border-none rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
          >
              <option value="All">All Types</option>
              <option value="Habit">Habit</option>
              <option value="Goal">Goal</option>
          </select>

          <select 
            value={filterCategory} 
            onChange={e => setFilterCategory(e.target.value as any)}
            className="bg-gray-50 dark:bg-black/20 border-none rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
          >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {(filterType !== 'All' || filterCategory !== 'All') && (
              <button onClick={() => { setFilterType('All'); setFilterCategory('All'); }} className="text-sm text-red-500 hover:underline">Clear</button>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTasks.map(task => {
            const chartData = getChartData(task);
            const { percentage, completedCount, totalDuration, isOngoing, label } = calculateProgress(task);
            
            return (
                <div 
                    key={task.id} 
                    onClick={() => setViewingTask(task)}
                    className="bg-white dark:bg-darkcard rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between hover:shadow-lg transition-all group relative overflow-hidden cursor-pointer"
                >
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${task.type === 'Goal' ? 'bg-purple-500' : 'bg-primary'}`}></div>
                    
                    <div className="pl-2">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${task.type === 'Goal' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'}`}>
                                {task.type === 'Goal' ? <Target size={12}/> : <Repeat size={12}/>}
                                {task.category}
                            </span>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingTask(task); setEditModalOpen(true); }}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 hover:text-primary transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        
                        <h3 className="font-bold text-xl mb-1 text-gray-900 dark:text-white">{task.name}</h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-1 italic">"{task.why}"</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-orange-500"/>
                                <span className="font-semibold">{task.streaks} Day Streak</span>
                            </div>
                        </div>

                        <div className="mb-6 group/progress relative">
                            <div className="flex justify-between text-xs text-gray-500 mb-1 font-medium">
                                <span>{isOngoing ? 'Overall Consistency' : 'Timeline Progress'}</span>
                                <span>{percentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-700 ease-out ${task.type === 'Goal' ? 'bg-purple-500' : 'bg-primary'}`} 
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="mb-4 h-16 w-full">
                            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-bold">Last 7 Days</p>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.value ? (task.type === 'Goal' ? '#a855f7' : '#6366f1') : '#e2e8f0'} />
                                        ))}
                                    </Bar>
                                    <XAxis dataKey="day" hide />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="mt-auto" onClick={(e) => e.stopPropagation()}>
                            {canMarkToday(task) ? (
                                <Button onClick={() => setSelectedTaskForMark(task)} className="w-full justify-center py-3 text-base">
                                    Mark Complete
                                </Button>
                            ) : (
                                <Button disabled variant="secondary" className="w-full justify-center py-3 bg-green-500/10 text-green-600 border-green-500/20">
                                    <Check size={20} /> Completed Today
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}
        
        {filteredTasks.length === 0 && (
            <div className="col-span-full py-20 text-center rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-800/20">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Plus size={32} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No habits found</h3>
                <p className="text-gray-500">Try adjusting your filters or create a new task.</p>
            </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Task">
        {editingTask && (
            <form onSubmit={handleEdit} className="space-y-5">
                <div>
                    <label className={labelClass}>Task Name *</label>
                    <input required className={inputClass} value={editingTask.name} onChange={e => setEditingTask({...editingTask, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Type</label>
                        <select className={inputClass} value={editingTask.type} onChange={e => setEditingTask({...editingTask, type: e.target.value as TaskType})}>
                            <option value="Habit">Habit</option>
                            <option value="Goal">Goal</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Category</label>
                        <select className={inputClass} value={editingTask.category} onChange={e => setEditingTask({...editingTask, category: e.target.value as Category})}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className={labelClass}>Motivation (Why)</label>
                    <textarea required className={inputClass} rows={2} value={editingTask.why} onChange={e => setEditingTask({...editingTask, why: e.target.value})} />
                </div>
                <div>
                    <label className={labelClass}>Penalty</label>
                    <input className={inputClass} value={editingTask.penalty} onChange={e => setEditingTask({...editingTask, penalty: e.target.value})} />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Changes</Button>
                </div>
            </form>
        )}
      </Modal>

      {/* Detail View Modal - FIXED WITH MISSING LOGIC */}
      <Modal isOpen={!!viewingTask} onClose={() => setViewingTask(null)} title="Task Details">
          {viewingTask && (
              <div className="space-y-6">
                  <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{viewingTask.name}</h2>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${viewingTask.type === 'Goal' ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'}`}>
                          {viewingTask.type} • {viewingTask.category}
                      </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
                          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                              <Zap size={18} />
                              <span className="font-bold">Current Streak</span>
                          </div>
                          <p className="text-2xl font-bold">{viewingTask.streaks} <span className="text-sm font-normal text-gray-500">Days</span></p>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                              <Target size={18} />
                              <span className="font-bold">Max Streak</span>
                          </div>
                          <p className="text-2xl font-bold">{viewingTask.maxStreaks} <span className="text-sm font-normal text-gray-500">Days</span></p>
                      </div>
                  </div>

                  <div className="space-y-4 bg-gray-50 dark:bg-slate-800/50 p-5 rounded-xl">
                      <div>
                          <h4 className="text-sm font-bold text-gray-500 uppercase mb-1">Motivation (Why)</h4>
                          <p className="text-gray-900 dark:text-white italic">"{viewingTask.why}"</p>
                      </div>
                      {viewingTask.penalty && (
                          <div>
                              <h4 className="text-sm font-bold text-red-500 uppercase mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Penalty</h4>
                              <p className="text-red-600 dark:text-red-400 font-medium">{viewingTask.penalty}</p>
                          </div>
                      )}
                      {/* ✅ ADDED: Start/End Date Display */}
                      <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                              <h4 className="text-xs text-gray-400 uppercase">Start Date</h4>
                              <p className="font-mono text-sm">
                                  {format(parseISO(viewingTask.startDate), "MMM d, yyyy")}
                              </p>
                          </div>
                          <div>
                              <h4 className="text-xs text-gray-400 uppercase">End Date</h4>
                              <p className="font-mono text-sm">
                                  {format(parseISO(viewingTask.endDate), "MMM d, yyyy")}
                              </p>
                          </div>
                      </div>
                  </div>

                  {/* ✅ ADDED: Recent Activity */}
                  <div>
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                          <Calendar size={18} /> Recent Activity
                      </h4>
                      <div className="flex flex-wrap gap-2">
                          {viewingTask.completedDates
                              .slice(-7)
                              .reverse()
                              .map((date) => (
                                  <div
                                      key={date}
                                      className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs font-mono border border-green-200 dark:border-green-800"
                                  >
                                      {format(parseISO(date), "MMM d")}
                                  </div>
                              ))}
                          {viewingTask.completedDates.length === 0 && (
                              <span className="text-gray-400 text-sm">No completions yet.</span>
                          )}
                      </div>
                  </div>

                  {/* ✅ ADDED: Missed Dates */}
                  {getMissedDates(viewingTask).length > 0 && (
                      <div>
                          <h4 className="font-bold mb-3 flex items-center gap-2 text-red-500">
                              <AlertTriangle size={18} /> Missed (Last 7 Days)
                          </h4>
                          <div className="flex flex-wrap gap-2">
                              {getMissedDates(viewingTask).map((date) => (
                                  <div
                                      key={date.toISOString()}
                                      className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-mono border border-red-100 dark:border-red-900/30"
                                  >
                                      {format(date, "MMM d")}
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  <div className="pt-4 border-t dark:border-gray-700 flex justify-end">
                      <Button variant="secondary" onClick={() => setViewingTask(null)}>
                          Close
                      </Button>
                  </div>
              </div>
          )}
      </Modal>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} title="Create New Task">
        <form onSubmit={handleCreate} className="space-y-5">
            <div>
                <label className={labelClass}>Task Name *</label>
                <input required className={inputClass} value={newTask.name || ''} onChange={e => setNewTask({...newTask, name: e.target.value})} placeholder="e.g., Read 10 pages" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Type *</label>
                    <select required className={inputClass} value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value as TaskType})}>
                        <option value="Habit">Habit</option>
                        <option value="Goal">Goal</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Category *</label>
                    <select required className={inputClass} value={newTask.category} onChange={e => setNewTask({...newTask, category: e.target.value as Category})}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className={labelClass}>Why do you want this? *</label>
                <textarea required className={inputClass} rows={2} value={newTask.why || ''} onChange={e => setNewTask({...newTask, why: e.target.value})} placeholder="Motivation..." />
            </div>
            <div>
                <label className={labelClass}>Penalty (Optional)</label>
                <input className={inputClass} value={newTask.penalty || ''} onChange={e => setNewTask({...newTask, penalty: e.target.value})} placeholder="e.g., No social media for 2 hrs" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Start Date *</label>
                    <input type="date" required className={inputClass} value={newTask.startDate?.split('T')[0] || ''} onChange={e => setNewTask({...newTask, startDate: new Date(e.target.value).toISOString()})} />
                </div>
                <div>
                    <label className={labelClass}>End Date</label>
                    <input type="date" className={inputClass} value={newTask.endDate?.split('T')[0] || ''} onChange={e => setNewTask({...newTask, endDate: new Date(e.target.value).toISOString()})} />
                </div>
            </div>
            <Button type="submit" className="w-full py-3">Create Task</Button>
        </form>
      </Modal>

      <MarkTaskModal 
        isOpen={!!selectedTaskForMark}
        onClose={() => setSelectedTaskForMark(null)}
        task={selectedTaskForMark}
        onConfirm={handleMarkConfirm}
        playSound={playSound}
      />
    </div>
  );
};

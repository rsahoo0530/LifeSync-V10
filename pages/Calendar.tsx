
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isFuture, addMonths, subMonths, isWithinInterval, parseISO, differenceInCalendarDays, isPast } from 'date-fns';
import { ChevronLeft, ChevronRight, Lock, Check, XCircle, Gift, Info, Calendar as CalIcon } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { MarkTaskModal } from '../components/modals/MarkTaskModal';
import { Proof, Task } from '../types';
import { Button } from '../components/ui/Button';
import { getRealTime, getRealDateString } from '../services/timeService';

// Mock Holiday Data
const HOLIDAYS: Record<string, string> = {
    "01-01": "New Year's Day",
    "01-26": "Republic Day (India)",
    "02-14": "Valentine's Day",
    "03-08": "International Women's Day",
    "04-07": "World Health Day",
    "04-22": "Earth Day",
    "05-01": "International Workers' Day",
    "06-05": "World Environment Day",
    "06-21": "International Yoga Day",
    "08-15": "Independence Day (India)",
    "10-02": "Gandhi Jayanti",
    "10-31": "Halloween",
    "11-14": "Children's Day",
    "12-25": "Christmas Day"
};

export const Calendar: React.FC = () => {
  const { tasks, markTask, playSound } = useApp();
  // Initialize with Real Time
  const [currentDate, setCurrentDate] = useState(getRealTime());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedTaskForMark, setSelectedTaskForMark] = useState<Task | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => { playSound('click'); setCurrentDate(addMonths(currentDate, 1)); };
  const prevMonth = () => { playSound('click'); setCurrentDate(subMonths(currentDate, 1)); };

  // Helper: Get tasks active on date
  const getTasksForDay = (date: Date) => {
      const dayStr = format(date, 'yyyy-MM-dd');
      return tasks.filter(t => {
          const start = parseISO(t.startDate);
          const end = parseISO(t.endDate);
          return isWithinInterval(date, { start, end });
      }).map(t => ({
          ...t,
          isCompleted: t.completedDates.includes(dayStr)
      }));
  };

  const getDayStatus = (day: Date) => {
    const tasksOnDay = getTasksForDay(day);
    if (tasksOnDay.length === 0) return 'empty';

    const completedCount = tasksOnDay.filter(t => t.isCompleted).length;
    
    // Check future against REAL TIME
    const realNow = getRealTime();
    if (isFuture(day) && !isSameDay(day, realNow)) return 'future';

    if (completedCount === tasksOnDay.length) return 'all';
    if (completedCount > 0) return 'some';
    return 'none';
  };

  const handleDayClick = (day: Date) => {
      playSound('click');
      setSelectedDay(day);
  };

  const openMarkModal = (task: Task) => {
      if (!selectedDay) return;
      setSelectedTaskForMark(task);
  };

  const handleMarkConfirm = (taskId: string, proof: Proof) => {
      // We need to override the proof date to match the SELECTED calendar day, not just today
      // Although the requirement "user can mark pending task... past three days" implies we mark FOR that day.
      // Proof.date is usually "when it was done", but in this context it maps to the habit slot.
      if (selectedDay) {
          proof.date = format(selectedDay, 'yyyy-MM-dd'); 
      }
      markTask(taskId, proof);
      setSelectedTaskForMark(null);
  };

  const getHolidaysInMonth = () => {
      const monthStr = format(currentDate, 'MM');
      return Object.entries(HOLIDAYS).filter(([key]) => key.startsWith(monthStr));
  };

  const getHolidayForDay = (date: Date) => {
      return HOLIDAYS[format(date, 'MM-dd')];
  };

  const isTaskLocked = (day: Date) => {
      const realNow = getRealTime();
      // Lock future dates (exclusive of today)
      if (isFuture(day) && !isSameDay(day, realNow)) return true;
      
      // Lock past dates older than 3 days
      const diff = differenceInCalendarDays(realNow, day);
      if (diff > 3) return true;
      
      return false;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{format(currentDate, 'MMMM yyyy')}</h2>
            <p className="text-gray-500">Overview of your consistency</p>
        </div>
        <div className="flex gap-2 bg-white dark:bg-darkcard p-1 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"><ChevronLeft size={20}/></button>
            <div className="w-px bg-gray-200 dark:bg-gray-700 h-full mx-1"></div>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"><ChevronRight size={20}/></button>
        </div>
      </div>

      <div className="bg-white dark:bg-darkcard rounded-3xl p-6 md:p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-7 mb-6">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-y-6 gap-x-2">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => <div key={`empty-${i}`} />)}

            {days.map(day => {
                const status = getDayStatus(day);
                const isToday = isSameDay(day, getRealTime());
                const isFutureDate = isFuture(day) && !isToday;
                const holiday = getHolidayForDay(day);
                const isSelected = selectedDay && isSameDay(day, selectedDay);

                return (
                    <div key={day.toISOString()} className="flex flex-col items-center">
                        <button 
                            onClick={() => handleDayClick(day)}
                            className={`
                                w-10 h-10 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-sm font-medium transition-all relative group
                                ${isToday ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110 z-10' : ''}
                                ${isSelected && !isToday ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500' : ''}
                                ${!isToday && !isSelected ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200' : ''}
                                ${isFutureDate ? 'opacity-50' : 'cursor-pointer'}
                                ${holiday && !isToday ? 'border-2 border-pink-200 dark:border-pink-900 text-pink-500' : ''}
                            `}
                        >
                            {format(day, 'd')}
                            {isFutureDate && <Lock size={10} className="absolute top-1 right-1 opacity-50" />}
                            
                            {/* Status Dot */}
                            {!isFutureDate && status !== 'empty' && !isToday && status !== 'future' && (
                                <div className={`absolute -bottom-1 w-1.5 h-1.5 rounded-full 
                                    ${status === 'all' ? 'bg-green-500' : status === 'some' ? 'bg-orange-400' : 'bg-red-400'}
                                `}></div>
                            )}
                        </button>
                    </div>
                );
            })}
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-500">
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> All Done</div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-400"></div> Some Done</div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400"></div> Missed</div>
          </div>
      </div>

      {/* Occasions Display Section */}
      <div className="space-y-4">
          {selectedDay && getHolidayForDay(selectedDay) && (
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 text-white p-4 rounded-2xl shadow-lg animate-fade-in flex items-center justify-center gap-3">
                  <Gift size={24} className="animate-bounce" />
                  <div className="text-center">
                      <p className="text-sm opacity-90 uppercase tracking-widest font-semibold">{format(selectedDay, 'MMMM do')}</p>
                      <p className="text-xl font-bold">{getHolidayForDay(selectedDay)}</p>
                  </div>
              </div>
          )}

          <div className="bg-pink-50 dark:bg-pink-900/10 rounded-2xl p-6 border border-pink-100 dark:border-pink-900/30">
              <h3 className="font-bold text-lg mb-4 text-pink-800 dark:text-pink-300 flex items-center gap-2">
                  <CalIcon size={20} /> Occasions this Month ({format(currentDate, 'MMMM')})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {getHolidaysInMonth().length > 0 ? (
                      getHolidaysInMonth().map(([dateStr, name]) => {
                          const day = dateStr.split('-')[1];
                          return (
                              <div key={dateStr} className="bg-white dark:bg-darkcard p-3 rounded-xl flex items-center gap-3 shadow-sm">
                                  <span className="font-bold text-xl text-pink-500 w-8 text-center">{day}</span>
                                  <span className="text-gray-700 dark:text-gray-300 font-medium">{name}</span>
                              </div>
                          );
                      })
                  ) : (
                      <p className="text-gray-500 italic">No major holidays listed for this month.</p>
                  )}
              </div>
          </div>
      </div>

      <Modal isOpen={!!selectedDay} onClose={() => setSelectedDay(null)} title={selectedDay ? format(selectedDay, 'EEEE, MMMM do, yyyy') : ''}>
         {selectedDay && (
             <div className="space-y-6">
                 {getTasksForDay(selectedDay).length === 0 ? (
                     <div className="text-center py-8 text-gray-500">
                         <p>No habits tracked on this day.</p>
                     </div>
                 ) : (
                     <div className="grid gap-3">
                         {getTasksForDay(selectedDay).map(t => {
                             const locked = isTaskLocked(selectedDay);
                             return (
                                 <div key={t.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700">
                                     <div>
                                         <p className="font-bold text-gray-900 dark:text-white">{t.name}</p>
                                         <span className="text-xs text-gray-500 bg-white dark:bg-black/20 px-2 py-0.5 rounded-full border dark:border-gray-600">{t.category}</span>
                                     </div>
                                     {t.isCompleted ? (
                                         <div className="flex items-center gap-2 text-green-600 font-medium bg-green-100 dark:bg-green-900/20 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800">
                                             <Check size={16} /> Completed
                                         </div>
                                     ) : (
                                         locked ? (
                                             <span className="flex items-center gap-1 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded border dark:border-gray-600">
                                                 <Lock size={12} /> Locked
                                             </span>
                                         ) : (
                                            <Button 
                                                size="sm" 
                                                onClick={() => openMarkModal(t)}
                                                className="px-3 py-1 text-xs"
                                            >
                                                Mark Done
                                            </Button>
                                         )
                                     )}
                                 </div>
                             );
                         })}
                     </div>
                 )}
                 {isTaskLocked(selectedDay) && !isFuture(selectedDay) && (
                     <div className="text-center text-xs text-red-400 flex items-center justify-center gap-1">
                         <Info size={12} />
                         <span>Past dates older than 3 days cannot be modified.</span>
                     </div>
                 )}
             </div>
         )}
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

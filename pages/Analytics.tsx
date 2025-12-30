import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Download, Filter, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { format, subDays, startOfMonth, parseISO } from 'date-fns';

type TimeRange = 'all' | '7days' | '30days' | 'month';

export const Analytics: React.FC = () => {
  const { tasks, expenses, journal, exportData } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>('all');

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lifesync_analytics_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  // Filter Helper
  const filterByDate = (dateStr: string) => {
      const date = parseISO(dateStr);
      const today = new Date();
      if (timeRange === '7days') return date >= subDays(today, 7);
      if (timeRange === '30days') return date >= subDays(today, 30);
      if (timeRange === 'month') return date >= startOfMonth(today);
      return true;
  };

  const filteredTasks = tasks.filter(t => filterByDate(t.createdAt)); // Note: Streaks are harder to filter by date without history log, using creation for context or current state
  const filteredExpenses = expenses.filter(e => filterByDate(e.date));
  const filteredJournal = journal.filter(j => filterByDate(j.date));

  // Chart 1: Habit Consistency (Using current streaks as snapshot)
  const streakData = tasks.map(t => ({ name: t.name, streak: t.streaks }));
  
  // Chart 2: Expenses by Category
  const expenseByCategory = filteredExpenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
  }, {} as Record<string, number>);
  const pieData = Object.keys(expenseByCategory).map(key => ({ name: key, value: expenseByCategory[key] }));

  // Chart 3: Mood Distribution
  const moodCounts = filteredJournal.reduce((acc, curr) => {
      acc[curr.mood] = (acc[curr.mood] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);
  const moodData = Object.keys(moodCounts).map(k => ({ name: k, value: moodCounts[k] }));

  // Chart 4: Completion by Category
  const catCompletion = useMemo(() => {
      const cats: Record<string, { total: number, done: number }> = {};
      tasks.forEach(t => {
          if (!cats[t.category]) cats[t.category] = { total: 0, done: 0 };
          
          // Filter completed dates
          const relevantCompletions = t.completedDates.filter(d => filterByDate(d));
          cats[t.category].done += relevantCompletions.length;
          
          // Estimate days active in range
          // Simplification: assume 1 opportunity per day in range
          let daysInRange = 1;
          if (timeRange === '7days') daysInRange = 7;
          else if (timeRange === '30days') daysInRange = 30;
          else if (timeRange === 'month') daysInRange = new Date().getDate();
          else daysInRange = Math.max(1, Math.ceil((new Date().getTime() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24)));
          
          cats[t.category].total += daysInRange; 
      });
      return Object.keys(cats).map(k => ({
          name: k,
          rate: Math.round((cats[k].done / Math.max(1, cats[k].total)) * 100) || 0
      }));
  }, [tasks, timeRange]);

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e'];

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-3xl font-bold">Analytics</h2>
                <p className="text-gray-500">Deep dive into your data.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
                <div className="bg-white dark:bg-darkcard border border-gray-200 dark:border-gray-700 rounded-lg flex items-center p-1">
                    <button onClick={() => setTimeRange('all')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${timeRange === 'all' ? 'bg-gray-100 dark:bg-gray-700 font-medium' : ''}`}>All Time</button>
                    <button onClick={() => setTimeRange('month')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${timeRange === 'month' ? 'bg-gray-100 dark:bg-gray-700 font-medium' : ''}`}>This Month</button>
                    <button onClick={() => setTimeRange('30days')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${timeRange === '30days' ? 'bg-gray-100 dark:bg-gray-700 font-medium' : ''}`}>30 Days</button>
                    <button onClick={() => setTimeRange('7days')} className={`px-3 py-1.5 text-sm rounded-md transition-colors ${timeRange === '7days' ? 'bg-gray-100 dark:bg-gray-700 font-medium' : ''}`}>7 Days</button>
                </div>
                <Button onClick={handleExport}>
                    <Download size={18} /> Export
                </Button>
            </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            {/* Chart 1 */}
            <div className="bg-white dark:bg-darkcard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-6">Expense Breakdown</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                    {pieData.length === 0 && <p className="text-center text-gray-400 -mt-36">No data for selected period</p>}
                </div>
            </div>

            {/* Chart 2 */}
            <div className="bg-white dark:bg-darkcard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-6">Current Streak Status</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={streakData} layout="vertical" margin={{ left: 0, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#94a3b8'}} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} />
                            <Bar dataKey="streak" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} name="Days" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Chart 3 */}
            <div className="bg-white dark:bg-darkcard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-6">Mood Distribution</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={moodData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                            <XAxis dataKey="name" tick={{fontSize: 20}} />
                            <YAxis hide />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} />
                            <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} name="Entries" />
                        </BarChart>
                    </ResponsiveContainer>
                    {moodData.length === 0 && <p className="text-center text-gray-400 -mt-36">No data for selected period</p>}
                </div>
            </div>

            {/* Chart 4 */}
            <div className="bg-white dark:bg-darkcard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold mb-6">Completion by Category</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={catCompletion}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                            <XAxis dataKey="name" tick={{fontSize: 12, fill: '#94a3b8'}} />
                            <YAxis unit="%" tick={{fontSize: 12, fill: '#94a3b8'}} />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff' }} />
                            <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} name="Completion Rate" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    </div>
  );
};
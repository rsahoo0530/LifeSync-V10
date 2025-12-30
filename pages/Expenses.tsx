
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Expense } from '../types';
import { EXPENSE_CATEGORIES } from '../constants';
import { Button } from '../components/ui/Button';
import { Trash2, DollarSign, Tag, FileText, Plus, Calendar } from 'lucide-react';
import { parseISO, isWithinInterval, format } from 'date-fns';

export const Expenses: React.FC = () => {
  const { expenses, addExpense, deleteExpense } = useApp();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [desc, setDesc] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!amount) return;

      const expense: Expense = {
          id: crypto.randomUUID(),
          userId: 'current',
          amount: parseFloat(amount),
          category,
          description: desc,
          date: new Date(expenseDate).toISOString()
      };
      addExpense(expense);
      setAmount('');
      setDesc('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
  };

  const filteredExpenses = expenses.filter(exp => {
      if (!startDate && !endDate) return true;
      const expDate = parseISO(exp.date);
      const start = startDate ? parseISO(startDate) : new Date(0);
      const end = endDate ? parseISO(endDate) : new Date();
      end.setHours(23, 59, 59);
      return isWithinInterval(expDate, { start, end });
  });

  const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h2 className="text-3xl font-bold">Expense Tracker</h2>
                <p className="text-gray-500">Manage your spending habits.</p>
            </div>
            
             {/* Date Filter */}
             <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-darkcard p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <span className="text-gray-400 px-2"><Calendar size={16}/></span>
                <input 
                    type="date" 
                    className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 dark:text-gray-200"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                />
                <span className="text-gray-400">-</span>
                <input 
                    type="date" 
                    className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 dark:text-gray-200"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                />
                 {(startDate || endDate) && (
                   <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-xs text-red-500 hover:underline px-2">Clear</button>
               )}
            </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
            {/* Input Section */}
            <div className="lg:col-span-1">
                <div className="bg-white dark:bg-darkcard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 sticky top-4">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Plus size={18} /></div>
                        New Entry
                    </h3>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className={labelClass}><DollarSign size={14} className="inline mr-1"/> Amount (₹)</label>
                            <input type="number" step="0.01" required className={inputClass} placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}><Tag size={14} className="inline mr-1"/> Category</label>
                            <select className={inputClass} value={category} onChange={e => setCategory(e.target.value)}>
                                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}><Calendar size={14} className="inline mr-1"/> Date</label>
                            <input type="date" required className={inputClass} value={expenseDate} onChange={e => setExpenseDate(e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}><FileText size={14} className="inline mr-1"/> Description</label>
                            <input className={inputClass} placeholder="What was it for?" value={desc} onChange={e => setDesc(e.target.value)} />
                        </div>
                        <Button type="submit" className="w-full py-3">Add Expense</Button>
                    </form>
                </div>
            </div>

            {/* List Section */}
            <div className="lg:col-span-2">
                <div className="bg-white dark:bg-darkcard rounded-2xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="text-left p-4 pl-6 font-semibold text-gray-500 dark:text-gray-400">Date</th>
                                    <th className="text-left p-4 font-semibold text-gray-500 dark:text-gray-400">Description</th>
                                    <th className="text-left p-4 font-semibold text-gray-500 dark:text-gray-400">Category</th>
                                    <th className="text-right p-4 font-semibold text-gray-500 dark:text-gray-400">Amount</th>
                                    <th className="w-16"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(exp => (
                                    <tr key={exp.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="p-4 pl-6 font-mono text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {format(parseISO(exp.date), 'MMM d, yyyy')}
                                        </td>
                                        <td className="p-4 font-medium text-gray-900 dark:text-white">{exp.description || 'Unspecified'}</td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium">
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                                            ₹{exp.amount.toFixed(2)}
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <button 
                                                onClick={() => deleteExpense(exp.id)} 
                                                className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredExpenses.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center p-12 text-gray-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <DollarSign size={32} className="opacity-20" />
                                                <p>No expenses found for this period.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

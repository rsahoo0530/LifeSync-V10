import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Todo } from '../types';
import { Trash2, Calendar as CalIcon, Check, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../components/ui/Button';

export const Todos: React.FC = () => {
  const { todos, addTodo, toggleTodo, deleteTodo, playSound } = useApp();
  const [newTodo, setNewTodo] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTodo) return;
      
      const todo: Todo = {
          id: crypto.randomUUID(),
          userId: 'current',
          text: newTodo,
          completed: false,
          dueDate: dueDate || new Date().toISOString(),
          createdAt: new Date().toISOString()
      };
      addTodo(todo);
      setNewTodo('');
      playSound('success');
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        <div>
            <h2 className="text-3xl font-bold">To-Do List</h2>
            <p className="text-gray-500">Stay organized and get things done.</p>
        </div>

        {/* Input Card */}
        <div className="bg-white dark:bg-darkcard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input 
                        className={inputClass} 
                        placeholder="What needs to be done?" 
                        value={newTodo} 
                        onChange={e => setNewTodo(e.target.value)} 
                    />
                </div>
                <div className="md:w-48">
                    <input 
                        type="date" 
                        className={inputClass} 
                        value={dueDate} 
                        onChange={e => setDueDate(e.target.value)} 
                    />
                </div>
                <Button type="submit" className="md:w-auto h-[50px]">
                    <Plus size={20} /> Add Task
                </Button>
            </form>
        </div>

        {/* Task Lists */}
        <div className="grid gap-4">
            {todos.sort((a,b) => Number(a.completed) - Number(b.completed)).map(todo => (
                <div 
                    key={todo.id} 
                    className={`
                        group flex items-center justify-between p-4 rounded-xl border transition-all duration-200
                        ${todo.completed 
                            ? 'bg-gray-50 dark:bg-darkcard/50 border-transparent opacity-60' 
                            : 'bg-white dark:bg-darkcard border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md'
                        }
                    `}
                >
                    <div className="flex items-center gap-4 flex-1">
                        <button 
                            onClick={() => toggleTodo(todo.id)}
                            className={`
                                w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors
                                ${todo.completed 
                                    ? 'bg-primary border-primary text-white' 
                                    : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                                }
                            `}
                        >
                            {todo.completed && <Check size={14} />}
                        </button>
                        
                        <div className="flex-1">
                            <p className={`font-medium text-lg ${todo.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                                {todo.text}
                            </p>
                            {todo.dueDate && (
                                <p className={`text-xs flex items-center gap-1 mt-1 ${todo.completed ? 'text-gray-400' : 'text-primary'}`}>
                                    <CalIcon size={12} /> {format(new Date(todo.dueDate), 'MMM d, yyyy')}
                                </p>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => deleteTodo(todo.id)} 
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            ))}
            
            {todos.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p>No tasks yet. Add one above!</p>
                </div>
            )}
        </div>
    </div>
  );
};
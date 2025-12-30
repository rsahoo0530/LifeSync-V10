import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { Modal } from '../components/ui/Modal';
import { Proof } from '../types';
import { Filter, Calendar } from 'lucide-react';

export const ProofWall: React.FC = () => {
  const { proofs, tasks } = useApp();
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);
  
  // Filter States
  const [filterTaskId, setFilterTaskId] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getTaskName = (id: string) => tasks.find(t => t.id === id)?.name || 'Unknown Task';

  const filteredProofs = useMemo(() => {
      return proofs.filter(p => {
          const matchTask = filterTaskId === 'all' || p.taskId === filterTaskId;
          
          let matchDate = true;
          if (startDate || endDate) {
              const proofDate = parseISO(p.date);
              const start = startDate ? parseISO(startDate) : new Date(0);
              const end = endDate ? parseISO(endDate) : new Date();
              end.setHours(23, 59, 59);
              matchDate = isWithinInterval(proofDate, { start, end });
          }

          return matchTask && matchDate;
      }).reverse(); // Newest first
  }, [proofs, filterTaskId, startDate, endDate]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
                <h2 className="text-3xl font-bold">Proof Wall</h2>
                <p className="text-gray-500">Visual history of your achievements.</p>
            </div>
            
            {/* Filter Bar */}
            <div className="flex flex-wrap gap-3 bg-white dark:bg-darkcard p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm items-center">
                <div className="flex items-center px-2 text-gray-400"><Filter size={16}/></div>
                <select 
                    className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 dark:text-gray-200"
                    value={filterTaskId}
                    onChange={e => setFilterTaskId(e.target.value)}
                >
                    <option value="all">All Tasks</option>
                    {tasks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <div className="w-px bg-gray-200 dark:bg-gray-700 h-6"></div>
                
                 {/* Date Range */}
                 <div className="flex items-center gap-2">
                    <span className="text-gray-400"><Calendar size={14}/></span>
                    <input 
                        type="date" 
                        className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 dark:text-gray-200 w-28"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                    />
                    <span className="text-gray-400">-</span>
                    <input 
                        type="date" 
                        className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 dark:text-gray-200 w-28"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                    />
                    {(startDate || endDate) && (
                        <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-xs text-red-500 hover:underline px-1">Clear</button>
                    )}
                 </div>
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProofs.map(proof => (
                <div 
                    key={proof.id} 
                    onClick={() => setSelectedProof(proof)}
                    className="bg-white dark:bg-darkcard rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:scale-105 hover:shadow-xl transition-all duration-300 group"
                >
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 relative">
                        {proof.imageUrl ? (
                            <img src={proof.imageUrl} alt="Proof" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-slate-800">
                                <span className="text-xs">No Image</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-white mb-1">
                                {format(new Date(proof.date), 'MMM d')}
                            </span>
                            <p className="text-white font-bold text-sm truncate leading-tight">{getTaskName(proof.taskId)}</p>
                        </div>
                    </div>
                    <div className="p-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 italic">"{proof.remark}"</p>
                    </div>
                </div>
            ))}
            {filteredProofs.length === 0 && (
                <div className="col-span-full py-20 text-center text-gray-400 bg-white dark:bg-darkcard rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    No proofs found for this selection.
                </div>
            )}
        </div>

        <Modal isOpen={!!selectedProof} onClose={() => setSelectedProof(null)} title="Proof Details">
            {selectedProof && (
                <div className="space-y-4">
                    <div className="rounded-xl overflow-hidden border dark:border-gray-700 bg-black">
                         {selectedProof.imageUrl ? (
                             <img src={selectedProof.imageUrl} className="w-full h-auto max-h-[60vh] object-contain" alt="Full Proof" />
                         ) : (
                             <div className="h-40 flex items-center justify-center text-gray-500">No Image Provided</div>
                         )}
                    </div>
                    <div>
                        <div className="flex justify-between items-start mb-2">
                             <h3 className="font-bold text-xl">{getTaskName(selectedProof.taskId)}</h3>
                             <span className="text-sm text-gray-500">{format(new Date(selectedProof.timestamp), 'PP p')}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl text-gray-700 dark:text-gray-300">
                            "{selectedProof.remark}"
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    </div>
  );
};
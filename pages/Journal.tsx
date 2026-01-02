
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { JournalEntry } from '../types';
import { MOODS } from '../constants';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Search, Trash2, Edit2, Image as ImageIcon, Send, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { uploadImage } from '../services/storageService';

export const Journal: React.FC = () => {
  const { journal, addJournal, updateJournal, deleteJournal, playSound } = useApp();
  const [viewingEntry, setViewingEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Filter States
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Creation State
  const [newSubject, setNewSubject] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newMood, setNewMood] = useState('😊');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]); 

  // Edit State
  const [editSubject, setEditSubject] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState('');

  const handleCreate = async () => {
      if (!newSubject || !newContent) return;
      setIsSubmitting(true);
      playSound('click');

      try {
          const imageUrls = await Promise.all(newImages.map(file => uploadImage(file)));
          const entry: JournalEntry = {
              id: crypto.randomUUID(),
              userId: 'current',
              subject: newSubject,
              content: newContent,
              date: new Date(entryDate).toISOString(),
              mood: newMood,
              images: imageUrls,
              createdAt: new Date().toISOString()
          };
          addJournal(entry);
          setNewSubject('');
          setNewContent('');
          setNewImages([]);
          setNewMood('😊');
          setEntryDate(new Date().toISOString().split('T')[0]);
      } catch (e) {
          console.error(e);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
          setNewImages(prev => [...prev, ...Array.from(e.target.files!)]);
      }
  };

  const startEditing = (entry: JournalEntry) => {
      setEditSubject(entry.subject);
      setEditContent(entry.content);
      setEditMood(entry.mood);
      setIsEditing(true);
  };

  const saveEdit = () => {
      if (!viewingEntry) return;
      updateJournal({
          ...viewingEntry,
          subject: editSubject,
          content: editContent,
          mood: editMood
      });
      setViewingEntry(null);
      setIsEditing(false);
  };

  const handleSearchClick = () => {
      setActiveSearchTerm(searchInput);
      playSound('click');
  };

  const filteredJournal = useMemo(() => {
      return journal.filter(j => {
          const matchesSearch = activeSearchTerm === '' || 
              j.subject.toLowerCase().includes(activeSearchTerm.toLowerCase()) || 
              j.content.toLowerCase().includes(activeSearchTerm.toLowerCase());
          
          let matchesDate = true;
          if (startDate || endDate) {
              const entryDate = parseISO(j.date);
              const start = startDate ? parseISO(startDate) : new Date(0);
              const end = endDate ? parseISO(endDate) : new Date();
              end.setHours(23, 59, 59);
              matchesDate = isWithinInterval(entryDate, { start, end });
          }
          
          return matchesSearch && matchesDate;
      });
  }, [journal, activeSearchTerm, startDate, endDate]);

  const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";

  return (
    <div className="space-y-8">
       <div>
           <h2 className="text-3xl font-bold">Journal</h2>
           <p className="text-gray-500">Capture your thoughts and memories.</p>
       </div>

       <div className="bg-white dark:bg-darkcard rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all focus-within:ring-2 focus-within:ring-primary/20">
            <div className="flex justify-between items-center mb-4">
               <input 
                 className="w-full bg-transparent text-xl font-bold placeholder-gray-400 border-none focus:ring-0 p-0 text-gray-900 dark:text-white outline-none"
                 placeholder="Title of your entry..."
                 value={newSubject}
                 onChange={e => setNewSubject(e.target.value)}
               />
               <input 
                  type="date" 
                  className="bg-transparent border-none text-xs text-gray-400 focus:ring-0 outline-none text-right"
                  value={entryDate}
                  onChange={e => setEntryDate(e.target.value)}
               />
           </div>
           <div className="mb-4">
               <textarea 
                 className="w-full bg-transparent resize-none border-none focus:ring-0 p-0 text-gray-600 dark:text-gray-300 min-h-[120px] outline-none"
                 placeholder="What's on your mind today?"
                 value={newContent}
                 onChange={e => setNewContent(e.target.value)}
               />
           </div>
           {newImages.length > 0 && (
               <div className="flex gap-2 mb-4 overflow-x-auto py-2">
                   {newImages.map((img, i) => (
                       <div key={i} className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border dark:border-gray-700">
                           <img src={URL.createObjectURL(img)} className="w-full h-full object-cover" />
                           <button onClick={() => setNewImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"><Trash2 size={12}/></button>
                       </div>
                   ))}
               </div>
           )}
           <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
               <div className="flex items-center gap-4">
                   <div className="flex gap-1">
                       {MOODS.slice(0, 5).map(m => (
                           <button key={m} onClick={() => setNewMood(m)} className={`text-xl p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${newMood === m ? 'bg-primary/20' : ''}`}>{m}</button>
                       ))}
                   </div>
                   <label className="p-2 text-gray-400 hover:text-primary cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                       <ImageIcon size={20} />
                       <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageSelect} />
                   </label>
               </div>
               <Button onClick={handleCreate} isLoading={isSubmitting} disabled={!newSubject || !newContent}>
                   Save Entry <Send size={16} />
               </Button>
           </div>
       </div>

       <div className="bg-white dark:bg-darkcard p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 w-full flex items-center gap-2">
               <div className="relative flex-1">
                   <input 
                     className={inputClass + " pl-4 py-2"} 
                     placeholder="Type to search..." 
                     value={searchInput}
                     onChange={e => setSearchInput(e.target.value)}
                     onKeyDown={e => e.key === 'Enter' && handleSearchClick()}
                   />
               </div>
               <Button onClick={handleSearchClick} className="px-4 py-2">
                   <Search size={18} />
               </Button>
           </div>
           
           <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
               <span className="text-sm font-medium text-gray-500 whitespace-nowrap"><CalendarIcon size={14} className="inline mr-1"/> Date Range:</span>
               <input 
                 type="date" 
                 className="bg-gray-50 dark:bg-black/20 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" 
                 value={startDate} 
                 onChange={e => setStartDate(e.target.value)} 
               />
               <span className="text-gray-400">-</span>
               <input 
                 type="date" 
                 className="bg-gray-50 dark:bg-black/20 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none" 
                 value={endDate} 
                 onChange={e => setEndDate(e.target.value)} 
               />
               {(startDate || endDate || activeSearchTerm) && (
                   <button onClick={() => { setStartDate(''); setEndDate(''); setActiveSearchTerm(''); setSearchInput(''); }} className="text-xs text-red-500 hover:underline whitespace-nowrap px-2">Clear</button>
               )}
           </div>
       </div>

       <div className="grid gap-4">
           {filteredJournal.map(entry => (
               <div key={entry.id} onClick={() => { setViewingEntry(entry); setIsEditing(false); }} className="bg-white dark:bg-darkcard p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group">
                   <div className="flex justify-between items-start mb-3">
                       <div className="flex items-center gap-3">
                           <span className="text-2xl bg-gray-50 dark:bg-gray-800 w-10 h-10 flex items-center justify-center rounded-full">{entry.mood}</span>
                           <div>
                               <h3 className="font-bold text-gray-900 dark:text-white">{entry.subject}</h3>
                               <span className="text-xs text-gray-400">{format(new Date(entry.date), 'MMMM do, yyyy • h:mm a')}</span>
                           </div>
                       </div>
                   </div>
                   <p className="text-gray-600 dark:text-gray-300 line-clamp-2 pl-14">{entry.content}</p>
                   {entry.images && entry.images.length > 0 && (
                       <div className="pl-14 mt-3 flex gap-2">
                           <div className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500 flex items-center gap-1">
                               <ImageIcon size={12}/> {entry.images.length} Image{entry.images.length > 1 ? 's' : ''}
                           </div>
                       </div>
                   )}
               </div>
           ))}
       </div>

       <Modal isOpen={!!viewingEntry} onClose={() => setViewingEntry(null)} title={isEditing ? "Edit Entry" : "Journal Entry"}>
            {viewingEntry && (
                <div className="space-y-6">
                    {isEditing ? (
                        <>
                            <input 
                                className="text-2xl font-bold bg-transparent border-b border-gray-200 dark:border-gray-700 w-full pb-2 outline-none text-gray-900 dark:text-white"
                                value={editSubject}
                                onChange={e => setEditSubject(e.target.value)}
                            />
                            <div className="flex gap-2">
                                {MOODS.slice(0, 5).map(m => (
                                    <button key={m} onClick={() => setEditMood(m)} className={`text-xl p-2 rounded-lg ${editMood === m ? 'bg-primary/20' : 'bg-gray-100 dark:bg-gray-800'}`}>{m}</button>
                                ))}
                            </div>
                            <textarea 
                                className="w-full h-64 bg-gray-50 dark:bg-slate-800 p-4 rounded-xl resize-none outline-none text-gray-700 dark:text-gray-300"
                                value={editContent}
                                onChange={e => setEditContent(e.target.value)}
                            />
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl">{viewingEntry.mood}</span>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{viewingEntry.subject}</h3>
                                    <p className="text-gray-500 text-sm">{format(new Date(viewingEntry.date), 'PPPP')}</p>
                                </div>
                            </div>
                            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                {viewingEntry.content}
                            </div>
                        </>
                    )}

                    {!isEditing && viewingEntry.images && (
                        <div className="grid grid-cols-2 gap-4">
                            {viewingEntry.images.map((img, idx) => (
                                <img key={idx} src={img} className="rounded-xl w-full object-cover h-48 border dark:border-gray-700" alt="Journal attachment" />
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-6 border-t dark:border-gray-700">
                        {isEditing ? (
                            <>
                                <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                                <Button onClick={saveEdit}>Save Changes</Button>
                            </>
                        ) : (
                            <>
                                <Button variant="secondary" onClick={() => startEditing(viewingEntry)}>
                                    <Edit2 size={16} /> Edit
                                </Button>
                                <Button variant="danger" onClick={() => { 
                                    if(confirm('Delete this entry?')) { 
                                        deleteJournal(viewingEntry.id); 
                                        setViewingEntry(null); 
                                    } 
                                }}>
                                    <Trash2 size={16} /> Delete
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}
       </Modal>
    </div>
  );
};

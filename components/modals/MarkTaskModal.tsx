
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Task, Proof } from '../../types';
import { Info, Upload, Sparkles } from 'lucide-react';
import { uploadImage } from '../../services/storageService';
import { format } from 'date-fns';
import { getRealTime } from '../../services/timeService';

interface MarkTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    task: Task | null;
    onConfirm: (taskId: string, proof: Proof) => void;
    playSound: (type: 'click' | 'success' | 'error' | 'sparkle') => void;
}

export const MarkTaskModal: React.FC<MarkTaskModalProps> = ({ isOpen, onClose, task, onConfirm, playSound }) => {
    const [remark, setRemark] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRemark('');
            setImage(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!task) return;

        setIsUploading(true);
        playSound('sparkle');

        try {
            let imageUrl = '';
            if (image) {
                imageUrl = await uploadImage(image);
            }

            const realNow = getRealTime();

            const proof: Proof = {
                id: crypto.randomUUID(),
                taskId: task.id,
                date: format(realNow, 'yyyy-MM-dd'),
                remark: remark,
                imageUrl,
                timestamp: realNow.toISOString()
            };

            onConfirm(task.id, proof);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    if (!task) return null;

    const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all";
    const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Mark: ${task.name}`}>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3 text-sm text-blue-700 dark:text-blue-300">
                    <Info size={18} className="mt-0.5 shrink-0" />
                    <p>Great job completing your task! Add a note to track your progress.</p>
                </div>
                <div>
                    <label className={labelClass}>Remark / Note</label>
                    <textarea 
                        required 
                        className={inputClass} 
                        rows={3} 
                        placeholder="How did it go?" 
                        value={remark} 
                        onChange={e => setRemark(e.target.value)} 
                    />
                </div>
                <div>
                    <label className={labelClass}>Proof Image (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative group">
                        <input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Upload className="text-gray-400" size={20} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{image ? image.name : 'Click or tap to upload proof'}</span>
                        <span className="text-xs text-gray-400 mt-1">Supports all standard image formats</span>
                    </div>
                </div>
                <Button type="submit" isLoading={isUploading} className="w-full py-3 bg-gradient-to-r from-primary to-secondary shadow-xl hover:shadow-2xl text-white font-bold">
                    <Sparkles size={18} className="mr-2" /> Confirm Completion
                </Button>
            </form>
        </Modal>
    );
};

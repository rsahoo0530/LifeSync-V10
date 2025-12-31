
import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Volume2, VolumeX, Moon, Sun, Download, Upload, RefreshCw, Trash2, AlertOctagon } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { settings, toggleSound, toggleDarkMode, deleteAccountData, exportData, importData, user, showToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const [remarkInput, setRemarkInput] = useState('');

  const handleExport = () => {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifesync_backup_${user?.name}_${new Date().toISOString()}.json`;
      a.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
          if (ev.target?.result) {
              const success = importData(ev.target.result as string);
              if (success) alert('Data imported successfully!');
              else alert('Import failed. User mismatch or invalid file.');
          }
      };
      reader.readAsText(file);
  };

  const handleDeleteConfirm = async () => {
      if (!user?.secretKey) {
          showToast('Please set a Secret Key in your Profile first.', 'error');
          setIsDeleteModalOpen(false);
          navigate('/profile');
          return;
      }

      if (secretInput !== user.secretKey) {
          showToast('Incorrect Secret Key.', 'error');
          return;
      }

      if (!remarkInput.trim()) {
          showToast('Please provide a remark.', 'error');
          return;
      }

      // Proceed with deletion
      await deleteAccountData();
      // Context handles navigation to login on success via signOut
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Settings</h2>

        <div className="bg-white dark:bg-darkcard rounded-xl p-6 shadow-sm border dark:border-gray-700 space-y-6">
            {/* Appearance */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {settings.darkMode ? <Moon className="text-primary" /> : <Sun className="text-orange-500" />}
                    <div>
                        <h3 className="font-medium">Dark Mode</h3>
                        <p className="text-sm text-gray-500">Toggle app theme</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.darkMode} onChange={toggleDarkMode} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
            </div>

            <hr className="dark:border-gray-700" />

            {/* Sound */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {settings.soundEnabled ? <Volume2 className="text-green-500" /> : <VolumeX className="text-gray-400" />}
                    <div>
                        <h3 className="font-medium">Sound Effects</h3>
                        <p className="text-sm text-gray-500">Play sounds on interactions</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.soundEnabled} onChange={toggleSound} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
            </div>

            <hr className="dark:border-gray-700" />

            {/* Data Management */}
            <div>
                <h3 className="font-medium mb-4">Data Management</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button variant="secondary" onClick={handleExport}>
                        <Download size={16} /> Export Backup
                    </Button>
                    <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        <Upload size={16} /> Import Backup
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleImport} />
                </div>
            </div>

             <hr className="dark:border-gray-700" />
             
             {/* Danger Zone */}
             <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30">
                <h3 className="font-medium text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                    <AlertOctagon size={18} /> Danger Zone
                </h3>
                <p className="text-sm text-gray-500 mb-4">Permanently delete all your data including tasks, journal entries, and proofs. This action cannot be undone.</p>
                <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
                    <Trash2 size={16} /> Reset All Data
                </Button>
             </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Data Reset">
            <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-700 dark:text-red-300 text-sm">
                    Warning: You are about to wipe all your data from the server.
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-1">Enter Secret Key</label>
                    <input 
                        type="password" 
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="Your Profile Secret Key"
                        value={secretInput}
                        onChange={e => setSecretInput(e.target.value)}
                    />
                     {!user?.secretKey && <p className="text-xs text-red-500 mt-1">You have not set a Secret Key in your Profile yet.</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Reason (Remark)</label>
                    <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-red-500 outline-none"
                        placeholder="Why are you deleting?"
                        value={remarkInput}
                        onChange={e => setRemarkInput(e.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleDeleteConfirm}>Confirm Delete</Button>
                </div>
            </div>
        </Modal>
    </div>
  );
};

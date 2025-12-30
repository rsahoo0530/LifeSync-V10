import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Volume2, VolumeX, Moon, Sun, Download, Upload, RefreshCw } from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, toggleSound, toggleDarkMode, resetData, exportData, importData, user } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
             <div>
                <h3 className="font-medium text-red-500 mb-4">Danger Zone</h3>
                <Button variant="danger" onClick={() => { if (confirm('Are you sure? This will delete all local data.')) resetData(); }}>
                    <RefreshCw size={16} /> Reset All Data
                </Button>
             </div>
        </div>
    </div>
  );
};
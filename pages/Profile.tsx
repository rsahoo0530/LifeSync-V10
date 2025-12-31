
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { uploadImage } from '../services/storageService';
import { User } from '../types';
import { Camera, Mail, User as UserIcon, Calendar, Info, Lock, Clock, Key } from 'lucide-react';
import { differenceInYears } from 'date-fns';

export const Profile: React.FC = () => {
  const { user, updateUser, playSound, showToast } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>(user || {});
  
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newPassword, setNewPassword] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      // Pass the new password (if set) to the context
      await updateUser({
          ...formData,
          email: newEmail
      }, newPassword || undefined);
      
      setNewPassword(''); // Clear password field after save
      setIsEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          setIsUploading(true);
          try {
              // 1. Upload to Cloudinary
              const url = await uploadImage(e.target.files[0]);
              
              // 2. Update local state for preview
              setFormData(prev => ({ ...prev, avatar: url }));
              
              // 3. Enable edit mode so user can see the "Save Changes" button
              setIsEditing(true);
              
              showToast('Image uploaded! Click "Save Changes" to confirm.', 'info');
          } catch (error: any) {
              showToast(error.message || 'Failed to upload image', 'error');
          } finally {
              setIsUploading(false);
          }
      }
  };

  const calculateAge = (dobString?: string) => {
      if (!dobString) return 'N/A';
      try {
          const dob = new Date(dobString);
          return differenceInYears(new Date(), dob);
      } catch (e) {
          return 'N/A';
      }
  };

  if (!user) return null;

  const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none disabled:opacity-60 disabled:cursor-not-allowed transition-all";
  const labelClass = "block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 ml-1";

  return (
    <div className="max-w-3xl mx-auto py-6">
        <h2 className="text-3xl font-bold mb-6">Profile Settings</h2>
        <div className="bg-white dark:bg-darkcard rounded-3xl p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
            {/* Header */}
            <div className="flex flex-col items-center mb-10 relative">
                <div className="w-full h-32 bg-gradient-to-r from-primary to-secondary absolute top-0 left-0 rounded-t-3xl opacity-10"></div>
                <div className="relative group mt-8">
                    <div className="w-32 h-32 rounded-full p-1 bg-white dark:bg-darkcard overflow-hidden relative">
                        {isUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                        <img 
                            src={formData.avatar || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                            className="w-full h-full rounded-full object-cover" 
                            alt="Avatar" 
                            onError={(e) => {
                                e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`;
                            }}
                        />
                    </div>
                    <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-indigo-600 transition-colors z-10">
                        <Camera size={18} />
                        <input type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleAvatarChange} disabled={isUploading} />
                    </label>
                </div>
                <h3 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h3>
                <div className="flex items-center gap-2 text-gray-500 mt-1">
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs border dark:border-gray-700">Member</span>
                    <span className="text-sm">{user.email}</span>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                {/* Age Display */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center gap-4">
                     <div className="p-3 bg-indigo-100 dark:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-300">
                         <Clock size={24} />
                     </div>
                     <div>
                         <p className="text-sm text-gray-500 dark:text-gray-400">Current Age</p>
                         <p className="text-2xl font-bold text-gray-900 dark:text-white">{calculateAge(formData.dob)} <span className="text-sm font-normal text-gray-500">Years</span></p>
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}><UserIcon size={14} className="inline mr-1"/> Full Name</label>
                        <input disabled={!isEditing} className={inputClass} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className={labelClass}><Calendar size={14} className="inline mr-1"/> Date of Birth</label>
                        <input 
                            type="date" 
                            max={new Date().toISOString().split('T')[0]} // Valid: No future dates
                            disabled={!isEditing} 
                            className={inputClass} 
                            value={formData.dob || ''} 
                            onChange={e => setFormData({...formData, dob: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className={labelClass}><Info size={14} className="inline mr-1"/> Gender</label>
                        <select disabled={!isEditing} className={inputClass} value={formData.gender || ''} onChange={e => setFormData({...formData, gender: e.target.value})}>
                             <option value="">Select Gender</option>
                             <option value="Male">Male</option>
                             <option value="Female">Female</option>
                             <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                {/* Account Settings */}
                <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-2xl border dark:border-gray-700/50">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Lock size={18} /> Security</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={labelClass}>Email Address</label>
                            <input disabled={!isEditing} type="email" className={inputClass} value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                        </div>
                        <div>
                            <label className={labelClass}>Change Password</label>
                            <input disabled={!isEditing} type="password" className={inputClass} placeholder="New password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            <p className="text-xs text-gray-500 mt-2">Leave blank to keep current password.</p>
                        </div>
                    </div>
                    
                    {/* Secret Key Section */}
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                        <label className={labelClass}><Key size={14} className="inline mr-1"/> Data Deletion Secret Key</label>
                        <div className="flex gap-2">
                            <input 
                                disabled={!isEditing} 
                                type="password" 
                                className={inputClass} 
                                placeholder="Set a secure phrase to enable account deletion"
                                value={formData.secretKey || ''} 
                                onChange={e => setFormData({...formData, secretKey: e.target.value})} 
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">You must set this key to be able to reset/delete your account data later.</p>
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Bio</label>
                    <textarea disabled={!isEditing} className={inputClass} rows={4} value={formData.bio || ''} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Tell us about yourself..." />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    {isEditing ? (
                        <>
                            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button type="submit" isLoading={isUploading}>Save Changes</Button>
                        </>
                    ) : (
                        <Button type="button" onClick={() => setIsEditing(true)} className="w-full md:w-auto">Edit Profile</Button>
                    )}
                </div>
            </form>
        </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Eye, EyeOff, RefreshCw, Shield, Zap, Lock, Mail, User, ArrowRight, ChevronRight, Fingerprint } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'login' | 'signup' | 'forgot';

export const Auth: React.FC = () => {
  const { login, signup, resetPassword, playSound, showToast } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Captcha State
  const [captchaAnswer, setCaptchaAnswer] = useState(0);
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion(`${num1} + ${num2}`);
    setCaptchaAnswer(num1 + num2);
    setUserCaptcha('');
  };

  useEffect(() => {
    generateCaptcha();
  }, [mode]);

  const checkStrength = (pass: string) => {
    let s = 0;
    if (pass.length > 5) s++;
    if (pass.length > 7) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;
    setPasswordStrength(s);
    setPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (parseInt(userCaptcha) !== captchaAnswer) {
        showToast('Security verification failed.', 'error');
        playSound('error');
        generateCaptcha();
        return;
    }

    setLoading(true);
    playSound('click');

    try {
        if (mode === 'signup') {
            if (passwordStrength < 2) {
                showToast('Password is too weak.', 'error');
                setLoading(false);
                return;
            }
            const success = await signup(email, password, name);
            if (success) {
                showToast('Account initialized.', 'success');
                // Auto login or switch to login
                setMode('login');
                generateCaptcha();
            }
        } else if (mode === 'login') {
            const success = await login(email, password);
            if (success) {
                navigate('/');
            } else {
                 // Context handles specific toasts, but we play error sound here
                 playSound('error');
                 generateCaptcha();
            }
        } else {
            const success = await resetPassword(email);
            if (success) {
                showToast('Recovery link sent to your email.', 'info');
                setMode('login');
            }
            generateCaptcha();
        }
    } catch (error) {
        console.error(error);
        showToast('System error occurred.', 'error');
    } finally {
        setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
      playSound('click');
      setMode(newMode);
      setEmail('');
      setPassword('');
      setName('');
      setUserCaptcha('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-gray-100 relative overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-800 via-gray-950 to-black opacity-80"></div>
      
      {/* Subtle Grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05]"></div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-[420px] mx-4">
        <div className="relative bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
            
            {/* Header */}
            <div className="text-center mb-8 relative">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 rotate-3 hover:rotate-6 transition-transform duration-300">
                    <Zap size={28} className="text-white fill-white" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                    LifeSync Pro
                </h1>
                <p className="text-sm text-gray-300 font-medium tracking-wide uppercase">
                    {mode === 'login' && 'Identity Verification'}
                    {mode === 'signup' && 'Create New Identity'}
                    {mode === 'forgot' && 'Access Recovery'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {mode === 'signup' && (
                    <div className="group">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-cyan-300 transition-colors">
                                <User size={18} />
                            </div>
                            <input 
                                type="text" 
                                required
                                className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 block pl-11 p-3.5 transition-all placeholder-gray-400 hover:bg-black/30 outline-none"
                                placeholder="Display Name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                <div className="group">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-cyan-300 transition-colors">
                            <Mail size={18} />
                        </div>
                        <input 
                            type="email" 
                            required
                            className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 block pl-11 p-3.5 transition-all placeholder-gray-400 hover:bg-black/30 outline-none"
                            placeholder="Email Address"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                {mode !== 'forgot' && (
                    <div className="space-y-2">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-cyan-300 transition-colors">
                                <Lock size={18} />
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 block pl-11 pr-10 p-3.5 transition-all placeholder-gray-400 hover:bg-black/30 outline-none"
                                placeholder="Password"
                                value={password}
                                onChange={e => checkStrength(e.target.value)}
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {mode === 'signup' && password && (
                            <div className="flex gap-1 h-1 px-1">
                                {[...Array(5)].map((_, i) => (
                                    <div 
                                        key={i} 
                                        className={`h-full flex-1 rounded-full transition-all duration-500 ${
                                            i < passwordStrength 
                                                ? passwordStrength < 3 ? 'bg-red-500' : passwordStrength < 4 ? 'bg-yellow-500' : 'bg-green-500'
                                                : 'bg-white/10'
                                        }`} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Captcha */}
                <div className="bg-black/20 rounded-xl p-3 border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-gray-300 pl-2">
                         <Shield size={16} className="text-purple-400" />
                         <span>Code: <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded ml-1">{captchaQuestion}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            required
                            className="w-16 bg-black/30 border border-white/10 rounded-lg p-1.5 text-center text-white text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                            value={userCaptcha}
                            onChange={e => setUserCaptcha(e.target.value)}
                        />
                        <button type="button" onClick={generateCaptcha} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full group relative bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-cyan-500/20 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden"
                >
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                    <div className="flex items-center justify-center gap-2">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>{mode === 'login' ? 'Authenticate' : mode === 'signup' ? 'Initialize' : 'Send Link'}</span>
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </div>
                </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-3 text-center">
                {mode === 'login' && (
                    <>
                        <button onClick={() => switchMode('signup')} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 group">
                            New operator? <span className="text-cyan-300 group-hover:underline">Create ID</span>
                        </button>
                        <button onClick={() => switchMode('forgot')} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                            Forgot access code?
                        </button>
                    </>
                )}
                {mode === 'signup' && (
                    <button onClick={() => switchMode('login')} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 group">
                        Existing ID? <span className="text-cyan-300 group-hover:underline">Login</span>
                    </button>
                )}
                {mode === 'forgot' && (
                    <button onClick={() => switchMode('login')} className="text-sm text-gray-400 hover:text-white transition-colors">
                        Return to Login
                    </button>
                )}
            </div>
        </div>
        
        <div className="text-center mt-6 text-xs text-gray-500 font-mono flex items-center justify-center gap-2 opacity-60">
            <Fingerprint size={12} /> SYSTEM SECURE V10
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
            100% { transform: translateX(100%); }
        }
        .animate-shimmer {
            animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

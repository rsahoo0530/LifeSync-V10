
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Eye, EyeOff, RefreshCw, ShieldCheck } from 'lucide-react';
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
    setCaptchaQuestion(`${num1} + ${num2} = ?`);
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

  const getStrengthText = () => {
    if (password.length === 0) return '';
    if (passwordStrength < 2) return 'Weak';
    if (passwordStrength < 4) return 'Medium';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (passwordStrength < 2) return 'bg-red-500';
    if (passwordStrength < 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Captcha Check
    if (parseInt(userCaptcha) !== captchaAnswer) {
        showToast('Incorrect CAPTCHA answer.', 'error');
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
                showToast('Account created! Logging in...', 'success');
                // Firebase automatically signs in after signup, app context listener will redirect
                generateCaptcha();
            } else {
                // Error toast handled in context
                generateCaptcha();
            }
        } else if (mode === 'login') {
            const success = await login(email, password);
            if (success) {
                // Force navigation to Dashboard
                navigate('/');
            } else {
                 showToast('Invalid email or password.', 'error');
                 playSound('error');
                 generateCaptcha();
            }
        } else {
            const success = await resetPassword(email);
            if (success) {
                showToast('Password reset link sent to email.', 'info');
                setMode('login');
            }
            generateCaptcha();
        }
    } catch (error) {
        console.error(error);
        showToast('An error occurred.', 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark p-4 bg-[url('https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&q=80')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
      <div className="relative w-full max-w-md bg-white dark:bg-darkcard/90 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-primary/30">L</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            LifeSync Pro
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {mode === 'login' && 'Welcome back, achiever!'}
            {mode === 'signup' && 'Start your journey today.'}
            {mode === 'forgot' && 'Recover your account.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
             <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
             </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <div className="relative">
                <input 
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:outline-none transition-all pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => checkStrength(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {mode === 'signup' && password.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-300 ${getStrengthColor()}`} style={{width: `${(passwordStrength/5)*100}%`}}></div>
                      </div>
                      <span className="text-xs text-gray-500">{getStrengthText()}</span>
                  </div>
              )}
            </div>
          )}

          {/* CAPTCHA */}
          <div className="bg-gray-50 dark:bg-black/30 p-3 rounded-xl border border-gray-200 dark:border-gray-600">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <ShieldCheck size={14} /> Security Check
              </label>
              <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white dark:bg-gray-700 p-2 rounded-lg text-center font-mono text-lg tracking-widest border border-gray-300 dark:border-gray-600 select-none">
                      {captchaQuestion}
                  </div>
                  <input 
                      type="number"
                      required
                      placeholder="?"
                      className="w-20 px-3 py-2 rounded-lg bg-white dark:bg-black/20 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none text-center"
                      value={userCaptcha}
                      onChange={e => setUserCaptcha(e.target.value)}
                  />
                  <button type="button" onClick={generateCaptcha} className="p-2 text-gray-400 hover:text-primary transition-colors">
                      <RefreshCw size={20} />
                  </button>
              </div>
          </div>

          <Button type="submit" isLoading={loading} className="w-full py-3 text-lg">
            {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          {mode === 'login' && (
            <>
              <p className="mb-2">
                Don't have an account? <button onClick={() => setMode('signup')} className="text-primary hover:underline font-bold">Sign up</button>
              </p>
              <button onClick={() => setMode('forgot')} className="text-gray-500 hover:text-gray-300">Forgot Password?</button>
            </>
          )}
          {mode === 'signup' && (
             <p>Already have an account? <button onClick={() => setMode('login')} className="text-primary hover:underline font-bold">Login</button></p>
          )}
          {mode === 'forgot' && (
             <button onClick={() => setMode('login')} className="text-primary hover:underline font-bold">Back to Login</button>
          )}
        </div>
      </div>
    </div>
  );
};

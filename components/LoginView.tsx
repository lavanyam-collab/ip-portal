
import React, { useState, useEffect } from 'react';
import { FaceIdIcon, FingerprintIcon, InteriorPlusLogo } from './Icons';
import { UserProfile } from '../types';
import { StorageService } from '../services/storage';
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../firebaseConfig';

interface LoginViewProps {
  onLogin: (userId: string) => void;
  users?: UserProfile[];
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, users = [] }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [bioScanning, setBioScanning] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("DEMO CREDENTIALS:");
    console.log("Admin: admin@interiorplus.com / admin123");
    console.log("Employee: employee@interiorplus.com / user123");

    // Check for saved credentials (Async)
    const checkCreds = async () => {
        const credentials = await StorageService.getCredentials();
        if (credentials.email && credentials.password) {
            setEmail(credentials.email);
            setPassword(credentials.password);
            setRememberMe(true);
        }
    };
    checkCreds();
  }, []);

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 1. Attempt Firebase Login
    if (auth) {
        try {
            await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            
            const internalProfile = users.find(u => u.email.toLowerCase() === firebaseUser.email?.toLowerCase());
            
            if (internalProfile) {
                if (internalProfile.status === 'Inactive') {
                    setError('Account is deactivated. Contact Admin.');
                    setIsLoading(false);
                    return;
                }
                handleRememberMe();
                onLogin(internalProfile.id);
                return;
            } else {
                setError('Login successful, but Employee Profile not found.');
                setIsLoading(false);
                return;
            }
        } catch (firebaseError: any) {
            console.warn("Firebase login failed, falling back to local:", firebaseError.message);
        }
    }

    // 2. Local Fallback
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (foundUser) {
        if (foundUser.status === 'Inactive') {
            setError('Account is deactivated. Contact Admin.');
            setIsLoading(false);
            return;
        }
        const validPass = foundUser.password ? foundUser.password === password : password === 'user123';
        if (validPass) {
            handleRememberMe();
            onLogin(foundUser.id);
            setIsLoading(false);
            return;
        }
    }

    // 3. Admin Fallback (Master Override)
    if (email === 'admin@interiorplus.com' && password === 'admin123') {
         handleRememberMe();
         // Ensure we log in as the admin user if they exist, otherwise fallback to u1
         const adminUser = users.find(u => u.email === 'admin@interiorplus.com') || users.find(u => u.isHR);
         onLogin(adminUser ? adminUser.id : 'u1'); 
         setIsLoading(false);
         return;
    }

    setError('Invalid credentials.');
    setIsLoading(false);
  };

  const handleRememberMe = () => {
      if (rememberMe) {
          StorageService.saveCredentials(email, password);
      } else {
          StorageService.saveCredentials('', '');
      }
  };

  const handleBiometricLogin = (type: 'face' | 'finger') => {
    setBioScanning(true);
    setTimeout(() => {
      setBioScanning(false);
      // Face ID = Admin (Sarah Jenkins), Fingerprint = Manager (Mike Ross)
      let targetUser = users.find(u => u.isHR && u.status !== 'Inactive'); // Default to Admin for Face
      if (type === 'finger') {
          targetUser = users.find(u => u.role.includes('Manager') && u.status !== 'Inactive') || users.find(u => !u.isHR && u.status !== 'Inactive');
      }
      
      if (targetUser) {
          onLogin(targetUser.id);
      } else {
          // Fallback if lists are empty or filtered out
          onLogin(type === 'face' ? 'u1' : 'u2');
      }
    }, 2000);
  };

  return (
    <div className="h-full w-full bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Responsive Background Pattern */}
        <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-100 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000"></div>
        </div>

        {/* Main Content Card - Clean, no rounded corners simulation, allowing internal scrolling */}
        <div className="w-full max-w-md bg-white/90 backdrop-blur-xl border border-white/50 relative z-10 flex flex-col overflow-hidden h-full">
            {/* Top accent line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-red-500 to-blue-600 shrink-0"></div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col no-scrollbar">
                <div className="flex flex-col items-center gap-6 my-auto">
                    {/* Logo - Reduced size for better fit */}
                    <div className="w-40 transition-all duration-300 hover:scale-105 shrink-0">
                        <InteriorPlusLogo className="w-full h-auto" />
                    </div>

                    <div className="w-full flex flex-col gap-4">
                        <div className="text-center shrink-0">
                            <h2 className="text-lg font-bold text-slate-800">Welcome Back</h2>
                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Employee Portal Access</p>
                        </div>

                        <form onSubmit={handleCredentialsLogin} className="flex flex-col gap-4">
                            {error && (
                                <div className="p-2 bg-red-50 text-red-600 text-[10px] rounded-lg font-bold text-center border border-red-100 flex items-center justify-center gap-2 animate-pulse">
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-3">
                                <div className="group relative">
                                    <input 
                                        type="email" 
                                        id="email" 
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="peer w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-sm font-bold placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white focus:border-blue-500 transition-all"
                                        placeholder="Email Address"
                                    />
                                    <label htmlFor="email" className="absolute left-4 -top-2 bg-white px-1 text-[9px] font-bold text-slate-400 uppercase tracking-wide transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-focus:-top-2 peer-focus:text-[9px] peer-focus:text-blue-600">
                                        Email ID
                                    </label>
                                </div>

                                <div className="group relative">
                                    <input 
                                        type="password" 
                                        id="password" 
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="peer w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-800 text-sm font-bold placeholder-transparent focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white focus:border-blue-500 transition-all"
                                        placeholder="Password"
                                    />
                                    <label htmlFor="password" className="absolute left-4 -top-2 bg-white px-1 text-[9px] font-bold text-slate-400 uppercase tracking-wide transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-3.5 peer-placeholder-shown:left-4 peer-focus:-top-2 peer-focus:text-[9px] peer-focus:text-blue-600">
                                        Password
                                    </label>
                                </div>
                            </div>

                            <div className="flex items-center justify-between shrink-0">
                                <label className="flex items-center cursor-pointer group">
                                    <div className="relative flex items-center">
                                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="peer sr-only" />
                                        <div className="w-3.5 h-3.5 border-2 border-slate-300 rounded peer-checked:bg-slate-900 peer-checked:border-slate-900 transition-colors bg-white"></div>
                                    </div>
                                    <span className="ml-2 text-[10px] font-bold text-slate-500 uppercase group-hover:text-slate-700 transition-colors select-none">Remember Me</span>
                                </label>
                                <a href="#" className="text-[10px] font-bold text-blue-600 uppercase hover:text-blue-700 transition-colors">Forgot Password?</a>
                            </div>

                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wide shadow-lg shadow-slate-900/20 hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shrink-0"
                            >
                                {isLoading ? (
                                    <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>Verifying...</span></>
                                ) : (
                                    <span>Secure Login</span>
                                )}
                            </button>
                        </form>

                        <div className="relative py-1 shrink-0">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                            <div className="relative flex justify-center"><span className="bg-white px-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Or Login With</span></div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 shrink-0">
                            <button onClick={() => handleBiometricLogin('finger')} disabled={bioScanning || isLoading} className="flex flex-col items-center justify-center p-3 border border-slate-100 bg-slate-50/50 rounded-xl hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all group active:scale-95 disabled:opacity-50">
                                <FingerprintIcon className={`w-5 h-5 mb-1 ${bioScanning ? 'text-blue-600 animate-pulse' : 'text-slate-400 group-hover:text-blue-600 transition-colors'}`} />
                                <span className="text-[9px] font-bold text-slate-500 uppercase group-hover:text-slate-700">Manager</span>
                            </button>
                            <button onClick={() => handleBiometricLogin('face')} disabled={bioScanning || isLoading} className="flex flex-col items-center justify-center p-3 border border-slate-100 bg-slate-50/50 rounded-xl hover:bg-white hover:border-blue-200 hover:shadow-sm transition-all group active:scale-95 disabled:opacity-50">
                                <FaceIdIcon className={`w-5 h-5 mb-1 ${bioScanning ? 'text-blue-600 animate-pulse' : 'text-slate-400 group-hover:text-blue-600 transition-colors'}`} />
                                <span className="text-[9px] font-bold text-slate-500 uppercase group-hover:text-slate-700">Admin</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Biometric Overlay */}
        {bioScanning && (
            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-slate-200 rounded-full flex items-center justify-center relative overflow-hidden bg-white shadow-xl">
                        <FingerprintIcon className="w-10 h-10 text-slate-300" />
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.6)] animate-[scan_1.5s_ease-in-out_infinite]"></div>
                    </div>
                </div>
                <h3 className="mt-4 text-sm font-bold text-slate-800">Verifying Identity...</h3>
            </div>
        )}

        <style>{`
            @keyframes scan {
                0% { top: 0; opacity: 0.5; }
                50% { top: 100%; opacity: 1; }
                100% { top: 0; opacity: 0.5; }
            }
            @keyframes blob {
                0% { transform: translate(0px, 0px) scale(1); }
                33% { transform: translate(30px, -50px) scale(1.1); }
                66% { transform: translate(-20px, 20px) scale(0.9); }
                100% { transform: translate(0px, 0px) scale(1); }
            }
            .animate-blob {
                animation: blob 7s infinite;
            }
            .animation-delay-2000 {
                animation-delay: 2s;
            }
            .animation-delay-4000 {
                animation-delay: 4s;
            }
        `}</style>
    </div>
  );
};

export default LoginView;

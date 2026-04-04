import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Lock, User } from 'lucide-react';

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const message = location.state?.message;
    const [isLoading, setIsLoading] = useState(false);
    const googleBtnRef = useRef<HTMLDivElement>(null);

    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    const handleGoogleResponse = async (response: any) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ credential: response.credential }),
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('user_token', data.token);
                localStorage.setItem('user_info', JSON.stringify(data.user));

                if (data.user.role === 'ADMIN') {
                    navigate('/dashboard/admin');
                } else {
                    navigate('/dashboard/socio');
                }
            } else {
                const errText = await res.text();
                alert(errText || 'Error al iniciar sesión con Google');
            }
        } catch (error) {
            console.error('Google auth failed', error);
            alert('Error de conexión');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !(window as any).google) return;

        const initGoogle = () => {
            (window as any).google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse,
            });

            if (googleBtnRef.current) {
                (window as any).google.accounts.id.renderButton(
                    googleBtnRef.current,
                    {
                        theme: 'filled_black',
                        size: 'large',
                        width: '100%',
                        text: 'continue_with',
                        shape: 'pill',
                        locale: 'es',
                    }
                );
            }
        };

        // Google script might not be loaded yet
        if ((window as any).google?.accounts) {
            initGoogle();
        } else {
            const interval = setInterval(() => {
                if ((window as any).google?.accounts) {
                    clearInterval(interval);
                    initGoogle();
                }
            }, 100);
            return () => clearInterval(interval);
        }
    }, [GOOGLE_CLIENT_ID]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const email = (e.target as any)[0].value;
        const password = (e.target as any)[1].value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                // Save token/user info
                localStorage.setItem('user_token', data.token);
                localStorage.setItem('user_info', JSON.stringify(data.user));

                if (data.user.role === 'ADMIN') {
                    navigate('/dashboard/admin');
                } else {
                    navigate('/dashboard/socio');
                }
            } else {
                alert("Credenciales no válidas"); // Simple alert for now, can be styled later
            }
        } catch (error) {
            console.error("Login failed", error);
            alert("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500 selection:text-white font-sans flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black opacity-60 animate-pulse-slow"></div>
                <img src="/assets/hero_fogata.jpg" className="w-full h-full object-cover opacity-20 blur-sm scale-110" alt="Background" />
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md p-8 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl animate-fade-in-up">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 mb-4 rounded-full bg-white/90 flex items-center justify-center p-3 border border-white/5 shadow-inner">
                        <img
                            src="/assets/logo_beba.png"
                            alt="La Abuela Beba"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h2 className="text-2xl font-normal font-['Arial'] uppercase tracking-widest text-white/90">Acceso Socios</h2>
                    <p className="text-sm text-zinc-400 font-['Calibri'] italic mt-1">Bienvenido a tu casa alternativa</p>
                </div>

                {/* Form */}
                {message && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-xl text-sm font-medium text-center mb-6">
                        {message}
                    </div>
                )}
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold ml-1">Email / Usuario</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                            <input
                                type="email"
                                required
                                className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-light"
                                placeholder="tu@email.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold ml-1">Contraseña</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                            <input
                                type="password"
                                required
                                className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-light"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <a href="#" className="text-xs text-zinc-500 hover:text-emerald-400 transition-colors">¿Olvidaste tu contraseña?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full group relative flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold tracking-wide transition-all overflow-hidden shadow-lg shadow-emerald-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span>INGRESAR</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}

                        {/* Shine Effect */}
                        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                    </button>
                </form>

                {/* Google Sign-In */}
                {GOOGLE_CLIENT_ID && (
                    <>
                        <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 border-t border-zinc-800"></div>
                            <span className="text-zinc-600 text-xs uppercase tracking-widest">o</span>
                            <div className="flex-1 border-t border-zinc-800"></div>
                        </div>
                        <div ref={googleBtnRef} className="flex justify-center [&>div]:w-full"></div>
                    </>
                )}

                {/* Footer Link */}
                <div className="mt-8 text-center space-y-2">
                    <p className="text-zinc-500 text-sm">
                        ¿No sos socio? <button onClick={() => navigate('/register')} className="text-emerald-400 hover:text-emerald-300 transition-colors font-bold uppercase tracking-wide">Solicitar Membresía</button>
                    </p>
                    <button onClick={() => navigate('/')} className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">Volver al inicio</button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;

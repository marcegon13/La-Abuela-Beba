import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ArrowRight, Loader } from 'lucide-react';

const TokenPage: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ total: 30, claimed: 0, remaining: 30 });
    const [isLoading, setIsLoading] = useState(false);
    const [claimStatus, setClaimStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [userToken, setUserToken] = useState<any>(null);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        fetchStats();
        checkUserToken();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/tokens/stats');
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch stats", error);
        }
    };

    const checkUserToken = () => {
        const userInfoStr = localStorage.getItem('user_info');
        if (userInfoStr) {
            const userInfo = JSON.parse(userInfoStr);
            setUserName(userInfo.full_name || 'Socio');
        }
    };

    const handleClaim = async () => {
        setIsLoading(true);
        setErrorMessage('');

        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        const userId = userInfo.id;

        if (!userId) {
            navigate('/login');
            return;
        }

        try {
            const response = await fetch('/api/tokens/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            });

            if (response.ok) {
                const data = await response.json();
                setUserToken(data.token);
                setClaimStatus('success');
                fetchStats(); // Update counter
            } else {
                const errData = await response.json();

                if (response.status === 409) {
                    // Check specific error message
                    if (errData?.error === "User already owns a token" || (typeof errData === 'string' && errData.includes("already"))) {
                        setClaimStatus('error');
                        setErrorMessage("Ya posees un Token Exclusivo.");
                    } else if (errData === "Sold out") {
                        setClaimStatus('error');
                        setErrorMessage("¡Lo sentimos! Se han agotado los tokens.");
                    } else {
                        setClaimStatus('error');
                        setErrorMessage("No se pudo procesar la solicitud.");
                    }
                } else {
                    setClaimStatus('error');
                    setErrorMessage("Error al reclamar el token. Inténtalo nuevamente.");
                }
            }
        } catch (error) {
            setClaimStatus('error');
            setErrorMessage("Error de conexión server.");
        } finally {
            setIsLoading(false);
        }
    };

    if (claimStatus === 'success') {
        return (
            <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/10 via-black to-black opacity-80"></div>
                </div>

                <div className="relative z-10 w-full max-w-3xl p-12 text-center animate-fade-in-up flex flex-col items-center">
                    <div className="w-32 h-32 mb-8 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(234,179,8,0.3)]">
                        <Award className="w-16 h-16 text-yellow-500" />
                    </div>

                    <h1 className="text-white mb-6 font-['Arial'] font-normal text-4xl md:text-5xl leading-tight">
                        ¡Felicitaciones, {userName}!
                    </h1>

                    <p className="text-yellow-500/90 font-['Calibri'] italic text-2xl md:text-3xl mb-4 max-w-2xl leading-relaxed">
                        Ya sos poseedor de 1 de los 30 Tokens Fundadores de La Beba
                    </p>

                    <div className="bg-black/40 border border-yellow-500/20 px-8 py-4 rounded-xl mb-12 backdrop-blur-sm">
                        <span className="text-zinc-500 text-xs tracking-[0.2em] uppercase block mb-2">Código Único</span>
                        <span className="text-3xl font-mono text-white tracking-widest">{userToken?.token_code}</span>
                    </div>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-10 py-3 border border-white/20 hover:bg-white/10 text-white rounded-full text-sm font-bold tracking-wide transition-all uppercase"
                    >
                        Volver al Panel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/20 via-black to-black opacity-60 animate-pulse-slow"></div>
                <img src="/assets/hero_sol.jpg" className="w-full h-full object-cover opacity-20 blur-sm scale-110 grayscale brightness-50" alt="Background" />
            </div>

            <div className="relative z-10 w-full max-w-2xl p-8 text-center animate-fade-in-up">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-8 shadow-[0_0_30px_-5px_rgba(234,179,8,0.3)]">
                    <Award className="w-12 h-12 text-yellow-500" />
                </div>

                <h1 className="text-4xl md:text-5xl font-bold font-['Arial'] text-white mb-4 uppercase tracking-tight">
                    Token Fundador
                </h1>
                <p className="text-xl text-yellow-500 font-['Calibri'] italic mb-12">
                    Acceso vitalicio exclusivo para los primeros 30 socios.
                </p>

                {/* Counter */}
                <div className="grid grid-cols-3 gap-4 mb-12 max-w-md mx-auto">
                    <div className="bg-zinc-900/80 border border-white/10 p-4 rounded-xl">
                        <div className="text-3xl font-bold text-white">{stats.total}</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Total</div>
                    </div>
                    <div className="bg-zinc-900/80 border border-white/10 p-4 rounded-xl">
                        <div className="text-3xl font-bold text-emerald-400">{stats.claimed}</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Reclamados</div>
                    </div>
                    <div className="bg-zinc-900/80 border border-yellow-500/30 p-4 rounded-xl shadow-[0_0_15px_-5px_rgba(234,179,8,0.2)]">
                        <div className="text-3xl font-bold text-yellow-500">{stats.remaining}</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Disponibles</div>
                    </div>
                </div>

                {/* Action Area */}
                <div className="space-y-6">
                    {errorMessage && (
                        <div className="p-4 bg-red-900/20 border border-red-500/30 text-red-200 rounded-xl text-sm">
                            {errorMessage}
                        </div>
                    )}

                    <button
                        onClick={handleClaim}
                        disabled={isLoading || stats.remaining === 0 || errorMessage.includes("Ya posees")}
                        className="group relative inline-flex items-center gap-3 px-8 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold text-lg rounded-full transition-all transform hover:scale-105 shadow-[0_0_20px_-5px_rgba(234,179,8,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isLoading ? <Loader className="w-6 h-6 animate-spin" /> : <span>{errorMessage.includes("Ya posees") ? "TOKEN YA RECLAMADO" : "RECLAMAR AHORA"}</span>}
                        {!isLoading && !errorMessage.includes("Ya posees") && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </button>

                    {stats.remaining === 0 && (
                        <p className="text-zinc-500 text-sm">Lo sentimos, todos los tokens han sido asignados.</p>
                    )}
                </div>

                <div className="mt-12">
                    <button onClick={() => navigate('/')} className="text-zinc-600 hover:text-white transition-colors text-sm">Volver al inicio</button>
                </div>
            </div>
        </div>
    );
};

export default TokenPage;

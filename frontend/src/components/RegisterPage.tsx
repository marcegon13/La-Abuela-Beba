import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User, Mail, Phone, CreditCard, Lock, Calendar, Info } from 'lucide-react';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [emailForVerification, setEmailForVerification] = useState("");
    const [otpCode, setOtpCode] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = {
            full_name: (e.target as any).full_name.value,
            email: (e.target as any).email.value,
            dni: (e.target as any).dni.value,
            phone: (e.target as any).phone.value,
            password: (e.target as any).password.value,
            age: parseInt((e.target as any).age.value) || 0,
            how_found: (e.target as any).how_found.value,
        };

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                // Ignore response data
                try { await response.json(); } catch(e) {}
                setEmailForVerification(formData.email);
                setIsVerifying(true);
            } else {
                let errorMsg = "Error al registrarse. Verifique los datos.";
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errData = await response.json();
                    errorMsg = errData.error || errorMsg;
                } else {
                    errorMsg = await response.text();
                }
                alert(errorMsg);
            }
        } catch (error) {
            console.error("Registration failed", error);
            alert("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailForVerification, code: otpCode }),
            });

            if (response.ok) {
                setSuccessMessage("Registro recibido. Se revisará tu solicitud en breve");
                setTimeout(() => navigate('/login'), 5000);
            } else {
                alert("Código incorrecto. Inténtalo nuevamente.");
            }
        } catch (error) {
            console.error("Verification failed", error);
            alert("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    if (successMessage) {
        return (
            <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img src="/assets/hero_fogata.jpg" className="w-full h-full object-cover opacity-20 blur-sm scale-110" alt="Background" />
                </div>
                <div className="relative z-10 max-w-lg p-8 bg-zinc-900/90 backdrop-blur-xl border border-emerald-500/30 rounded-3xl shadow-2xl text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-900/30 flex items-center justify-center">
                        <User className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4 font-['Arial']">¡Solicitud Recibida!</h2>
                    <p className="text-zinc-300 text-lg leading-relaxed font-['Calibri'] italic">{successMessage}</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-sm font-bold tracking-wide transition-all uppercase"
                    >
                        Volver al Login
                    </button>
                </div>
            </div>
        );
    }

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-black text-white selection:bg-emerald-500 selection:text-white font-sans flex items-center justify-center relative overflow-hidden py-12">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black opacity-60 animate-pulse-slow"></div>
                    <img src="/assets/hero_fogata.jpg" className="w-full h-full object-cover opacity-20 blur-sm scale-110" alt="Background" />
                </div>

                <div className="relative z-10 w-full max-w-lg p-8 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl animate-fade-in-up text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-900/30 flex items-center justify-center border border-emerald-500/20">
                        <Mail className="w-10 h-10 text-emerald-400" />
                    </div>

                    <h2 className="text-[48px] font-normal font-['Arial'] text-white mb-2 leading-tight">Verificación</h2>
                    <p className="text-zinc-400 mb-8 font-['Calibri'] italic text-lg">Ingresa el código enviado a {emailForVerification}</p>

                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <input
                                type="text"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                maxLength={6}
                                className="w-full bg-black/50 border border-zinc-700 rounded-xl py-4 text-center text-3xl tracking-[1em] text-emerald-400 placeholder:text-zinc-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono uppercase"
                                placeholder="000000"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full group relative flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold tracking-wide transition-all overflow-hidden shadow-lg shadow-emerald-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <span>VERIFICAR EMAIL</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <button onClick={() => setIsVerifying(false)} className="mt-6 text-sm text-zinc-500 hover:text-white transition-colors">
                        Volver al registro
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500 selection:text-white font-sans flex items-center justify-center relative overflow-hidden py-12">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-black to-black opacity-60 animate-pulse-slow"></div>
                <img src="/assets/hero_fogata.jpg" className="w-full h-full object-cover opacity-20 blur-sm scale-110" alt="Background" />
            </div>

            {/* Register Card */}
            <div className="relative z-10 w-full max-w-lg p-8 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl animate-fade-in-up">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 mb-4 rounded-full bg-white/90 flex items-center justify-center p-3 border border-white/5 shadow-inner">
                        <img
                            src="/assets/logo_beba.png"
                            alt="La Abuela Beba"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h2 className="text-2xl font-normal font-['Arial'] uppercase tracking-widest text-white/90">Solicitar Membresía</h2>
                    <p className="text-sm text-zinc-400 font-['Calibri'] italic mt-1">Únete a la comunidad de socios fundadores</p>
                </div>

                {/* Form */}
                <form onSubmit={handleRegister} className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold ml-1">Nombre Completo</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                            <input
                                type="text"
                                name="full_name"
                                required
                                className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-light"
                                placeholder="Juan Pérez"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold ml-1">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                            <input
                                type="email"
                                name="email"
                                required
                                className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-light"
                                placeholder="juan@ejemplo.com"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* DNI */}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold ml-1">DNI / CUIL</label>
                            <div className="relative group">
                                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                                <input
                                    type="text"
                                    name="dni"
                                    required
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-light"
                                    placeholder="12345678"
                                />
                            </div>
                        </div>
                        {/* Age */}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold ml-1">Edad</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                                <input
                                    type="number"
                                    name="age"
                                    required
                                    min="18"
                                    max="100"
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-light"
                                    placeholder="25"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Phone */}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold ml-1">Teléfono</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-light"
                                    placeholder="+54 9 11..."
                                />
                            </div>
                        </div>
                        {/* How Found */}
                        <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold ml-1">¿Cómo nos conociste?</label>
                            <div className="relative group">
                                <Info className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                                <select
                                    name="how_found"
                                    required
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-light appearance-none"
                                >
                                    <option value="" disabled className="bg-zinc-900">Seleccionar...</option>
                                    <option value="Instagram" className="bg-zinc-900">Instagram</option>
                                    <option value="Google" className="bg-zinc-900">Google</option>
                                    <option value="Un amigo" className="bg-zinc-900">Un amigo / Recomendación</option>
                                    <option value="Pasé por la puerta" className="bg-zinc-900">Pasé por la puerta</option>
                                    <option value="Otro" className="bg-zinc-900">Otro</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="text-xs uppercase tracking-wider text-zinc-500 font-bold ml-1">Contraseña</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                            <input
                                type="password"
                                name="password"
                                required
                                className="w-full bg-black/50 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all font-light"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-6 group relative flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold tracking-wide transition-all overflow-hidden shadow-lg shadow-emerald-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span>SOLICITAR MEMBRESÍA</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                        <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                    </button>
                </form>

                {/* Footer Link */}
                <div className="mt-8 text-center">
                    <p className="text-zinc-500 text-sm">
                        ¿Ya sos socio? <button onClick={() => navigate('/login')} className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">Ingresar</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;

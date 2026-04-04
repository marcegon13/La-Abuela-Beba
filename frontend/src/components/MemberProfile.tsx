import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, FileText, Leaf, LogOut, Download, AlertCircle, Home, Camera, X, BookOpen, Shield, Users, Heart, Plus, Minus, Calendar, CheckCircle2, Info } from 'lucide-react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
registerLocale('es', es);

const MemberProfile: React.FC = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<'manifiesto' | 'profile' | 'documents' | 'tokens' | 'gallery' | 'contratos' | 'ecopunto' | 'sostenibilidad' | 'surf' | 'casa' | 'territorio' | 'noches'>('manifiesto');
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<any>(null);
    const [gallery, setGallery] = useState<any[]>([]);
    const [galleryCat, setGalleryCat] = useState('');
    const [lightbox, setLightbox] = useState<string | null>(null);
    const [assignCheckIn, setAssignCheckIn] = useState<Date | null>(null);
    const [assignNights, setAssignNights] = useState(2);
    const [assignRoomType, setAssignRoomType] = useState<'compartido' | 'privada'>('compartido');
    const [assignSubmitting, setAssignSubmitting] = useState(false);
    const [assignSuccess, setAssignSuccess] = useState(false);

    useEffect(() => {
        // Auth & Approval Check
        const userInfoStr = localStorage.getItem('user_info');
        const userToken = localStorage.getItem('user_token');
        if (!userInfoStr || !userToken) {
            navigate('/login', { state: { message: 'Sección exclusiva para Socios Fundadores aprobados' } });
            return;
        }

        const userInfo = JSON.parse(userInfoStr);
        // We might want to verify 'is_active' from backend, but existing flow relies on token presence/backend error
        // For profile view, let's trust local storage briefly but valid with backend fetch ideally.
        // Assuming userInfo has basic details. 

        setUser(userInfo);

        // Fetch Token Info
        fetchTokenInfo(userInfo.id);
    }, [navigate]);

    const fetchTokenInfo = async (userId: string) => {
        try {
            const res = await fetch(`/api/user/impact/${userId}`); // Using existing impact endpoint which returns token info
            if (res.ok) {
                const data = await res.json();
                if (!data.is_owner && !data.token_code) {
                    // If logic requires STRICT "Approved" check, the login prevents non-active users.
                    // However, "is_owner" logic applies to tokens.
                }
                setToken(data);
            }
        } catch (error) {
            console.error("Failed to fetch token info", error);
        }
    }


    const handleLogout = () => {
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_info');
        navigate('/login');
    };

    useEffect(() => {
        if (view === 'gallery') {
            fetch(`/api/gallery${galleryCat ? `?categoria=${galleryCat}` : ''}`)
                .then(r => r.json())
                .then(setGallery)
                .catch(console.error);
        }
    }, [view, galleryCat]);

    const documents = [
        { id: 1, name: 'Reglamento_Beba.pdf', type: 'PDF', size: '2.4 MB' },
        { id: 2, name: 'Contrato_Socio_Fundador.pdf', type: 'PDF', size: '1.8 MB' },
        { id: 3, name: 'Manual_Bioconstruccion_V1.pdf', type: 'PDF', size: '5.2 MB' },
    ];

    const handleDownload = (docName: string) => {
        alert(`Descargando documento simulado: ${docName}`);
    };

    if (!user) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Cargando perfil...</div>;

    return (
        <div className="flex h-screen bg-black text-zinc-100 font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col relative z-20">
                <div className="p-6 border-b border-zinc-800 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <img src="/assets/logo_beba.png" alt="Logo" className="w-8 h-8 opacity-80" />
                    <h1 className="text-lg font-bold tracking-tight text-white font-['Arial'] uppercase">La Beba <span className="text-emerald-500 text-xs block font-light">Socios</span></h1>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors mb-2"
                    >
                        <Home size={16} /> Inicio
                    </button>

                    {/* Pilar 1: El Manifiesto */}
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold px-4 pt-3 pb-1">El Manifiesto</p>
                    <button
                        onClick={() => setView('manifiesto')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'manifiesto' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <BookOpen size={16} /> Visión 2017-2028
                    </button>

                    {/* Pilar 2: Pilares de Acción */}
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold px-4 pt-4 pb-1">Pilares de Acción</p>
                    <button
                        onClick={() => setView('gallery')}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${view === 'gallery' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <Camera size={14} /> Avances y Fotos
                    </button>
                    <button
                        onClick={() => setView('ecopunto')}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${view === 'ecopunto' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <Leaf size={14} /> Eco-Punto
                    </button>
                    <button
                        onClick={() => setView('sostenibilidad')}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${view === 'sostenibilidad' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <Heart size={14} /> Sostenibilidad
                    </button>
                    <button
                        onClick={() => setView('surf')}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${view === 'surf' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /></svg> Surf
                    </button>
                    <button
                        onClick={() => setView('casa')}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${view === 'casa' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <Home size={14} /> Casa Alternativa
                    </button>
                    <button
                        onClick={() => setView('documents')}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-medium transition-colors ${view === 'documents' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <FileText size={14} /> Media y Docs
                    </button>

                    {/* Pilar 3: Territorio */}
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold px-4 pt-4 pb-1">Territorio</p>
                    <button
                        onClick={() => setView('territorio')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'territorio' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg> Chapadmalal
                    </button>

                    {/* Pilar 4: Comunidad */}
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold px-4 pt-4 pb-1">Comunidad</p>
                    <button
                        onClick={() => setView('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'profile' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <User size={16} /> Mi Perfil
                    </button>
                    {/* Tokens oculto temporalmente para MVP
                    <button
                        onClick={() => setView('tokens')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'tokens' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <Leaf size={16} /> Mis Tokens
                    </button>
                    <button
                        onClick={() => setView('noches')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'noches' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.4-1.4.9l-1.5 2.4C7 14.4 6.8 15 7 15.4c.2.4.6.6 1 .6h2" /><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" /></svg> Mis Noches
                    </button>

                    {/* Pilar 5: Gestión del Socio */}
                    <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold px-4 pt-4 pb-1">Gestión del Socio</p>
                    <button
                        onClick={() => setView('contratos')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${view === 'contratos' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'}`}
                    >
                        <Shield size={16} /> Contratos
                    </button>
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    {/* Chapadmalal Quick Reference */}
                    <div className="bg-zinc-900/50 rounded-lg p-3 mb-3">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">📍 Ubicación</p>
                        <p className="text-zinc-400 text-xs leading-relaxed">Calle 0 e/ 815 y 817<br />Chapadmalal, Buenos Aires</p>
                        <a
                            href="https://maps.app.goo.gl/J1DX9mQthirGfjCr9"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-[10px] text-emerald-400 hover:text-emerald-300 font-medium"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Cómo llegar →
                        </a>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/5 rounded-lg text-sm transition-all group">
                        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-black p-8 relative">
                {/* Background Ambient */}
                <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-emerald-900/10 blur-[120px] rounded-full pointer-events-none"></div>

                {/* Manifiesto View */}
                {view === 'manifiesto' && (
                    <div className="animate-fade-in-up max-w-4xl mx-auto">
                        <h2 className="text-[48px] font-normal mb-2 font-['Arial'] text-white">Manifiesto</h2>
                        <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-12 border-b border-zinc-800 pb-6">La historia, los pilares y la filosofía de La Abuela Beba.</p>

                        {/* Historia */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-white font-['Arial'] mb-4">Nuestra Historia</h3>
                            <div className="space-y-4 text-zinc-400 leading-relaxed text-[15px]">
                                <p>La Abuela Beba nació como un sueño colectivo: construir un espacio donde la naturaleza, la comunidad y la vida sustentable se encuentren. Ubicada en la Calle 0 entre 815 y 817, en Chapadmalal, esta casa alternativa es un refugio para quienes buscan una forma de vida distinta.</p>
                                <p>Lo que comenzó como un terreno silvestre se transformó, con las manos de decenas de voluntarios y socios, en un ecosistema de bioconstrucción, huerta orgánica, arte reciclado y convivencia. Cada pared de barro, cada planta sembrada y cada fogón compartido cuentan una historia de comunidad.</p>
                                <p>El nombre rinde homenaje a la abuela Beba, una mujer que desde la sencillez dejó una huella profunda. Su filosofía era simple: <span className="text-white font-medium">"lo que se da con amor, vuelve multiplicado"</span>.</p>
                            </div>
                        </div>

                        {/* Los 4 Pilares */}
                        <div className="mb-12">
                            <h3 className="text-2xl font-bold text-white font-['Arial'] mb-6">Los 4 Pilares</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 hover:border-yellow-500/30 transition-colors group">
                                    <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-3 border border-yellow-500/20">
                                        <span className="text-yellow-400 text-lg">🏗️</span>
                                    </div>
                                    <h4 className="text-white font-bold mb-2">Bioconstrucción</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Construimos con materiales naturales: barro, paja, madera recuperada. Cada estructura respeta el entorno y genera el menor impacto ambiental posible.</p>
                                </div>
                                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 hover:border-emerald-500/30 transition-colors group">
                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3 border border-emerald-500/20">
                                        <span className="text-emerald-400 text-lg">🌱</span>
                                    </div>
                                    <h4 className="text-white font-bold mb-2">Permacultura</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Huerta orgánica, compostaje, recolección de agua de lluvia y energía solar. Un sistema regenerativo que se alimenta a sí mismo.</p>
                                </div>
                                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/30 transition-colors group">
                                    <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3 border border-blue-500/20">
                                        <span className="text-blue-400 text-lg">♻️</span>
                                    </div>
                                    <h4 className="text-white font-bold mb-2">Arte Reciclado</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Transformamos residuos en arte funcional. Cada objeto cuenta una historia de segunda oportunidad y creatividad colectiva.</p>
                                </div>
                                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 hover:border-pink-500/30 transition-colors group">
                                    <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center mb-3 border border-pink-500/20">
                                        <Heart size={18} className="text-pink-400" />
                                    </div>
                                    <h4 className="text-white font-bold mb-2">Comunidad</h4>
                                    <p className="text-zinc-500 text-sm leading-relaxed">Fogones, talleres, voluntariados y encuentros. La Beba es un punto de encuentro para personas que buscan conexión genuina.</p>
                                </div>
                            </div>
                        </div>

                        {/* Callout: Rebelión o Extinción */}
                        <div className="relative bg-gradient-to-br from-zinc-900 via-red-950/20 to-zinc-900 border border-red-500/20 rounded-2xl p-8 mb-8 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-orange-500 to-red-600"></div>
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-red-500/5 rounded-full blur-2xl"></div>
                            <h3 className="text-3xl font-bold text-white font-['Arial'] mb-4">🔥 Rebelión o Extinción</h3>
                            <p className="text-zinc-300 text-[17px] leading-relaxed mb-4 font-['Calibri'] italic">
                                "No estamos jugando a ser ecológicos. Estamos construyendo la alternativa real, con las manos en el barro y los pies en la tierra. Cada metro cuadrado de bioconstrucción, cada semilla plantada y cada residuo transformado es un acto de rebelión contra un sistema que consume el planeta."
                            </p>
                            <p className="text-zinc-400 text-sm">
                                El tiempo de las excusas terminó. O cambiamos la forma en que vivimos, o no habrá mundo para cambiarlo. <span className="text-red-400 font-bold">La Beba es la trinchera.</span>
                            </p>
                        </div>

                        {/* El Territorio */}
                        <div className="mb-8">
                            <h3 className="text-[48px] font-normal text-white font-['Arial'] mb-2">El Territorio</h3>
                            <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-8">Chapadmalal: donde nace todo.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="space-y-4 text-zinc-400 text-[15px] leading-relaxed">
                                    <p>La Abuela Beba es parte activa de la <strong className="text-white">comunidad de Chapadmalal</strong> y sus asambleas vecinales. No somos un proyecto aislado: participamos de la vida barrial, las decisiones colectivas y la defensa del territorio.</p>
                                    <p>Estamos ubicados en <strong className="text-white">Calle 0 entre 815 y 817, Chapadmalal, Buenos Aires</strong> — a solo <strong className="text-emerald-400">100 metros de la bajada de playa</strong> y a pasos de la parada de colectivo local.</p>
                                    <div className="flex flex-wrap gap-3 mt-4">
                                        <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">🏖️ 100m a la playa</span>
                                        <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium">🚌 Parada de colectivo</span>
                                        <span className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-xs font-medium">🏘️ Asambleas vecinales</span>
                                        <span className="px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-full text-pink-400 text-xs font-medium">🌊 Costa atlántica</span>
                                    </div>
                                </div>

                                {/* Mapa embed */}
                                <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 h-[280px]">
                                    <iframe
                                        title="La Abuela Beba - Chapadmalal"
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3145.5!2d-57.68!3d-38.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sLa+Abuela+Beba+-+Chapadmalal!5e0!3m2!1ses!2sar!4v1708100000000"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        allowFullScreen
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                            </div>

                            <a
                                href="https://maps.app.goo.gl/J1DX9mQthirGfjCr9"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all font-bold text-sm tracking-wide shadow-lg shadow-emerald-900/30 hover:scale-105"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                CÓMO LLEGAR
                            </a>
                        </div>
                    </div>
                )}

                {/* Contratos View */}
                {view === 'contratos' && (
                    <div className="animate-fade-in-up max-w-4xl mx-auto">
                        <h2 className="text-[48px] font-normal mb-2 font-['Arial'] text-white">Contratos</h2>
                        <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-12 border-b border-zinc-800 pb-6">Acuerdos de convivencia, estadía y membresía fundadora.</p>

                        {/* Compromiso La Beba */}
                        <div className="bg-gradient-to-r from-emerald-950/50 via-zinc-900 to-emerald-950/50 border border-emerald-500/30 rounded-2xl p-8 mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl"></div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                                    <Shield size={24} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-emerald-400 font-['Arial']">Compromiso La Beba</h3>
                                    <p className="text-zinc-500 text-xs uppercase tracking-widest">Seguridad Jurídica para el Socio</p>
                                </div>
                            </div>
                            <blockquote className="text-xl text-white font-['Calibri'] italic leading-relaxed pl-4 border-l-2 border-emerald-500/50">
                                "Garantía de Satisfacción: Reembolso total ante cualquier disconformidad."
                            </blockquote>
                            <p className="text-zinc-500 text-sm mt-4">Cada socio fundador cuenta con respaldo contractual. Sin letra chica, sin condiciones ocultas. Tu inversión está protegida.</p>
                        </div>

                        {/* Contrato de Convivencia */}
                        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8 mb-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                                    <Users size={18} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white font-['Arial']">Contrato de Convivencia</h3>
                                    <p className="text-zinc-500 text-xs">Reglas básicas para una estadía armoniosa</p>
                                </div>
                            </div>
                            <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
                                <div className="flex gap-3 items-start p-4 bg-black/50 rounded-lg border border-zinc-800">
                                    <span className="text-emerald-500 font-bold text-lg mt-[-2px]">§1</span>
                                    <div><strong className="text-white">Silencio nocturno:</strong> De 23:00 hs a 08:00 hs se respeta el descanso de todos los huéspedes. Los espacios comunes deben mantenerse con volumen bajo o nulo.</div>
                                </div>
                                <div className="flex gap-3 items-start p-4 bg-black/50 rounded-lg border border-zinc-800">
                                    <span className="text-emerald-500 font-bold text-lg mt-[-2px]">§2</span>
                                    <div><strong className="text-white">Visitas externas:</strong> Las visitas deberán ser notificadas con 24hs de anticipación. No se permite el ingreso de personas ajenas sin autorización del administrador del espacio.</div>
                                </div>
                                <div className="flex gap-3 items-start p-4 bg-black/50 rounded-lg border border-zinc-800">
                                    <span className="text-emerald-500 font-bold text-lg mt-[-2px]">§3</span>
                                    <div><strong className="text-white">Limpieza:</strong> Cada huésped/socio es responsable de mantener los espacios que utiliza en condiciones de orden y limpieza. Al retirarse, la cabaña debe quedar barrida y las camas desarregladas. Gestión de basura según el protocolo de reciclaje de La Beba.</div>
                                </div>
                                <div className="flex gap-3 items-start p-4 bg-black/50 rounded-lg border border-zinc-800">
                                    <span className="text-emerald-500 font-bold text-lg mt-[-2px]">§4</span>
                                    <div><strong className="text-white">Mascotas:</strong> Se aceptan mascotas previa consulta. El dueño es responsable de la conducta del animal y de recoger sus desechos.</div>
                                </div>
                            </div>
                        </div>

                        {/* Contrato de Estancia */}
                        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8 mb-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center border border-blue-500/20">
                                    <FileText size={18} className="text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white font-['Arial']">Contrato de Estancia</h3>
                                    <p className="text-zinc-500 text-xs">Datos prácticos para tu estadía</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="p-4 bg-black/50 rounded-lg border border-zinc-800">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">📶 Red Wifi</p>
                                    <p className="text-white font-mono text-lg">Lab EXT</p>
                                    <p className="text-zinc-500 text-xs mt-1">Contraseña: <span className="text-zinc-300 font-mono">laabuelabeba</span></p>
                                </div>
                                <div className="p-4 bg-black/50 rounded-lg border border-zinc-800">
                                    <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">🕐 Horarios</p>
                                    <p className="text-white text-sm"><strong>Check-in:</strong> 14:00 hs</p>
                                    <p className="text-white text-sm"><strong>Check-out:</strong> 10:00 hs</p>
                                    <p className="text-zinc-500 text-xs mt-1">Early check-in sujeto a disponibilidad</p>
                                </div>
                            </div>
                            <div className="space-y-3 text-zinc-400 text-sm">
                                <p>📍 <strong className="text-white">Ubicación:</strong> Calle 0 entre 815 y 817, Chapadmalal, Buenos Aires. <a href="https://maps.app.goo.gl/J1DX9mQthirGfjCr9" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Cómo llegar →</a></p>
                                <p>🔋 <strong className="text-white">Energía:</strong> El espacio funciona parcialmente con energía solar. Se solicita uso responsable de la electricidad.</p>
                                <p>🚿 <strong className="text-white">Agua caliente:</strong> Disponible según la capacidad del termotanque solar. Se recomienda el uso consciente del recurso.</p>
                            </div>
                        </div>

                        {/* Contrato Fundador */}
                        <div className="bg-gradient-to-br from-zinc-900 via-yellow-950/10 to-zinc-900 border border-yellow-500/20 rounded-xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center border border-yellow-500/20">
                                    <Shield size={18} className="text-yellow-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-yellow-400 font-['Arial']">Contrato de Socio Fundador</h3>
                                    <p className="text-zinc-500 text-xs">Acuerdo de Membresía Gold — Token #1-30</p>
                                </div>
                            </div>
                            <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
                                <p>Al adquirir un Token de Socio Fundador, el titular accede a los siguientes beneficios de forma <strong className="text-white">vitalicia</strong>:</p>
                                <ul className="space-y-2 ml-4">
                                    <li className="flex gap-2 items-start"><span className="text-yellow-500">✦</span> Acceso al espacio La Beba con <strong className="text-white">90% de descuento</strong> en estadías.</li>
                                    <li className="flex gap-2 items-start"><span className="text-yellow-500">✦</span> Participación con voz y voto en las asambleas de la comunidad.</li>
                                    <li className="flex gap-2 items-start"><span className="text-yellow-500">✦</span> Acceso exclusivo al Área de Socios digital (documentos, avances, fotos).</li>
                                    <li className="flex gap-2 items-start"><span className="text-yellow-500">✦</span> Placa con nombre en el "Muro de Fundadores" de la casa.</li>
                                    <li className="flex gap-2 items-start"><span className="text-yellow-500">✦</span> Prioridad de reserva en temporada alta.</li>
                                </ul>

                                {/* Cláusula de Reembolso */}
                                <div className="mt-6 p-5 bg-yellow-500/5 border border-yellow-500/15 rounded-xl">
                                    <h4 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                                        <AlertCircle size={16} /> Cláusula de Reembolso Total
                                    </h4>
                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                        En caso de que el Socio Fundador manifieste <strong className="text-white">disconformidad</strong> con el proyecto, el espacio o la gestión dentro de los primeros <strong className="text-white">12 meses</strong> desde la adquisición del token, La Abuela Beba se compromete a realizar el <strong className="text-yellow-400">reembolso total del monto abonado</strong>, sin necesidad de justificación adicional, en un plazo no mayor a 30 días corridos.
                                    </p>
                                    <p className="text-zinc-500 text-xs mt-3 italic">Esta cláusula refleja nuestro compromiso con la transparencia y la confianza mutua.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Eco-Punto View */}
                {view === 'ecopunto' && (
                    <div className="animate-fade-in-up max-w-4xl mx-auto">
                        <h2 className="text-[48px] font-normal mb-2 font-['Arial'] text-white">Eco-Punto</h2>
                        <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-12 border-b border-zinc-800 pb-6">Gestión de residuos y economía circular.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 hover:border-emerald-500/30 transition-colors">
                                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-3 border border-emerald-500/20">
                                    <span className="text-emerald-400 text-lg">♻️</span>
                                </div>
                                <h4 className="text-white font-bold mb-2">Separación en Origen</h4>
                                <p className="text-zinc-500 text-sm leading-relaxed">Clasificamos todos los residuos: orgánicos al compost, reciclables a la cooperativa local, especiales a su cadena correspondiente.</p>
                            </div>
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 hover:border-yellow-500/30 transition-colors">
                                <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-3 border border-yellow-500/20">
                                    <span className="text-yellow-400 text-lg">🪱</span>
                                </div>
                                <h4 className="text-white font-bold mb-2">Compostaje Activo</h4>
                                <p className="text-zinc-500 text-sm leading-relaxed">Sistema de composteras y lombricompuesto que alimenta la huerta orgánica. Cada huésped puede participar del ciclo.</p>
                            </div>
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/30 transition-colors">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mb-3 border border-blue-500/20">
                                    <span className="text-blue-400 text-lg">🎨</span>
                                </div>
                                <h4 className="text-white font-bold mb-2">Arte desde el Residuo</h4>
                                <p className="text-zinc-500 text-sm leading-relaxed">Talleres de reutilización creativa: mosaicos con vidrio, muebles con pallets y esculturas con materiales recuperados.</p>
                            </div>
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 hover:border-pink-500/30 transition-colors">
                                <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center mb-3 border border-pink-500/20">
                                    <span className="text-pink-400 text-lg">📊</span>
                                </div>
                                <h4 className="text-white font-bold mb-2">Impacto Medible</h4>
                                <p className="text-zinc-500 text-sm leading-relaxed">Llevamos métricas reales: kilos de residuos evitados, litros de compost generado y huella de carbono reducida por estadía.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sostenibilidad View */}
                {view === 'sostenibilidad' && (
                    <div className="animate-fade-in-up max-w-4xl mx-auto">
                        <h2 className="text-[48px] font-normal mb-2 font-['Arial'] text-white">Sostenibilidad</h2>
                        <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-12 border-b border-zinc-800 pb-6">Energía, agua y recursos conscientes.</p>
                        <div className="space-y-6">
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8">
                                <h3 className="text-xl font-bold text-white font-['Arial'] mb-4">🔋 Energía Solar</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">Paneles solares para iluminación, carga de dispositivos y termotanque. En La Beba el sol trabaja para vos.</p>
                            </div>
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8">
                                <h3 className="text-xl font-bold text-white font-['Arial'] mb-4">💧 Recolección de Agua</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">Sistema de captación de agua de lluvia para riego de la huerta y uso sanitario. Cada gota cuenta.</p>
                            </div>
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8">
                                <h3 className="text-xl font-bold text-white font-['Arial'] mb-4">🌿 Huerta Orgánica</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">Producción local de verduras, aromáticas y frutales. El desayuno sale del jardín.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Surf View */}
                {view === 'surf' && (
                    <div className="animate-fade-in-up max-w-4xl mx-auto">
                        <h2 className="text-[48px] font-normal mb-2 font-['Arial'] text-white">Surf</h2>
                        <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-12 border-b border-zinc-800 pb-6">A 100 metros del mar, la ola te espera.</p>
                        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8 mb-6">
                            <div className="flex flex-wrap gap-3 mb-6">
                                <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">🏖️ 100m a la playa</span>
                                <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium">🏄 Escuela de surf</span>
                                <span className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-xs font-medium">🌅 Atardeceres épicos</span>
                            </div>
                            <div className="space-y-4 text-zinc-400 text-sm leading-relaxed">
                                <p>La Beba está ubicada a <strong className="text-white">100 metros de la bajada de playa</strong> de Chapadmalal. El spot es ideal para principiantes y surfistas intermedios, con olas consistentes de noviembre a abril.</p>
                                <p>Coordinamos con <strong className="text-white">escuelas de surf locales</strong> para que los socios y huéspedes accedan a clases con descuento. Guardamos tablas y wetsuits en el espacio.</p>
                                <p>Para los que no surfean: caminatas por la costa, pesca recreativa y contemplar el océano desde el fogón de la noche.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Casa Alternativa View */}
                {view === 'casa' && (
                    <div className="animate-fade-in-up max-w-4xl mx-auto">
                        <h2 className="text-[48px] font-normal mb-2 font-['Arial'] text-white">Casa Alternativa</h2>
                        <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-12 border-b border-zinc-800 pb-6">Bioconstrucción y vida comunitaria.</p>
                        <div className="space-y-6">
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8">
                                <h3 className="text-xl font-bold text-white font-['Arial'] mb-4">🏗️ Bioconstrucción</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed mb-4">Paredes de barro y paja, techos verdes, cimientos con materiales reciclados. Cada estructura fue levantada con las manos de voluntarios y socios.</p>
                                <p className="text-zinc-400 text-sm leading-relaxed">Las técnicas incluyen: <strong className="text-white">adobe</strong>, <strong className="text-white">quincha</strong>, <strong className="text-white">superadobe</strong> y <strong className="text-white">bahareque</strong>. Cada pared respira y regula la temperatura de forma natural.</p>
                            </div>
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8">
                                <h3 className="text-xl font-bold text-white font-['Arial'] mb-4">🤝 Voluntariado</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">Recibimos voluntarios de todo el mundo a través de plataformas como Workaway y WorldPackers. Se intercambian 4 horas de trabajo diario por alojamiento y comidas.</p>
                            </div>
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-8">
                                <h3 className="text-xl font-bold text-white font-['Arial'] mb-4">🔥 Fogón Comunitario</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">El corazón de La Beba. Cada noche, el fogón reúne historias, música y conversación. Es el espacio donde nacen las ideas y se fortalece la comunidad.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Territorio View */}
                {view === 'territorio' && (
                    <div className="animate-fade-in-up max-w-4xl mx-auto">
                        <h2 className="text-[48px] font-normal mb-2 font-['Arial'] text-white">El Territorio</h2>
                        <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-8">Chapadmalal: donde nace todo.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-4 text-zinc-400 text-[15px] leading-relaxed">
                                <p>La Abuela Beba es parte activa de la <strong className="text-white">comunidad de Chapadmalal</strong> y sus asambleas vecinales. No somos un proyecto aislado: participamos de la vida barrial, las decisiones colectivas y la defensa del territorio.</p>
                                <p>Estamos ubicados en <strong className="text-white">Calle 0 entre 815 y 817, Chapadmalal, Buenos Aires</strong> — a solo <strong className="text-emerald-400">100 metros de la bajada de playa</strong> y a pasos de la parada de colectivo local.</p>
                                <div className="flex flex-wrap gap-3 mt-4">
                                    <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-medium">🏖️ 100m a la playa</span>
                                    <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium">🚌 Parada de colectivo</span>
                                    <span className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-xs font-medium">🏘️ Asambleas vecinales</span>
                                    <span className="px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 rounded-full text-pink-400 text-xs font-medium">🌊 Costa atlántica</span>
                                </div>
                            </div>
                            <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 h-[280px]">
                                <iframe
                                    title="La Abuela Beba - Chapadmalal"
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3145.5!2d-57.68!3d-38.2!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sLa+Abuela+Beba+-+Chapadmalal!5e0!3m2!1ses!2sar!4v1708100000000"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </div>

                        <a
                            href="https://maps.app.goo.gl/J1DX9mQthirGfjCr9"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-all font-bold text-sm tracking-wide shadow-lg shadow-emerald-900/30 hover:scale-105"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            CÓMO LLEGAR
                        </a>
                    </div>
                )}

                {/* Profile View */}
                {view === 'profile' && (
                    <div className="animate-fade-in-up max-w-4xl mx-auto">
                        <h2 className="text-[48px] font-normal mb-2 font-['Arial'] text-white">Mi Perfil</h2>
                        <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-12 border-b border-zinc-800 pb-6">Gestiona tu información personal y membresía.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="md:col-span-2 space-y-6">
                                <div className="bg-zinc-900/50 border border-zinc-800/50 p-8 rounded-2xl backdrop-blur-sm">
                                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                        <User className="text-emerald-500" size={20} /> Información Personal
                                    </h3>

                                    <div className="grid grid-cols-2 gap-y-8 gap-x-4">
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Nombre Completo</p>
                                            <p className="text-lg text-white font-light">{user.full_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Email</p>
                                            <p className="text-lg text-white font-light">{user.email}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Rol</p>
                                            <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold tracking-wide">
                                                {user.role}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Miembro Desde</p>
                                            <p className="text-lg text-white font-light">Feb 2026</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Token Status Card */}
                            <div>
                                <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 p-8 rounded-2xl text-center relative overflow-hidden h-full">
                                    {token && token.is_owner ? (
                                        <>
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-amber-300 to-yellow-600"></div>
                                            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/20 animate-pulse-slow">
                                                <Leaf className="text-yellow-500" size={32} />
                                            </div>
                                            <h3 className="text-xl font-bold text-white mb-1">Socio Fundador</h3>
                                            <p className="text-amber-400/80 text-sm font-medium mb-6 tracking-widest uppercase">Nivel Gold</p>

                                            <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg p-4 mb-4">
                                                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Token Code</p>
                                                <p className="text-2xl font-mono text-white tracking-widest">{token.token_code}</p>
                                            </div>
                                            <button onClick={() => setView('tokens')} className="text-sm text-zinc-400 hover:text-white underline decoration-zinc-700 underline-offset-4 transition-all">Ver beneficios</button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-700">
                                                <Leaf className="text-zinc-600" size={32} />
                                            </div>
                                            <h3 className="text-xl font-bold text-zinc-400 mb-2">Sin Membresía</h3>
                                            <p className="text-zinc-500 text-sm mb-6">Aún no posees un Token de Socio Fundador.</p>
                                            <button onClick={() => navigate('/tokens')} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-full transition-all">
                                                ADQUIRIR TOKEN
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents View */}
                {view === 'documents' && (
                    <div className="animate-fade-in-up max-w-4xl mx-auto">
                        <h2 className="text-[48px] font-normal mb-2 font-['Arial'] text-white">Documentos</h2>
                        <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-12 border-b border-zinc-800 pb-6">Archivos importantes para miembros de la comunidad.</p>

                        <div className="grid grid-cols-1 gap-4">
                            {documents.map((doc) => (
                                <div key={doc.id} className="group bg-zinc-900/30 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60 p-6 rounded-xl flex items-center justify-between transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
                                            <FileText className="text-red-400" size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{doc.name}</h4>
                                            <p className="text-sm text-zinc-500">{doc.type} • {doc.size}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(doc.name)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700 text-zinc-400 text-sm hover:border-emerald-500/50 hover:text-white hover:bg-emerald-500/10 transition-all"
                                    >
                                        <Download size={16} /> <span className="hidden sm:inline">Descargar</span>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex gap-3 text-yellow-500/80 text-sm">
                            <AlertCircle size={20} className="shrink-0" />
                            <p>Recuerda que estos documentos son confidenciales y exclusivos para socios de La Beba.</p>
                        </div>
                    </div>
                )}

                {/* Noches View */}
                {view === 'noches' && (
                    <div className="animate-fade-in-up max-w-4xl mx-auto">
                        <h2 className="text-[48px] font-normal mb-2 font-['Arial'] text-white">Gestión de Noches</h2>
                        <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-12 border-b border-zinc-800 pb-6">Administra tus noches prepagas, usalas o compartilas.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Balance Card */}
                            <div className="bg-gradient-to-br from-emerald-950/20 to-zinc-900 border border-emerald-500/20 p-8 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-colors"></div>
                                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4">Noches a Favor</h3>
                                <div className="flex items-baseline gap-3">
                                    <span className="text-6xl font-bold text-white leading-none">
                                        {user.prepaid_nights || 0}
                                    </span>
                                    <span className="text-zinc-500 text-xl font-light">noches</span>
                                </div>
                                <div className="mt-8 pt-6 border-t border-emerald-500/10">
                                    <p className="text-zinc-400 text-xs italic leading-relaxed">
                                        Estas noches fueron adquiridas a tarifa promocional. Recordá que podés fijar fechas con un pre-aviso de 10 días.
                                    </p>
                                </div>
                            </div>

                            {/* Rules Card */}
                            <div className="bg-zinc-900/50 border border-zinc-800/80 p-8 rounded-2xl">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Reglas de Uso</h3>
                                <ul className="space-y-3 text-xs text-zinc-400">
                                    <li className="flex gap-2 items-start"><span className="text-emerald-500">✔</span> Validez de 6 meses a precio de compra.</li>
                                    <li className="flex gap-2 items-start"><span className="text-emerald-500">✔</span> Uso parcial permitido (ej: tenés 10, usás 4).</li>
                                    <li className="flex gap-2 items-start"><span className="text-orange-500">!</span> Recargo del 30% sobre tarifa vigente pasados los 6 meses.</li>
                                    <li className="flex gap-2 items-start"><span className="text-emerald-500">✔</span> Transferibles entre miembros de la comunidad.</li>
                                </ul>
                            </div>
                        </div>

                        {/* Assign Dates Form (NEW) */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl mb-12">
                            <div className="p-8 border-b border-zinc-900 flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white font-['Arial'] mb-1">Asignar Estadía</h3>
                                    <p className="text-zinc-500 text-sm">Fijá las fechas de tus noches prepagas a favor.</p>
                                </div>
                                <Calendar className="text-emerald-500" size={32} />
                            </div>
                            
                            {assignSuccess ? (
                                <div className="p-12 text-center space-y-4">
                                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle2 size={32} className="text-emerald-400" />
                                    </div>
                                    <h4 className="text-2xl font-bold text-white">Solicitud Enviada</h4>
                                    <p className="text-zinc-400 max-w-sm mx-auto">Tu pedido bajó al sistema de administración. El admin revisará la disponibilidad y te confirmará por mail en breve.</p>
                                    <button 
                                        onClick={() => setAssignSuccess(false)}
                                        className="mt-4 px-8 py-2 border border-zinc-700 text-zinc-400 rounded-full hover:text-white transition-colors"
                                    >
                                        Hacer otra solicitud
                                    </button>
                                </div>
                            ) : (
                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Modalidad</label>
                                            <select 
                                                value={assignRoomType}
                                                onChange={(e) => setAssignRoomType(e.target.value as any)}
                                                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-emerald-500/50 transition-all outline-none text-sm appearance-none"
                                            >
                                                <option value="compartido">Cuarto Compartido (1 Cama)</option>
                                                <option value="privada">Cuarto Privado (Completo)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Fecha de Ingreso</label>
                                            <DatePicker
                                                selected={assignCheckIn}
                                                onChange={(date: Date | null) => setAssignCheckIn(date)}
                                                minDate={new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000)} // 10 days notice
                                                placeholderText="Elegí fecha (+10 días)"
                                                dateFormat="dd/MM/yyyy"
                                                locale="es"
                                                className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-emerald-500/50 transition-all outline-none text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Cant. de Noches</label>
                                            <div className="flex items-center gap-4 bg-black border border-zinc-800 rounded-xl px-4 py-1">
                                                <button 
                                                    onClick={() => setAssignNights(Math.max(1, assignNights - 1))}
                                                    className="text-zinc-500 hover:text-white transition-colors p-2"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="flex-1 text-center font-bold text-white text-base">{assignNights}</span>
                                                <button 
                                                    onClick={() => setAssignNights(Math.min(user.prepaid_nights || 30, assignNights + 1))}
                                                    className="text-emerald-500 hover:text-emerald-400 transition-colors p-2"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex gap-3 text-zinc-500 text-xs italic">
                                        <Info size={16} className="shrink-0 text-emerald-500" />
                                        <p>La asignación queda sujeta a aprobación del admin según disponibilidad. Te recomendamos fijar fechas con la mayor antelación posible.</p>
                                    </div>

                                    <button 
                                        disabled={!assignCheckIn || assignSubmitting}
                                        onClick={async () => {
                                            setAssignSubmitting(true);
                                            try {
                                                // Simulación de envío a sistema de admin
                                                // En un caso real: POST a /api/solicitudes con tipo 'asignacion_prepago'
                                                const checkOutDate = new Date(assignCheckIn!.getTime() + assignNights * 86400000);
                                                const body = {
                                                    nombre: user.full_name,
                                                    dni: user.dni || '',
                                                    email: user.email,
                                                    tipo_habitacion: assignRoomType,
                                                    check_in: assignCheckIn?.toISOString().split('T')[0],
                                                    check_out: checkOutDate.toISOString().split('T')[0],
                                                    noches: assignNights,
                                                    es_asignacion_prepago: true
                                                };
                                                
                                                await fetch('/api/solicitudes', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify(body)
                                                });
                                                
                                                setAssignSuccess(true);
                                            } catch (e) {
                                                console.error(e);
                                                alert("Error al enviar solicitud. Reintentá en unos minutos.");
                                            } finally {
                                                setAssignSubmitting(false);
                                            }
                                        }}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                                    >
                                        {assignSubmitting ? 'ENVIANDO...' : 'SOLICITAR ASIGNACIÓN DE FECHAS'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Transfer Form */}
                        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-zinc-900">
                                <h3 className="text-xl font-bold text-white font-['Arial'] mb-1">Transferir Noches</h3>
                                <p className="text-zinc-500 text-sm">Regalá o enviá noches a otro cliente o socio.</p>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold ml-1">Destinatario (Email o DNI)</label>
                                        <input 
                                            type="text" 
                                            placeholder="ej: nombre@email.com o 35123445"
                                            className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:border-emerald-500/50 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase tracking-widest text-zinc-500 font-bold ml-1">Cantidad de Noches</label>
                                        <div className="flex items-center gap-4 bg-black border border-zinc-800 rounded-xl px-4 py-1.5">
                                            <button className="text-zinc-500 hover:text-white transition-colors p-2"><Minus size={18} /></button>
                                            <span className="flex-1 text-center font-bold text-white text-lg">1</span>
                                            <button className="text-emerald-500 hover:text-emerald-400 transition-colors p-2"><Plus size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button 
                                        onClick={() => alert('¡Transferencia procesada! (Simulación)')}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-[0.98]"
                                    >
                                        CONFIRMAR ENVÍO DE NOCHES
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Transactions (Fake) */}
                        <div className="mt-12 space-y-4">
                            <h3 className="text-sm font-bold text-zinc-600 uppercase tracking-widest ml-1">Actividad Reciente</h3>
                            {[
                                { date: '21 Mar 2026', desc: 'Compra 10 noches (PROMO 50%)', type: 'in', val: '+10' },
                                { date: '15 Mar 2026', desc: 'Reserva Estancia (Abril)', type: 'out', val: '-4' },
                            ].map((tx, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                                    <div>
                                        <p className="text-white text-sm font-medium">{tx.desc}</p>
                                        <p className="text-zinc-600 text-[10px] uppercase font-bold">{tx.date}</p>
                                    </div>
                                    <span className={`font-bold ${tx.type === 'in' ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                        {tx.val} noches
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tokens View Placeholder */}
                {view === 'tokens' && (
                    <div className="animate-fade-in-up max-w-4xl mx-auto text-center py-20">
                        <h2 className="text-[48px] font-normal mb-4 font-['Arial'] text-white">Mis Tokens</h2>
                        <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-8">Gestión de activos digitales y beneficios.</p>
                        <button onClick={() => navigate('/tokens')} className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full transition-all border border-zinc-700 hover:border-zinc-500">
                            Ir al Panel de Tokens Completo
                        </button>
                    </div>
                )}

                {/* Gallery View */}
                {view === 'gallery' && (
                    <div className="animate-fade-in-up max-w-6xl mx-auto">
                        <h2 className="text-[48px] font-normal mb-2 font-['Arial'] text-white">Avances y Fotos</h2>
                        <p className="text-[22px] text-zinc-400 font-['Calibri'] italic mb-8">Seguí de cerca cada etapa del proyecto.</p>

                        {/* Category Filter */}
                        <div className="flex gap-2 mb-8">
                            {['', 'Obra', 'Entorno', 'Social'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setGalleryCat(cat)}
                                    className={`px-5 py-2 rounded-full text-sm font-medium border transition-all ${galleryCat === cat
                                        ? 'bg-emerald-600 border-emerald-500 text-white'
                                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
                                        }`}
                                >
                                    {cat || 'Todas'}
                                </button>
                            ))}
                        </div>

                        {/* Photo Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {gallery.map((item: any) => (
                                <div
                                    key={item.id}
                                    onClick={() => setLightbox(item.imagen_url)}
                                    className="group relative aspect-square bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-emerald-500/50 cursor-pointer transition-all hover:shadow-lg hover:shadow-emerald-900/20"
                                >
                                    <img src={item.imagen_url} alt={item.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${item.categoria === 'Obra' ? 'bg-yellow-500/20 text-yellow-400' :
                                            item.categoria === 'Entorno' ? 'bg-emerald-500/20 text-emerald-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>{item.categoria}</span>
                                        <p className="text-white text-xs mt-1 truncate">{item.titulo}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {gallery.length === 0 && (
                            <div className="p-16 text-center bg-zinc-900/50 border border-zinc-800 rounded-xl">
                                <Camera className="mx-auto text-zinc-700 mb-4" size={48} />
                                <p className="text-zinc-400 text-lg">Aún no hay fotos en esta categoría.</p>
                                <p className="text-zinc-600 text-sm mt-2">El equipo de La Beba irá subiendo avances del proyecto.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Lightbox */}
                {lightbox && (
                    <div
                        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fade-in"
                        onClick={() => setLightbox(null)}
                    >
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute top-6 right-6 text-white/60 hover:text-white p-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700 transition-all z-10"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={lightbox}
                            alt="Full size"
                            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )}

            </main>
        </div>
    );
};

export default MemberProfile;

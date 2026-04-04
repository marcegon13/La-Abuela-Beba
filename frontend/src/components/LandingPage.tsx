import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ShoppingBag, X, ArrowRight, HeartHandshake, Instagram, Facebook, Mail } from 'lucide-react';
import MediaSlider from './MediaSlider';
import BookingModal from './BookingModal';
import ProveeduriaModal from './ProveeduriaModal';
import ChatBot from './ChatBot';
import WordCycle from './WordCycle';

const LandingPage = () => {
    const navigate = useNavigate();
    const [scrollY, setScrollY] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [proveeduriaOpen, setProveeduriaOpen] = useState(false);
    const [showVoluntaryTasks, setShowVoluntaryTasks] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    interface MediaItem {
        type: 'image' | 'video';
        src: string;
        label?: string;
    }

    const [lightboxItems, setLightboxItems] = useState<MediaItem[]>([]);

    const openLightbox = (items: MediaItem[]) => {
        setLightboxItems(items);
        setLightboxOpen(true);
    };

    // Section 1: HERO BACKGROUND (Videos from the header folder)
    const heroMedia: MediaItem[] = [
        { type: 'video', src: '/assets/videos%20y%20fotos%20de%20header/dron2_comprimido.MP4', label: 'Vistas Aéreas' },
        { type: 'video', src: '/assets/videos%20y%20fotos%20de%20header/video_header_top.mp4', label: 'La Beba - Experiencia' },
        { type: 'video', src: '/assets/videos%20y%20fotos%20de%20header/IMG_2232.MOV', label: 'La Beba - Atardecer' },
    ];

    // Mini-Gallery 1: Huerta
    const huertaMedia: MediaItem[] = [
        { type: 'image', src: '/assets/Huerta organica/cultivo.png' },
        { type: 'image', src: '/assets/Huerta organica/huerta2.png' },
        { type: 'image', src: '/assets/Huerta organica/huerta3.png' },
        { type: 'image', src: '/assets/Huerta organica/huerta4.png' },
        { type: 'image', src: '/assets/Huerta organica/IMG_1947.jpeg' },
        { type: 'image', src: '/assets/Huerta organica/IMG-20240112-WA0008.jpg' },
        { type: 'image', src: '/assets/Huerta organica/cultivo3.png' },
        { type: 'image', src: '/assets/Huerta organica/Captura de pantalla 2026-02-14 233014.png' },
        { type: 'image', src: '/assets/Huerta organica/Captura de pantalla 2026-02-14 233219.png' },
        { type: 'image', src: '/assets/Huerta organica/Captura de pantalla 2026-02-14 234201.png' },
    ];

    // Mini-Gallery 2: Bioconstrucción
    const bioMedia: MediaItem[] = [
        { type: 'image', src: '/assets/bioconstruccion/bio.png' },
        { type: 'image', src: '/assets/bioconstruccion/bio1.jpeg' },
        { type: 'image', src: '/assets/bioconstruccion/bio2.jpeg' },
        { type: 'image', src: '/assets/bioconstruccion/bio2.png' },
        { type: 'image', src: '/assets/bioconstruccion/bio3.jpeg' },
        { type: 'image', src: '/assets/bioconstruccion/bio4.jpeg' },
        { type: 'image', src: '/assets/bioconstruccion/bio5.jpeg' },
    ];

    // Mini-Gallery 3: Residuos
    const residuoMedia: MediaItem[] = [
        { type: 'image', src: '/assets/reciclado/reciclado.png' },
        { type: 'image', src: '/assets/reciclado/reciclado.jpg' },
        { type: 'image', src: '/assets/reciclado/img1.png' },
    ];

    // Mini-Gallery 4: Paisajes (Contains Paisaje 3 video here exclusively)
    const paisajesMiniMedia: MediaItem[] = [
        { type: 'video', src: '/assets/paisaje y naturaleza/paisaje3.mp4' },
        { type: 'video', src: '/assets/paisaje y naturaleza/paisaje1.MOV' },
        { type: 'image', src: '/assets/paisaje y naturaleza/naturaleza.jpeg' },
        { type: 'image', src: '/assets/paisaje y naturaleza/naturaleza2.jpg' },
        { type: 'image', src: '/assets/paisaje y naturaleza/paisaje 2.jpeg' },
        { type: 'image', src: '/assets/paisaje y naturaleza/surf.png' },
    ];


    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500 selection:text-white font-sans overflow-x-hidden">
            {/* Navbar Overlay */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-transparent py-4'}`}>
                <div className="container mx-auto px-6 flex justify-between items-center">
                    {/* Brand Name Left */}
                    <div className={`text-xl font-bold tracking-tight opacity-0 transition-opacity duration-500 ${scrollY > 50 ? 'opacity-100' : 'md:opacity-0'}`}>
                        LA ABUELA BEBA
                    </div>

                    {/* Buttons Right */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setBookingOpen(true)}
                            className="px-3 py-1.5 md:px-5 md:py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white transition-all duration-300 text-xs md:text-sm tracking-wide font-bold shadow-lg shadow-emerald-900/30 hover:scale-105"
                        >
                            <span className="hidden md:inline">RESERVAR AHORA</span>
                            <span className="md:hidden">RESERVAR</span>
                        </button>
                        <button
                            onClick={() => {
                                const token = localStorage.getItem('user_token');
                                const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
                                if (!token) {
                                    navigate('/login');
                                } else if (userInfo.role === 'ADMIN') {
                                    navigate('/dashboard/admin');
                                } else {
                                    navigate('/dashboard/socio');
                                }
                            }}
                            className="px-3 py-1.5 md:px-5 md:py-2 rounded-full border border-white/20 hover:bg-white/10 transition-all duration-300 text-xs md:text-sm tracking-wide font-medium"
                        >
                            {localStorage.getItem('user_token')
                                ? <><span className="hidden md:inline">MI PANEL</span><span className="md:hidden">PANEL</span></>
                                : <><span className="hidden md:inline">ACCESO SOCIOS</span><span className="md:hidden">SOCIOS</span></>}
                        </button>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <header className="relative w-full h-[80vh] overflow-hidden">
                <MediaSlider
                    items={heroMedia}
                    fullScreen={true}
                    autoPlayInterval={12000}
                    imageFit="cover"
                    showLabel={false}
                    showControls={false}
                    overlayContent={
                        <div className="text-center px-4 animate-fade-in-up w-full max-w-5xl mx-auto flex flex-col items-center justify-center z-40 pointer-events-auto h-full relative pb-20">
                            <div className="mb-4 relative flex items-center justify-center drop-shadow-2xl">
                                <img
                                    src="/assets/logo_beba.png"
                                    alt="La Abuela Beba"
                                    className="w-20 h-20 md:w-36 md:h-36 object-contain mix-blend-multiply brightness-110 contrast-125 drop-shadow-lg"
                                    style={{ mixBlendMode: 'multiply', backgroundColor: 'transparent' }}
                                />
                            </div>

                            <div className="flex flex-col items-center mb-10 drop-shadow-2xl">
                                <h1 className="text-[clamp(28px,6vw,42px)] font-normal tracking-tight text-white mb-0 uppercase drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] font-['Arial'] leading-tight">
                                    LA ABUELA BEBA
                                </h1>
                                <span className="text-[clamp(16px,4vw,20px)] italic text-zinc-100 font-['Calibri'] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1">
                                    Casa alternativa
                                </span>
                            </div>

                            {/* CTA CENTRAL DE RESERVA */}
                            <div className="animate-fade-in-up mt-10 relative" style={{ animationDelay: '0.4s' }}>
                                <button
                                    onClick={() => setBookingOpen(true)}
                                    className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] text-sm rounded-2xl transition-all duration-500 hover:scale-110 shadow-[0_20px_50px_rgba(16,185,129,0.4)] border border-emerald-400/30 group/btn"
                                >
                                    ¡Quiero Reservar! <ArrowRight size={20} className="inline ml-3 transition-transform group-hover/btn:translate-x-2" />
                                </button>
                            </div>
                        </div>
                    }
                />
            </header>

            {/* SWITCHTRIPS PREMIUM BANNER */}
            <section className="bg-black py-4 border-b border-white/5">
                <div
                    onClick={() => navigate('/switchtrips')}
                    className="container mx-auto px-4 md:px-6 cursor-pointer group"
                >
                    <div className="relative overflow-hidden rounded-[32px] min-h-[400px] md:min-h-[350px] flex items-center border border-white/10 shadow-2xl transition-all duration-700 hover:border-orange-500/40">
                        <div className="absolute inset-0 z-0">
                            <MediaSlider
                                items={[
                                    { type: 'video', src: '/assets/Bariloche - Cerro Tronador.mp4' },
                                    { type: 'video', src: '/assets/El Salvador - El Zonte.mp4' },
                                    { type: 'video', src: '/assets/video_Salvador.mp4' },
                                    { type: 'video', src: '/assets/Playas del Caribe Costa Rica.mp4' }
                                ]}
                                fullScreen={false}
                                autoPlayInterval={8000}
                                showControls={false}
                                showLabel={false}
                                imageFit="cover"
                                bgColor="bg-black"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10"></div>
                            <div className="absolute inset-0 bg-orange-500/5 mix-blend-overlay z-10"></div>
                        </div>

                        <div className="relative z-10 w-full p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                                <div className="relative">
                                    <div className="absolute -inset-2 bg-white/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <img src="/assets/logo_switchtrip.png" alt="SwitchTrips" className="relative w-24 md:w-32 rounded-2xl shadow-2xl border border-white/5 transition-transform group-hover:scale-105" />
                                </div>
                                <div>
                                    <div className="flex items-center justify-center md:justify-start gap-4 mb-3">
                                        <span className="text-zinc-300 text-xs font-bold tracking-[0.3em] uppercase">Temporada 2025 - 2026</span>
                                    </div>
                                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 italic uppercase leading-none drop-shadow-2xl">
                                        VIAJÁ CON <span className="text-orange-500">NOSOTROS.</span>
                                    </h2>
                                    <p className="text-zinc-200 text-[10px] md:text-sm max-w-lg leading-relaxed font-bold drop-shadow-lg uppercase tracking-[0.1em]">
                                        "Conectamos personas, culturas y pasiones a través del deporte y la naturaleza"
                                    </p>
                                </div>
                            </div>

                            <button className="flex items-center gap-3 px-10 py-5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all duration-500 group-hover:bg-orange-500 group-hover:scale-110 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                Explorar Destinos <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* VIVILO EN LA BEBA GALLERIES */}
            <section id="vivilo-section" className="py-8 bg-zinc-950 relative">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div onClick={() => openLightbox(huertaMedia)} className="cursor-pointer transition-transform hover:scale-[1.02] rounded-xl overflow-hidden border border-emerald-900/30 shadow-lg shadow-emerald-900/10 aspect-[4/3] bg-zinc-900">
                            <MediaSlider items={huertaMedia} imageFit="cover" fullScreen={false} showControls={true} showLabel={true} />
                        </div>
                        <div onClick={() => openLightbox(bioMedia)} className="cursor-pointer transition-transform hover:scale-[1.02] rounded-xl overflow-hidden border border-emerald-900/30 shadow-lg shadow-emerald-900/10 aspect-[4/3] bg-zinc-900">
                            <MediaSlider items={bioMedia} imageFit="cover" fullScreen={false} showControls={true} showLabel={true} />
                        </div>
                        <div onClick={() => openLightbox(residuoMedia)} className="cursor-pointer transition-transform hover:scale-[1.02] rounded-xl overflow-hidden border border-emerald-900/30 shadow-lg shadow-emerald-900/10 aspect-[4/3] bg-zinc-900">
                            <MediaSlider items={residuoMedia} imageFit="cover" fullScreen={false} showControls={true} showLabel={true} />
                        </div>
                        <div onClick={() => openLightbox(paisajesMiniMedia)} className="cursor-pointer transition-transform hover:scale-[1.02] rounded-xl overflow-hidden border border-emerald-900/30 shadow-lg shadow-emerald-900/10 aspect-[4/3] bg-zinc-900">
                            <MediaSlider items={paisajesMiniMedia} imageFit="cover" fullScreen={false} showControls={true} showLabel={true} />
                        </div>
                    </div>
                </div>
            </section>

            {/* EL ESPACIO & NOSOTROS */}
            <section id="info-espacio" className="py-12 bg-zinc-950 border-y border-white/5">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        {/* Acerca de nosotros */}
                        <div className="space-y-8 animate-fade-in">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Acerca de nosotros</span>
                            </div>
                            <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
                                Proyectando <br /> <span className="text-emerald-500">Alternativas.</span>
                            </h2>
                            <div className="space-y-6 text-zinc-300 font-['Calibri'] text-lg leading-relaxed">
                                <p>
                                    <strong className="text-white">La Abuela Beba</strong> es un espacio autogestivo y cultural, gestionado por y para la comunidad con el objetivo de ofrecer una propuesta turística alternativa y económica. <span className="text-emerald-400 italic font-bold">¡Buena, bonita y barata!</span>
                                </p>
                            </div>
                        </div>

                        {/* Info Útil / Features */}
                        <div className="bg-zinc-900/40 border border-white/5 p-10 rounded-[40px] relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-8">Información Útil</h3>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5 text-lg">🗓️</div>
                                    <p className="text-zinc-300 text-sm"><strong className="text-white text-base">Abiertos todo el año:</strong> vení a disfrutar de Chapadmalal en cualquier estación.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5 text-lg">🏠</div>
                                    <p className="text-zinc-300 text-sm">Habitaciones compartidas de <strong className="text-white">2/3 y 8 personas</strong> (todas con calefacción para el invierno).</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5 text-lg">🚿</div>
                                    <p className="text-zinc-300 text-sm">Baño con agua caliente compartido y <strong className="text-white">ducha exterior de playa</strong> para el post-surf.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5 text-lg">👨‍🍳</div>
                                    <p className="text-zinc-300 text-sm">Cocina compartida equipada: vajilla completa, cocina industrial de <strong className="text-white">6 hornallas</strong>, horno y heladera.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5 text-lg">🚍</div>
                                    <p className="text-zinc-300 text-sm">Ubicación estratégica: a <strong className="text-white">100m</strong> de la playa, frente a parada local y a <strong className="text-white">400m</strong> de parada de larga distancia.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5 text-lg">🍂</div>
                                    <p className="text-zinc-300 text-sm">El predio es <strong className="text-white">mayormente al aire libre</strong>, invitando al contacto directo con la naturaleza costera.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5 text-lg">📶</div>
                                    <p className="text-zinc-300 text-sm"><strong className="text-white">Wifi:</strong> conectividad en medio del bosque.</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5 text-lg">🧺</div>
                                    <p className="text-zinc-300 text-sm"><strong className="text-white">Proveeduría Local:</strong> alimentos Km 0 y economía circular.</p>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                                <p className="text-emerald-400 font-bold italic">¡Te esperamos! 🌊</p>
                                <div className="flex gap-2">
                                    <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                    <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                    <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* LIGHTBOX */}
            {lightboxOpen && (
                <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
                    <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white hover:text-emerald-400 transition-colors z-[210] p-2 bg-black/50 rounded-full">
                        <X size={24} />
                    </button>
                    <div className="w-full max-w-7xl h-[85vh] flex items-center justify-center relative">
                        <MediaSlider items={lightboxItems} fullScreen={false} imageFit="contain" showControls={true} showLabel={true} bgColor="bg-transparent" />
                    </div>
                </div>
            )}


            {/* COMPROMISO TERRITORIAL */}
            <section id="eco-punto" className="py-12 bg-gradient-to-b from-zinc-950 via-emerald-950/10 to-zinc-950 border-y border-emerald-500/5">
                <div className="container mx-auto px-6">
                    <div className="max-w-5xl mx-auto space-y-16">
                        {/* PROVEEDURÍA */}
                        <div className="flex flex-col md:flex-row gap-12 items-center">
                            <div className="w-full md:w-1/2">
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-emerald-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <img src="/assets/local-consumption.jpg" alt="Proveeduría Local" className="relative rounded-3xl border border-white/10 shadow-2xl object-cover aspect-square md:aspect-video" />
                                </div>
                            </div>
                            <div className="w-full md:w-1/2 space-y-6">
                                <span className="text-emerald-500 font-black tracking-[0.4em] uppercase text-[10px]">Economía Circular</span>
                                <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">Proveeduría <br /> <span className="text-emerald-500">Local</span></h2>
                                <p className="text-zinc-300 text-lg leading-relaxed font-['Calibri']">
                                    Sostenemos una red de más de 20 proveedores locales que nos abastecen de alimentos km 0, productos biodegradables y servicios de proximidad. Apostamos por un consumo que fortalezca el tejido productivo de Chapadmalal.
                                </p>
                                <button onClick={() => setProveeduriaOpen(true)} className="flex items-center gap-3 px-8 py-4 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-900/10">
                                    <ShoppingBag size={18} /> Explorar Productos
                                </button>
                            </div>
                        </div>

                        {/* ECO-PUNTO */}
                        <div className="bg-zinc-900/40 border border-emerald-500/20 rounded-[40px] p-8 md:p-12 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                            <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
                                <div className="w-full md:w-1/3">
                                    <div className="rounded-3xl overflow-hidden border border-emerald-500/20 shadow-2xl aspect-square rotate-2 transition-transform duration-700">
                                        <img src="/assets/ecopunto.jpg" alt="Eco Punto" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                                            <Leaf className="text-emerald-400" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Proyecto Eco-Punto</h3>
                                            <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.2em]">Cerrado — En Reactivación Vecinal</span>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <p className="text-zinc-300 text-sm md:text-base leading-relaxed font-['Calibri']">
                                            El antiguo Eco Punto cerró sus puertas el 01/12/2025. Hoy nos encontramos reuniendo aportes vecinales para reactivarlo en un nuevo espacio público estratégico.
                                        </p>
                                        <p className="text-zinc-300 text-sm leading-relaxed italic border-l-2 border-emerald-500/30 pl-4 py-1">
                                            Contamos con autorización municipal y retiro semanal por cooperativa, pero sin presupuesto oficial.
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-6 items-center pt-8 border-t border-white/5">
                                        <div className="flex-1 w-full space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Fondo Comunitario</span>
                                                <span className="text-emerald-400 font-bold text-lg">$2M Meta</span>
                                            </div>
                                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" style={{ width: '18%' }}></div>
                                            </div>
                                        </div>
                                        <a href="https://wa.me/5491134826691?text=Hola! Quiero sumarme..." target="_blank" rel="noopener noreferrer" className="whitespace-nowrap px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-emerald-900/20">
                                            Sumar mi Aporte
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* IMPACT SECTION */}
            <section className="py-16 bg-zinc-950 border-t border-emerald-500/10">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div className="space-y-12">
                            <div className="space-y-6">
                                <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">Cultura & <br /> <span className="text-emerald-500">Salud Comunitaria</span></h2>
                                <p className="text-zinc-300 text-lg leading-relaxed font-['Calibri']">
                                    Consideramos a la cultura popular como un factor indispensable en la salud comunitaria y mental. Es por eso que recibimos talleristas, artistas, profesionales y mentores todo el año en una búsqueda constante de brindar propuestas de valor cultural gratuitas y abiertas a la comunidad.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { val: '+500', label: 'Huéspedes / año' },
                                    { val: '+2000', label: 'Visitas anuales' },
                                    { val: '+20', label: 'Aliados Locales' },
                                    { val: '+5t', label: 'Residuos Reciclados' }
                                ].map((stat, i) => (
                                    <div key={i} className="p-6 bg-zinc-900/40 border border-white/5 rounded-3xl">
                                        <div className="text-3xl font-black text-white mb-1">{stat.val}</div>
                                        <div className="text-zinc-300 uppercase tracking-[0.2em] text-[9px] font-black">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <WordCycle />
                        </div>
                    </div>
                </div>
            </section>

            {/* VOLUNTARIADO SECTION */}
            <section className="py-16 bg-zinc-950 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                <div className="container mx-auto px-6 relative z-10">
                    <div className="max-w-5xl mx-auto bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-20 shadow-2xl relative group overflow-hidden">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-emerald-900/10 rounded-[40px] blur opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            <div className="lg:col-span-12 space-y-10 text-center">
                                <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mx-auto">
                                    <HeartHandshake size={18} className="text-emerald-400" />
                                    <span className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em]">Cultura de Trabajo y Comunidad</span>
                                </div>

                                <h2 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-[0.9] drop-shadow-2xl">
                                    ¿Querés hacer voluntariado <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-emerald-500">en La Abuela Beba?</span>
                                </h2>

                                <div className="grid grid-cols-1 gap-8 text-left max-w-4xl mx-auto">
                                    {!showVoluntaryTasks ? (
                                        <div className="bg-white/5 p-10 rounded-3xl border border-white/5 space-y-6 text-center">
                                            <p className="text-zinc-300 font-['Calibri'] text-xl leading-relaxed max-w-2xl mx-auto">
                                                El voluntariado es un <strong className="text-white">intercambio por hospedaje</strong> que requiere no solo el cumplimiento de horarios y tareas sino un compromiso con el espacio, <span className="text-emerald-400 italic font-bold">es ponerse la camiseta.</span>
                                            </p>
                                            <p className="text-zinc-400 text-sm italic">
                                                Los voluntariados son de un mes mínimo y le damos prioridad a quienes ya nos han visitado antes (así que apuráte a reservar si aún no lo hiciste).
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-zinc-800/20 p-8 md:p-12 rounded-3xl border border-emerald-500/30 space-y-8 animate-fade-in-up">
                                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                                <div className="flex-1 space-y-4">
                                                    <h4 className="text-white font-black uppercase tracking-widest text-xs border-b border-white/10 pb-4 flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                                        Compromiso y Turnos
                                                    </h4>
                                                    <p className="text-zinc-300 text-sm leading-relaxed">
                                                        Como parte del equipo, vas a cumplir diferentes tareas según el turno asignado. Buscamos personas proactivas, responsables y con ganas de sumar al espacio.
                                                    </p>
                                                </div>
                                                <div className="flex-1 space-y-6">
                                                    <h4 className="text-white font-black uppercase tracking-widest text-xs border-b border-white/10 pb-4">
                                                        Tareas Incluídas
                                                    </h4>
                                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-zinc-300 text-sm">
                                                        <li className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                            Check in / out de huéspedes
                                                        </li>
                                                        <li className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                            Preparación de cuartos
                                                        </li>
                                                        <li className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                            Mantenimiento de huerta
                                                        </li>
                                                        <li className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                                            Limpieza y orden general
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-12 flex flex-col items-center gap-6">
                                    {!showVoluntaryTasks ? (
                                        <button
                                            onClick={() => setShowVoluntaryTasks(true)}
                                            className="relative group/btn overflow-hidden px-16 py-6 bg-white/5 hover:bg-emerald-600 text-white font-black uppercase tracking-[0.3em] text-sm rounded-[24px] transition-all duration-500 border border-white/10"
                                        >
                                            <span className="relative z-10 flex items-center gap-4">
                                                Ver condiciones de postulación <ArrowRight size={22} className="group-hover/btn:translate-x-2 transition-transform" />
                                            </span>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                const token = localStorage.getItem('user_token');
                                                if (!token) {
                                                    navigate('/login');
                                                    return;
                                                }
                                                window.open('https://wa.me/5492234376529?text=Hola! Me gustaría postularme para el voluntariado en La Abuela Beba. Ya estoy registrado en la plataforma y acepto las condiciones.', '_blank');
                                            }}
                                            className="relative group/btn overflow-hidden px-20 py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.3em] text-sm rounded-[24px] transition-all duration-500 hover:scale-105 shadow-[0_25px_60px_rgba(16,185,129,0.35)]"
                                        >
                                            <span className="relative z-10 flex items-center gap-4">
                                                Postúlate acá <ArrowRight size={22} className="group-hover/btn:translate-x-2 transition-transform" />
                                            </span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-emerald-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                                        </button>
                                    )}
                                    <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.3em] opacity-80">
                                        {showVoluntaryTasks ? 'Te redirigiremos a WhatsApp para registrar tu interés' : 'Si ya estás registrado, cargaremos tu registro directamente'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-zinc-950 border-t border-zinc-800">
                <div className="container mx-auto px-6 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <img src="/assets/logo_beba.png" alt="La Abuela Beba" className="w-12 h-12 object-contain brightness-200 invert" />
                                <div>
                                    <h3 className="text-white font-bold text-xl tracking-tight font-['Arial']">LA ABUELA BEBA</h3>
                                    <span className="text-zinc-400 text-sm italic font-['Calibri']">Casa alternativa</span>
                                </div>
                            </div>
                            <p className="text-zinc-400 text-base leading-relaxed font-['Calibri'] italic">
                                Un espacio para pausar tus días sincronizándote con el mar y la naturaleza.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-4">Ubicación</h4>
                            <p className="text-zinc-300 text-base">Calle 0 e/ 815 y 817<br />Chapadmalal, Buenos Aires</p>
                            <div className="mt-4 space-y-2 text-zinc-400 text-sm">
                                <p>Check-in: 14:00 hs</p>
                                <p>Check-out: 10:00 hs</p>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-white font-bold uppercase tracking-widest text-sm mb-4">Conectamos</h4>
                            <div className="flex gap-4">
                                <a href="https://www.instagram.com/laabuelabebaok/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-emerald-600 hover:text-white transition-all duration-300 border border-white/5">
                                    <Instagram size={20} />
                                </a>
                                <a href="https://facebook.com/laabuelabeba" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-emerald-600 hover:text-white transition-all duration-300 border border-white/5">
                                    <Facebook size={20} />
                                </a>
                                <a href="mailto:info@laabuelabeba.cloud" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 hover:bg-emerald-600 hover:text-white transition-all duration-300 border border-white/5">
                                    <Mail size={20} />
                                </a>
                            </div>
                            <div className="mt-6">
                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">WhatsApp</p>
                                <a href="https://wa.me/5491134826691" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-emerald-400 transition-colors font-bold text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> +54 9 11 3482-6691
                                </a>
                            </div>
                        </div>

                    </div>
                    <div className="border-t border-zinc-900 pt-10 flex flex-col items-center justify-center gap-3">
                        <p className="text-zinc-500 text-xs uppercase font-bold tracking-[0.2em]">© {new Date().getFullYear()} La Abuela Beba — Casa Alternativa</p>
                        <p className="text-zinc-500 text-sm italic font-medium">
                            Desarrollado por <a href="https://lanubecomputacion.com" target="_blank" rel="noopener noreferrer" className="text-zinc-200 hover:text-emerald-400 font-black underline underline-offset-4 decoration-emerald-500/50 transition-all text-base ml-1">lanubecomputacion.com</a>
                        </p>
                    </div>
                </div>
            </footer>

            <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
            <ProveeduriaModal isOpen={proveeduriaOpen} onClose={() => setProveeduriaOpen(false)} onBookRoom={() => setBookingOpen(true)} />



            <ChatBot />
        </div>
    );
};

export default LandingPage;

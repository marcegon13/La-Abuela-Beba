import React, { useState, useEffect } from 'react';
import { ChevronLeft, MessageCircle, Info, Calendar, Clock, User, Share2, Copy, Check, Mail, Instagram, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MediaSlider from './MediaSlider';

const TRIPS = [
    {
        id: 'salvador',
        title: 'Epic Casas El Salvador',
        location: '🇸🇻 El Zonte, El Salvador',
        dates: '13 al 20 de Junio 2026',
        duration: '7 Noches',
        price: '1.000',
        status: 'PREVENTA',
        image: '/assets/salvador1.jpg',
        description: 'Vení a vivir la "Surf City" en su estado más puro. Nos hospedamos en las exclusivas Epic Casas, un refugio de diseño bohemio-tropical frente al Pacífico.',
        includes: [
            '7 noches en Epic Casas 🌅',
            'Habits. individuales/compartidas (máx 4 pers) 👥',
            'Transfer in/out aeropuerto 🚕',
            'Desayuno y cena diarios (almuerzo libre) 🍲',
            'Tabla intermedia diaria o 3 clases (principiantes) 🏄‍♂️',
            'Fotos profesionales y regalos sorpresa 📸',
            'Cenas con música en vivo 🎶'
        ],
        extras: ['Ruta del Café ☕', 'Cascadas y Volcanes 🌋', 'Críoterapia 🧊', 'Y más...'],
        notIncluded: [
            'Tickets aéreos (USD 700 ida y vuelta aprox.) ✈️'
        ],
        discounts: [
            '10% OFF pago total al reservar',
            'Grupo 2 personas: 10% OFF',
            'Grupo 3 personas: 15% OFF'
        ],
        plazas: '16 plazas totales (solo 5 en preventa)',
        extraInfo: 'Preventa USD 1.000 (hasta agotar). Precio regular USD 1.350. Se reserva con el 30%. Remanente antes del 01/05.',
        gallery: [
            { src: '/assets/salvador1.jpg', label: '' },
            { src: '/assets/salvador5.jpg', label: 'Retiro Exclusivo' },
            { src: '/assets/comida_salvador.png', label: 'Gastronomía Local' },
            { src: '/assets/salvador2.jpg', label: '' }
        ]
    },
    {
        id: 'costarica',
        title: 'Reborn Experience Costa Rica',
        location: '🇨🇷 Santa Teresa',
        dates: '5 al 11 de Julio 2026',
        duration: '6 Noches',
        price: '1.000',
        status: 'PROGRAMADO',
        image: '/assets/costarica2.jpg',
        description: 'Reconectá con tu esencia en la selva mágica de Santa Teresa. Un viaje de transformación, puravida y surf.',
        includes: [
            'Hospedaje premium', 'Transfer in/out', 'Desayuno y cena saludable',
            'Clases de surf intensivas', 'Retiro de Yoga & Meditación',
            'Contenido creativo', 'Ceremonias al atardecer'
        ],
        gallery: [
            { src: '/assets/cataratas.png', label: 'Naturaleza Pura' },
            { src: '/assets/costarica2.jpg', label: '' },
            { src: '/assets/comida_costarica.png', label: 'Sabor Caribeño' },
            { src: '/assets/costarica5.jpg', label: 'Ocean View' }
        ]
    },
    {
        id: 'bariloche',
        title: 'Snow Trip Bariloche',
        location: '🇦🇷 Cerro Catedral',
        dates: '9 al 16 de Agosto',
        duration: '6 Noches',
        price: '850',
        status: 'PROGRAMADO',
        image: '/assets/nieve.jpeg',
        description: 'Viví la montaña como nunca. Nieve en polvo, refugios de altura y la mejor comunidad en el Cerro Catedral.',
        includes: [
            'Refugio en base Catedral', 'Transfer in/out private',
            'Desayuno y cena incluido', 'Equipos incluidos (tabla, botas y casco)',
            'After-ski sessions'
        ],
        gallery: [
            { src: '/assets/nieve.jpeg', label: '' },
            { src: '/assets/bariloche_ciudad_noche2.png', label: 'Vistas Nocturnas' },
            { src: '/assets/comida_bariloche.png', label: 'Chocolate Artesanal' },
            { src: '/assets/bariloche_ciudad1.png', label: '' }
        ]
    }
];

const SwitchTrips: React.FC = () => {
    const navigate = useNavigate();
    const [selectedTrip, setSelectedTrip] = useState<typeof TRIPS[0] | null>(null);
    const [activeImage, setActiveImage] = useState<string>('');
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [showShareModal, setShowShareModal] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [leadData, setLeadData] = useState({ name: '', lastname: '', age: '', dni: '', howFound: '', guests: '1' });
    const [showPromo, setShowPromo] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowPromo(true);
        }, 1000); // 1 second delay
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (selectedTrip) {
            setActiveImage(selectedTrip.image);
        }
    }, [selectedTrip]);

    useEffect(() => {
        // Auto-fill from localStorage if user is logged in
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setLeadData({
                    name: user.full_name?.split(' ')[0] || '',
                    lastname: user.full_name?.split(' ').slice(1).join(' ') || '',
                    age: user.age?.toString() || '',
                    dni: user.dni || '',
                    howFound: user.how_found || '',
                    guests: '1'
                });
            } catch (e) { }
        }
    }, [showLeadForm]);

    const handleLeadSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const text = `QUIERO RESERVAR 👋🏻\n\nNombre: ${leadData.name} ${leadData.lastname}\nTrip: ${selectedTrip?.title}\nPersonas: ${leadData.guests}\nEdad: ${leadData.age}\nDNI: ${leadData.dni}\nMedio: ${leadData.howFound}`;
        const waUrl = `https://wa.me/5491134826691?text=${encodeURIComponent(text)}`;
        window.open(waUrl, '_blank');
        setShowLeadForm(false);
    };

    const copyToClipboard = (tripId: string) => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopiedId(tripId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const shareWhatsApp = (trip: any) => {
        const text = `¡Mirá este viaje increíble! ${trip.title} en ${trip.location}. Toda la info acá: ${window.location.href}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareEmail = (trip: any) => {
        const subject = `Viaje increíble: ${trip.title}`;
        const body = `Hola! Mirá este viaje que encontré en SwitchTrips: ${trip.title} en ${trip.location}. \n\n Ver más detalles en: ${window.location.href}`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    };



    return (
        <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-orange-500/30 overflow-x-hidden">
            {/* Header / Nav - Fully Integrated */}
            <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-md border-b border-white/5 transition-colors hover:bg-black/60">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-zinc-300 hover:text-white transition-all uppercase tracking-[0.2em] text-[10px] font-bold group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver a La Beba
                    </button>
                    <div className="flex flex-col items-center gap-3">
                        <img src="/assets/logo_switchtrip.png" alt="SwitchTrips" className="w-14 h-14 rounded-full shadow-2xl border border-white/10 p-1 bg-black" />
                        <div className="flex flex-col items-center">
                            <span className="text-orange-500 font-black tracking-[0.2em] uppercase text-xl font-['Outfit'] italic leading-none">SwitchTrips</span>
                            <span className="text-zinc-300 text-[8px] tracking-[0.3em] mt-2 uppercase leading-none font-black opacity-80">Viajes compartidos</span>
                        </div>
                    </div>
                    <div className="w-24"></div>
                </div>
            </nav>

            {/* Hero Section - No Gap, Full Integration */}
            <header className="relative h-[90vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <MediaSlider
                        items={[
                            { type: 'video', src: '/assets/Bariloche - Cerro Tronador.mp4', label: 'Bariloche' },
                            { type: 'image', src: '/assets/comida_bariloche.png', label: 'Gastronomía' },
                            { type: 'video', src: '/assets/El Salvador - El Zonte.mp4', label: 'El Salvador' },
                            { type: 'video', src: '/assets/video_Salvador.mp4', label: 'Surf' },
                            { type: 'image', src: '/assets/comida_salvador.png', label: 'Sabores' },
                            { type: 'video', src: '/assets/Playas del Caribe Costa Rica.mp4', label: 'Costa Rica' },
                            { type: 'image', src: '/assets/comida_costarica.png', label: 'Cultura' },
                            { type: 'image', src: '/assets/cataratas.png', label: 'Aventura' }
                        ]}
                        fullScreen={true}
                        autoPlayInterval={8000}
                        showControls={false}
                        showLabel={false}
                        imageFit="cover"
                    />
                    {/* Multilayer gradient for seamless header integration */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-[#0a0a0a] z-10"></div>
                </div>

                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-32 md:pt-40 pb-32">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] backdrop-blur-md shadow-[0_0_20px_rgba(249,115,22,0.2)] mb-12">
                        Temporada 2025 - 2026
                    </div>
                    <h1 className="text-7xl md:text-9xl font-black mb-8 tracking-tighter leading-none italic text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] uppercase">
                        Viajá con <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-400">nosotros.</span>
                    </h1>
                    <p className="text-white text-base md:text-lg font-bold tracking-normal max-w-[90%] md:max-w-5xl mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] border-t border-white/20 pt-8 mt-4">
                        Conectamos personas, culturas y pasiones a través del deporte y la naturaleza
                    </p>
                </div>
            </header>

            {/* Catalogue */}
            <section className="container mx-auto px-6 py-16 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {TRIPS.map((trip) => (
                        <div
                            key={trip.id}
                            className="group relative bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[40px] overflow-hidden hover:border-orange-500/30 transition-all duration-700 hover:shadow-[0_20px_50px_rgba(249,115,22,0.1)]"
                        >
                            <div className={`absolute top-8 right-8 z-30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl ${trip.status === 'PREVENTA' ? 'bg-emerald-500 text-emerald-950 animate-pulse' : 'bg-yellow-400 text-yellow-950'
                                }`}>
                                {trip.status}
                            </div>

                            <div className="h-80 overflow-hidden relative">
                                <img src={trip.image} alt={trip.title} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110 opacity-70 group-hover:opacity-100" />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
                                <div className="absolute bottom-6 left-8">
                                    <span className="text-orange-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1 block">{trip.location}</span>
                                    <h3 className="text-3xl font-black text-white leading-tight uppercase italic group-hover:text-orange-400 transition-colors">{trip.title}</h3>
                                </div>
                            </div>

                            <div className="p-8 pt-6 space-y-6">
                                <div className="flex justify-between items-center text-zinc-300 text-xs font-bold uppercase tracking-widest">
                                    <div className="flex items-center gap-2"><Calendar size={14} className="text-orange-500" />{trip.dates}</div>
                                    <div className="flex items-center gap-2"><Clock size={14} className="text-orange-500" />{trip.duration}</div>
                                </div>
                                <div className="flex items-center gap-1 text-white text-3xl font-black">
                                    <span className="text-orange-500 text-xs font-bold uppercase mr-1">Desde</span>
                                    <span className="text-orange-500 text-xl font-bold">u$d</span>{trip.price}
                                    <span className="text-[10px] text-zinc-300 uppercase tracking-widest ml-2">/ persona</span>
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <button onClick={() => setSelectedTrip(trip)} className="flex-1 bg-white/5 hover:bg-white text-white hover:text-black border border-white/10 font-black py-4 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3">
                                        <Info size={20} className="text-orange-500" /> DETALLES
                                    </button>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowShareModal(showShareModal === trip.id ? null : trip.id)}
                                            className="bg-white/5 hover:bg-orange-500 p-4 rounded-2xl border border-white/10 text-white transition-all group/share"
                                        >
                                            <Share2 size={20} className="group-hover/share:scale-110 transition-transform" />
                                        </button>

                                        {showShareModal === trip.id && (
                                            <div className="absolute bottom-full right-0 mb-4 bg-zinc-900 border border-white/10 p-3 rounded-2xl shadow-2xl flex flex-col gap-2 z-50 min-w-[180px] animate-fade-in-up">
                                                <button onClick={() => copyToClipboard(trip.id)} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl text-left transition-colors whitespace-nowrap">
                                                    {copiedId === trip.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} className="text-orange-500" />}
                                                    <span className="text-xs font-bold uppercase tracking-widest">{copiedId === trip.id ? 'Copiado!' : 'Copiar Link'}</span>
                                                </button>
                                                <button onClick={() => shareWhatsApp(trip)} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl text-left transition-colors whitespace-nowrap">
                                                    <MessageCircle size={16} className="text-emerald-500" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">WhatsApp</span>
                                                </button>
                                                <button onClick={() => shareEmail(trip)} className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl text-left transition-colors whitespace-nowrap">
                                                    <Mail size={16} className="text-orange-500" />
                                                    <span className="text-xs font-bold uppercase tracking-widest">Email</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {selectedTrip && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/98 backdrop-blur-2xl animate-fade-in">
                    <div className="bg-zinc-950 border border-white/10 rounded-[40px] w-full max-w-5xl h-fit max-h-[90vh] overflow-hidden relative shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col md:flex-row">

                        <button
                            onClick={() => setSelectedTrip(null)}
                            className="absolute top-6 right-6 z-50 w-10 h-10 rounded-full bg-black/50 border border-white/10 text-white hover:bg-white hover:text-black transition-all flex items-center justify-center backdrop-blur-md"
                        >
                            <ChevronLeft className="rotate-90 md:rotate-0" size={20} />
                        </button>

                        {/* LEFT SIDE: Media Visualizer */}
                        <div className="w-full md:w-[55%] h-[40vh] md:h-auto flex flex-col bg-zinc-900/20 border-r border-white/5">
                            {/* Main Active Media */}
                            <div className="flex-1 relative overflow-hidden bg-black">
                                <img
                                    src={activeImage || selectedTrip.image}
                                    alt={selectedTrip.title}
                                    className="w-full h-full object-cover transition-all duration-500 animate-fade-in"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent"></div>
                            </div>

                            {/* Thumbnails Gallery */}
                            {'gallery' in selectedTrip && (
                                <div className="p-4 bg-zinc-950 border-t border-white/5">
                                    <div className="grid grid-cols-4 gap-2">
                                        {(selectedTrip as any).gallery.map((img: any, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveImage(img.src)}
                                                className={`aspect-video rounded-lg overflow-hidden border transition-all duration-300 relative group ${activeImage === img.src ? 'border-orange-500 scale-[1.02] shadow-lg shadow-orange-500/20' : 'border-white/5 opacity-40 hover:opacity-100 grayscale hover:grayscale-0'
                                                    }`}
                                            >
                                                <img src={img.src} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT SIDE: Information */}
                        <div className="w-full md:w-[45%] p-8 md:p-12 space-y-8 overflow-y-auto bg-gradient-to-br from-zinc-950 to-[#070707]">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-orange-500 uppercase tracking-[0.3em] font-black text-[10px]">
                                    {selectedTrip.location}
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedTrip.title}</h2>
                                <p className="text-zinc-400 text-sm leading-relaxed font-medium">{selectedTrip.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-zinc-900/30 border border-white/5 p-4 rounded-2xl">
                                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-black mb-1">Fecha</p>
                                    <p className="text-zinc-100 text-sm font-bold uppercase">{selectedTrip.dates}</p>
                                </div>
                                <div className="bg-zinc-900/30 border border-white/5 p-4 rounded-2xl">
                                    <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-black mb-1">Tiempo</p>
                                    <p className="text-zinc-100 text-sm font-bold uppercase">{selectedTrip.duration}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="text-white font-black italic uppercase tracking-widest text-[10px] border-b border-white/5 pb-2">Incluye</h4>
                                    <div className="space-y-2.5">
                                        {selectedTrip.includes.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3 text-zinc-400 text-[12px] font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {(selectedTrip as any).extras && (
                                    <div className="space-y-4">
                                        <h4 className="text-white font-black italic uppercase tracking-widest text-[10px] border-b border-white/5 pb-2">Extras / Opcionales</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {(selectedTrip as any).extras.map((item: string, idx: number) => (
                                                <div key={idx} className="flex items-center gap-2 text-zinc-400 text-[11px] font-medium bg-zinc-900/50 p-2 rounded-lg border border-white/5">
                                                    <span className="text-orange-500">◈</span>
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(selectedTrip as any).notIncluded && (
                                    <div className="space-y-4">
                                        <h4 className="text-rose-500 font-black italic uppercase tracking-widest text-[10px] border-b border-rose-500/10 pb-2">No Incluye</h4>
                                        <div className="space-y-2.5">
                                            {(selectedTrip as any).notIncluded.map((item: string, idx: number) => (
                                                <div key={idx} className="space-y-3">
                                                    <div className="flex items-center gap-3 text-zinc-500 text-[12px] font-medium">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500/30"></div>
                                                        <span>{item}</span>
                                                    </div>
                                                    {item.toLowerCase().includes('tickets aéreos') && (
                                                        <a
                                                            href="https://www.kayak.com.ar/flights"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/10 rounded-xl text-[10px] font-black uppercase text-zinc-300 hover:text-white hover:bg-orange-600 transition-all ml-4"
                                                        >
                                                            🔍 Buscar Vuelos en Kayak
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(selectedTrip as any).discounts && (
                                    <div className="space-y-4">
                                        <h4 className="text-emerald-400 font-black italic uppercase tracking-widest text-[10px] border-b border-emerald-400/10 pb-2">Descuentos & Beneficios</h4>
                                        <div className="space-y-3 px-5 py-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                            {(selectedTrip as any).discounts.map((item: string, idx: number) => (
                                                <div key={idx} className="flex items-start gap-4 text-emerald-400/90 text-xs font-bold leading-tight">
                                                    <Check size={14} className="mt-0.5 shrink-0" />
                                                    <span>{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(selectedTrip as any).plazas && (
                                    <div className="flex flex-col gap-2 px-5 py-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                                        <span className="text-[10px] text-zinc-400 uppercase font-black tracking-widest italic border-b border-white/5 pb-1 w-fit">Disponibilidad</span>
                                        <span className="text-white text-sm font-black uppercase tracking-widest">{(selectedTrip as any).plazas}</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4">
                                {(selectedTrip as any).extraInfo && (
                                    <p className="text-[10px] text-orange-400 font-bold mb-4 bg-orange-500/5 p-3 rounded-xl border border-orange-500/10 italic">
                                        {(selectedTrip as any).extraInfo}
                                    </p>
                                )}
                                <button
                                    onClick={() => setShowLeadForm(true)}
                                    className="w-full bg-white text-black font-black py-5 rounded-2xl transition-all hover:bg-orange-500 hover:text-white flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                                >
                                    <MessageCircle size={20} /> Reservar ahora
                                </button>
                            </div>

                            {/* LEAD CAPTURE MODAL OVERLAY */}
                            {showLeadForm && (
                                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
                                    <div className="bg-zinc-950 border border-white/10 rounded-[40px] w-full max-w-md p-8 shadow-2xl relative">
                                        <button onClick={() => setShowLeadForm(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
                                            <ChevronLeft className="rotate-90" size={20} />
                                        </button>
                                        <div className="text-center mb-8">
                                            <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
                                                <User className="text-orange-500" />
                                            </div>
                                            <h3 className="text-2xl font-black uppercase italic text-white tracking-tight">Casi listo!</h3>
                                            <p className="text-zinc-400 text-xs mt-2 italic">Completá estos datos para conectar con el host</p>
                                        </div>
                                        <form onSubmit={handleLeadSubmit} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text" placeholder="Nombre" required
                                                    value={leadData.name} onChange={e => setLeadData({ ...leadData, name: e.target.value })}
                                                    className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-orange-500 focus:outline-none"
                                                />
                                                <input
                                                    type="text" placeholder="Apellido" required
                                                    value={leadData.lastname} onChange={e => setLeadData({ ...leadData, lastname: e.target.value })}
                                                    className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-orange-500 focus:outline-none"
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                <input
                                                    type="number" placeholder="Edad" required
                                                    value={leadData.age} onChange={e => setLeadData({ ...leadData, age: e.target.value })}
                                                    className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-orange-500 focus:outline-none"
                                                />
                                                <input
                                                    type="number" placeholder="Cant. Personas" required min="1"
                                                    value={leadData.guests} onChange={e => setLeadData({ ...leadData, guests: e.target.value })}
                                                    className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-orange-500 focus:outline-none"
                                                />
                                                <input
                                                    type="text" placeholder="DNI / Pasaporte" required
                                                    value={leadData.dni} onChange={e => setLeadData({ ...leadData, dni: e.target.value })}
                                                    className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-orange-500 focus:outline-none"
                                                />
                                            </div>
                                            <select
                                                required value={leadData.howFound} onChange={e => setLeadData({ ...leadData, howFound: e.target.value })}
                                                className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:border-orange-500 focus:outline-none appearance-none"
                                            >
                                                <option value="" disabled>¿Cómo nos conociste?</option>
                                                <option value="Instagram">Instagram</option>
                                                <option value="Google">Google</option>
                                                <option value="Amigo">Un amigo</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                            <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl transition-all uppercase tracking-widest text-xs mt-4 shadow-lg shadow-orange-950/20">
                                                Continuar al WhatsApp ➔
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Footer with Enhanced Partners */}
            <footer className="py-10 border-t border-white/5 text-center bg-[#050505]">
                <div className="container mx-auto px-6 max-w-xl">
                    <img src="/assets/logo_switchtrip.png" alt="Switch Trips" className="w-20 h-20 rounded-full mx-auto mb-6 shadow-2xl border border-white/10 p-1 bg-black" />
                    <h2 className="text-4xl md:text-5xl font-black italic text-white tracking-[0.3em] uppercase mb-3 font-['Outfit']">SwitchTrips</h2>

                    <p className="text-zinc-200 text-sm md:text-lg tracking-[0.4em] font-black uppercase mb-10 opacity-90">Viajes compartidos</p>

                    <div className="flex justify-center gap-6 mb-8">
                        <a href="https://www.instagram.com/switchtrips/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-orange-500 transition-colors">
                            <Instagram size={22} />
                        </a>
                    </div>

                    <div className="pt-10 border-t border-white/5 space-y-4">
                        <p className="text-zinc-600 text-xs tracking-widest font-bold uppercase">© {new Date().getFullYear()} SwitchTrips — All Rights Reserved</p>
                        <p className="text-zinc-500 text-sm font-medium italic flex items-center justify-center gap-2">
                            Desarrollado por <a href="https://lanubecomputacion.com" target="_blank" rel="noopener noreferrer" className="text-zinc-100 hover:text-orange-500 font-black underline underline-offset-4 decoration-orange-500/50 transition-all text-base">lanubecomputacion.com</a>
                        </p>
                    </div>
                </div>
            </footer>

            {/* PROMO VIDEO POPUP */}
            {showPromo && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl animate-fade-in">
                    <div className="relative w-full max-w-[380px] aspect-[9/16] bg-black rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(249,115,22,0.4)] border border-white/10">
                        <button
                            onClick={() => setShowPromo(false)}
                            className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-black/60 text-white hover:bg-orange-600 transition-all flex items-center justify-center border border-white/10 backdrop-blur-md shadow-2xl"
                        >
                            <X size={24} />
                        </button>
                        <video
                            src="/assets/videoPromo.mp4"
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                            onEnded={() => setShowPromo(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SwitchTrips;

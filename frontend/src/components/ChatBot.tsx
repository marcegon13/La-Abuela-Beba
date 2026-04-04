import React, { useState, useRef, useEffect } from 'react';
import { X, MessageCircle, ChevronLeft, Send } from 'lucide-react';

// ─── FAQ DATA ────────────────────────────────────────────────────────────────
const FAQ_CATEGORIES = [
    {
        id: 'about',
        emoji: '🏡',
        label: '¿Quiénes somos?',
        answer: `La Abuela Beba es un espacio autogestivo y cultural, gestionado por y para la comunidad con el objetivo de ofrecer una propuesta turística alternativa y económica. ¡Buena, bonita y barata! 🎉\n\nEsperamos que tengas una experiencia libre de cronogramas u horarios. Podés coordinar clases de surf, bioconstrucción, yoga (9:30 AM), recorrer Chapa o realizar otros talleres y experiencias de la zona.`,
    },
    {
        id: 'checkin',
        emoji: '🛎️',
        label: 'Check-in',
        answer: `• Se coordina previamente por WhatsApp y es por la tarde.\n• Si llegás antes, podés dejar tus pertenencias sin cargo, pero no ingresar a la habitación.\n• Ingreso antes del mediodía: se cobra una noche adicional.`,
    },
    {
        id: 'recepcion',
        emoji: '🕐',
        label: 'Horarios de recepción',
        answer: `• Turnos: 08:00 a 12:00 y 17:00 a 21:00.\n• Fuera de esos horarios no hay atención presencial.\n• Urgencias: comunicarse por WhatsApp.`,
    },
    {
        id: 'silencio',
        emoji: '🌙',
        label: 'Silencio nocturno',
        answer: `El horario de silencio es de 23:00 a 08:00 hs.\nPedimos respetar este horario para garantizar el descanso de todos los huéspedes.`,
    },
    {
        id: 'visitas',
        emoji: '👥',
        label: 'Visitas',
        answer: `• Permitidas solo de 10:00 a 18:00.\n• Fuera de ese horario, solo durante eventos.\n• El baño químico es el único habilitado para visitas.`,
    },
    {
        id: 'cocina',
        emoji: '🍳',
        label: 'Cocina y limpieza',
        answer: `• Cada huésped debe lavar sus utensilios después de usarlos.\n• La casa garantiza únicamente la limpieza general del espacio.`,
    },
    {
        id: 'reembolso',
        emoji: '💰',
        label: 'Política de reembolso',
        answer: `• Devolución total ante reclamos o disconformidad con la estadía.\n• Priorizamos una convivencia cómoda para todos.`,
    },
    {
        id: 'eventos',
        emoji: '🎶',
        label: 'Eventos',
        answer: `• En temporada media y alta hay propuestas culturales y gastronómicas.\n• Consultá el cronograma mensual para no perderte nada.`,
    },
    {
        id: 'surf',
        emoji: '🏄',
        label: 'Surf: clases y alquiler',
        answer: `• No ofrecemos equipos ni damos clases directamente. Se terceriza con gente de la zona, profesional.\n• Recomendamos coordinar con anticipación.\n• Por cuestiones de seguridad, no se alquilan equipos a personas sin conocimiento previo.`,
    },
    {
        id: 'contacto',
        emoji: '📍',
        label: 'Contacto y dirección',
        answer: `📞 WhatsApp: +54 9 2234 37-6529\n📍 Calle 0 entre 815 y 817, Colonia Chapadmalal, Buenos Aires, Argentina.\n\nAnte cualquier inquietud o sugerencia, no dudes en escribirnos.`,
    },
];

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Message {
    id: number;
    type: 'bot' | 'user';
    text: string;
    showCategories?: boolean;
}

// ─── COMPONENT ───────────────────────────────────────────────────────────────
const ChatBot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasGreeted, setHasGreeted] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [pulse, setPulse] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Stop pulse after first open
    useEffect(() => {
        if (isOpen) setPulse(false);
    }, [isOpen]);

    const addBotMessage = (text: string, showCategories = false) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setMessages(prev => [
                ...prev,
                { id: Date.now(), type: 'bot', text, showCategories },
            ]);
        }, 600 + Math.random() * 400);
    };

    const handleOpen = () => {
        setIsOpen(true);
        if (!hasGreeted) {
            setHasGreeted(true);
            setTimeout(() => {
                addBotMessage('¡Hola! 👋🏼 Soy Beba, tu asistente virtual.\n¿En qué te puedo ayudar?', true);
            }, 300);
        }
    };

    const handleCategoryClick = (cat: typeof FAQ_CATEGORIES[0]) => {
        // Add user "question"
        setMessages(prev => [
            ...prev,
            { id: Date.now(), type: 'user', text: cat.label },
        ]);

        // Bot answer
        setTimeout(() => {
            addBotMessage(cat.answer);
            // After answering, show categories again
            setTimeout(() => {
                addBotMessage('¿Tenés alguna otra consulta?', true);
            }, 1200);
        }, 200);
    };

    const handleWhatsApp = () => {
        window.open(
            'https://wa.me/5491134826691?text=Hola%2C%20tengo%20una%20consulta%20sobre%20La%20Abuela%20Beba',
            '_blank'
        );
    };

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleReset = () => {
        setMessages([]);
        setHasGreeted(false);
        setIsOpen(false);
    };

    return (
        <>
            {/* ─── FLOATING BUTTON ─── */}
            <button
                onClick={handleOpen}
                className={`fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-2xl shadow-emerald-900/40 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-emerald-500/30 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
                aria-label="Abrir chat"
            >
                <MessageCircle size={28} strokeWidth={2.2} />
                {/* Pulse ring */}
                {pulse && (
                    <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
                )}
            </button>

            {/* ─── CHAT WINDOW ─── */}
            <div
                className={`fixed bottom-6 right-6 z-50 w-[370px] max-w-[calc(100vw-2rem)] transition-all duration-300 origin-bottom-right ${isOpen
                    ? 'scale-100 opacity-100 pointer-events-auto'
                    : 'scale-75 opacity-0 pointer-events-none'
                    }`}
            >
                <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-zinc-800 flex flex-col"
                    style={{ height: 'min(540px, 80vh)' }}>

                    {/* ── Header ── */}
                    <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-4 flex items-center gap-3 flex-shrink-0">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                                🌿
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-emerald-700" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-white font-bold text-sm leading-tight">Beba</h4>
                            <p className="text-emerald-200 text-xs">Asistente de La Abuela Beba</p>
                        </div>
                        <button onClick={handleReset} className="text-white/60 hover:text-white transition-colors p-1" title="Reiniciar chat">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors p-1" title="Cerrar">
                            <X size={18} />
                        </button>
                    </div>

                    {/* ── Messages Area ── */}
                    <div className="flex-1 overflow-y-auto bg-zinc-950 px-4 py-4 space-y-3"
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}>

                        {messages.map((msg) => (
                            <div key={msg.id}>
                                {/* Message bubble */}
                                <div className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${msg.type === 'user'
                                            ? 'bg-emerald-600 text-white rounded-br-md'
                                            : 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 rounded-bl-md'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>

                                {/* Category buttons */}
                                {msg.showCategories && (
                                    <div className="mt-3 space-y-1.5">
                                        {FAQ_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategoryClick(cat)}
                                                className="w-full text-left px-3.5 py-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-zinc-300 hover:text-white text-sm transition-all flex items-center gap-2.5 group"
                                            >
                                                <span className="text-base flex-shrink-0">{cat.emoji}</span>
                                                <span className="group-hover:translate-x-0.5 transition-transform">{cat.label}</span>
                                            </button>
                                        ))}

                                        {/* WhatsApp fallback */}
                                        <button
                                            onClick={handleWhatsApp}
                                            className="w-full text-left px-3.5 py-2.5 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 hover:border-[#25D366]/50 hover:bg-[#25D366]/15 text-[#25D366] text-sm transition-all flex items-center gap-2.5 group mt-2"
                                        >
                                            <span className="text-base flex-shrink-0">💬</span>
                                            <span className="group-hover:translate-x-0.5 transition-transform">Hablar por WhatsApp</span>
                                            <Send size={14} className="ml-auto opacity-50" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1.5">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* ── Footer ── */}
                    <div className="bg-zinc-900 border-t border-zinc-800 px-4 py-3 flex-shrink-0">
                        <p className="text-zinc-600 text-[11px] text-center font-['Calibri'] italic">
                            Seleccioná una opción arriba o escribinos por WhatsApp 🌿
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ChatBot;

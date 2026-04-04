import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale/es';
import 'react-datepicker/dist/react-datepicker.css';
registerLocale('es', es);
import { X, ChevronRight, ChevronLeft, Check, Users, Home, Plus, Minus } from 'lucide-react';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialStep?: number;
}

const ROOMS = [
    {
        id: 'compartido',
        name: 'Cabaña Compartida',
        subtitle: 'Planta baja — 4 camas dobles / cuchetas (8 plazas)',
        capacity: 4,
        totalBeds: 8,
        price: 18000,
        image: '/assets/habitacion_compartida_nueva.jpg',
        gallery: [
            '/assets/cuarto compartido/compartido1.jpeg',
            '/assets/cuarto compartido/compartido 2.jpeg'
        ],
        description: 'Cabaña con 4 camas dobles o cuchetas (8 plazas totales). Reservás la cantidad de camas que necesitás. Baño compartido, cocina comunitaria.',
        icon: Users,
        note: 'Reservá por cama — ideal para mochileros y viajeros independientes.',
    },
    {
        id: 'privada',
        name: 'Cuarto Privado',
        subtitle: 'Primer piso — Habitación privada (hasta 3 personas)',
        capacity: 3,
        totalBeds: 3,
        price: 38000,
        image: '/assets/habitacion_privada.jpg',
        gallery: [
            '/assets/cuarto privado/privado1.jpg',
            '/assets/cuarto privado/privado2.jpg',
            '/assets/cuarto privado/privado 3.jpg'
        ],
        description: 'Habitación privada en el primer piso con cama doble + sofá cama (hasta 3 personas). Baños y cocina comunales/compartidos en el exterior.',
        icon: Home,
        note: 'Privacidad total en tu habitación con servicios compartidos — ideal para parejas o grupos pequeños.',
    },
];

export const EXTRAS_CATEGORIES = [
    {
        id: 'beba_gastro',
        name: 'Gastronomía de la Casa',
        supplier: 'La Beba',
        distance: 'km 0',
        description: 'Especialidades caseras directas de nuestra cocina.',
        items: [
            { id: 'fatay', name: 'Fatay Vegano (Empanada Árabe)', price: 3000 },
            { id: 'budin', name: 'Budín Casero Vegano', price: 4000 },
            { id: 'desayuno_completo', name: 'Desayuno Completo', price: 12000 },
        ]
    },
    {
        id: 'higiene',
        name: 'Higiene Personal',
        supplier: 'Naturalmente',
        distance: 'Local',
        description: 'Productos naturales para el cuidado personal.',
        items: [
            { id: 'combo_basico', name: 'Combo Cuidado natural básico', price: 28000 },
        ]
    }
];

const PAYMENT_CONFIG = {
    transferencia: { alias: 'laabuelabeba' },
};

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, initialStep = 1 }) => {
    const [bookingType, setBookingType] = useState<'regular' | 'external'>('regular');
    const [plataforma, setPlataforma] = useState('');
    const [step, setStep] = useState(initialStep);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [pricingRules, setPricingRules] = useState<any>(null);

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const res = await fetch('/api/admin/pricing');
                if (res.ok) {
                    const data = await res.json();
                    setPricingRules({
                        compartido: {
                            base: data.compartido?.base_price || 18000,
                            nights: JSON.parse(data.compartido?.discount_nights || '[]'),
                            guests: JSON.parse(data.compartido?.discount_guests || '[]'),
                            lead: JSON.parse(data.compartido?.discount_lead_time || '[]'),
                        },
                        privada: {
                            base: data.privado?.base_price || 38000,
                            nights: JSON.parse(data.privado?.discount_nights || '[]'),
                            guests: JSON.parse(data.privado?.discount_guests || '[]'),
                            lead: JSON.parse(data.privado?.discount_lead_time || '[]'),
                        },
                        linen: 3500 
                    });
                }
            } catch (e) { console.error("Rules fetch failed", e); }
        };
        if (isOpen) fetchRules();
    }, [isOpen]);

    const activeRooms = ROOMS.map(r => ({
        ...r,
        price: pricingRules?.[r.id === 'privada' ? 'privada' : 'compartido']?.base || r.price
    }));

    const selectedRoom = activeRooms.find(r => r.id === selectedRoomId);
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);
    const [nombre, setNombre] = useState('');
    const [dni, setDni] = useState('');
    const [telefono, setTelefono] = useState('');
    const [email, setEmail] = useState('');
    const [rulesAccepted, setRulesAccepted] = useState<Record<string, boolean>>({});
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [bookingCode, setBookingCode] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'mercadopago' | null>(null);
    const [linenCount, setLinenCount] = useState(0);
    const [selectedExtras, setSelectedExtras] = useState<Record<string, number>>({});
    const [isOpenDates, setIsOpenDates] = useState(false);
    const [openNights, setOpenNights] = useState(2);

    useEffect(() => { if (isOpen) setStep(initialStep); }, [isOpen, initialStep]);

    if (!isOpen) return null;

    const safeToDate = (s: string) => {
        if (!s) return null;
        const parts = s.split('-');
        return parts.length === 3 ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0) : null;
    };

    const nights = isOpenDates ? openNights : (() => {
        const dIn = safeToDate(checkIn), dOut = safeToDate(checkOut);
        if (!dIn || !dOut) return 0;
        return Math.max(0, Math.ceil((dOut.getTime() - dIn.getTime()) / 86400000));
    })();

    const rules = pricingRules?.[selectedRoom?.id === 'privada' ? 'privada' : 'compartido'];
    let totalRoomPrice = 0;
    let appliedRules = { nights: null as any, guests: null as any, lead: null as any };

    if (selectedRoom && rules) {
        let subtotal = rules.base * (selectedRoom.id === 'privada' ? 1 : guests) * (nights || 1);
        if (nights === 1) subtotal *= 1.20;
        
        appliedRules.nights = (rules.nights || []).filter((d: any) => nights >= d.min).sort((a: any, b: any) => b.min - a.min)[0];
        if (appliedRules.nights) subtotal *= (1 - appliedRules.nights.pct / 100);

        appliedRules.guests = (rules.guests || []).filter((d: any) => guests >= d.min).sort((a: any, b: any) => b.min - a.min)[0];
        if (appliedRules.guests) subtotal *= (1 - appliedRules.guests.pct / 100);

        if (checkIn && !isOpenDates) {
            const daysTo = (safeToDate(checkIn)!.getTime() - new Date().setHours(12,0,0,0)) / 86400000;
            appliedRules.lead = (rules.lead || []).filter((d: any) => daysTo >= d.min).sort((a: any, b: any) => b.min - a.min)[0];
            if (appliedRules.lead) subtotal *= (1 - appliedRules.lead.pct / 100);
        }
        totalRoomPrice = Math.round(subtotal);
    }

    const extrasTotal = Object.entries(selectedExtras).reduce((acc, [id, qty]) => {
        const item = EXTRAS_CATEGORIES.flatMap(c => c.items).find(i => i.id === id);
        return acc + (item ? item.price * qty : 0);
    }, 0) + (linenCount * (pricingRules?.linen || 3500));

    const totalPrice = totalRoomPrice + extrasTotal;
    const formatPrice = (v: number) => (v || 0).toLocaleString('es-AR');

    const handleDniBlur = async () => {
        if (!dni || dni.length < 6) return;
        try {
            const res = await fetch(`/api/admin/huespedes?dni=${dni.replace(/\D/g,'')}`);
            if (res.ok) {
                const data = await res.json();
                if (data?.[0]) { if (!nombre) setNombre(data[0].nombre); }
            }
        } catch {}
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const res = await fetch('/api/solicitudes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre, dni: dni.replace(/\D/g,''), telefono, email,
                    tipo_habitacion: selectedRoom?.id,
                    plazas: selectedRoom?.id === 'privada' ? 3 : guests,
                    check_in: isOpenDates ? '2030-01-01' : checkIn,
                    check_out: isOpenDates ? '2030-01-02' : checkOut,
                    noches: nights, precio_total: totalPrice,
                    linen_count: linenCount, extras: selectedExtras,
                    plataforma: bookingType === 'external' ? plataforma : 'directo'
                })
            });
            const data = await res.json();
            if (data.success) { setBookingCode(data.codigo); setSubmitted(true); }
            else throw new Error(data.message);
        } catch (e: any) { setSubmitError(e.message); }
        finally { setSubmitting(false); }
    };

    const resetAndClose = () => {
        setStep(1); setSelectedRoomId(null); setCheckIn(''); setCheckOut('');
        setGuests(1); setLinenCount(0); setNombre(''); setDni(''); setSubmitted(false);
        onClose();
    };

    const todayDate = new Date(); todayDate.setHours(0,0,0,0);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={resetAndClose} />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl">
                
                {/* Header */}
                <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 px-8 py-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-4xl font-bold text-white tracking-tight">{step === 3 ? 'Extras' : 'Reservar'}</h2>
                        <p className="text-zinc-400 italic">Paso {step} de 6</p>
                    </div>
                    <button onClick={resetAndClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors"><X size={20} className="text-zinc-400" /></button>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="flex bg-zinc-900 p-1 rounded-xl mb-4">
                                <button onClick={() => setBookingType('regular')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${bookingType === 'regular' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500'}`}>Reserva Directa</button>
                                <button onClick={() => setBookingType('external')} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${bookingType === 'external' ? 'bg-zinc-800 text-white shadow-xl' : 'text-zinc-500'}`}>Reserva Externa</button>
                            </div>

                            <div className="space-y-4">
                                {activeRooms.map(room => (
                                    <button key={room.id} onClick={() => setSelectedRoomId(room.id)} className={`w-full text-left overflow-hidden rounded-2xl border transition-all ${selectedRoomId === room.id ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500' : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'}`}>
                                        <div className="flex p-4 gap-4">
                                            <img src={room.image} alt={room.name} className="w-20 h-20 rounded-xl object-cover" />
                                            <div className="flex-1">
                                                <h4 className="text-white font-bold">{room.name}</h4>
                                                <p className="text-zinc-500 text-[10px] mb-2">{room.subtitle}</p>
                                                <p className="text-emerald-400 font-bold text-lg">${formatPrice(room.price)}<span className="text-[10px] text-zinc-500 font-normal"> {room.id === 'privada' ? '/noche' : '/cama'}</span></p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            
                            {bookingType === 'external' && (
                                <select value={plataforma} onChange={e => setPlataforma(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none">
                                    <option value="">¿Por dónde reservaste?</option>
                                    <option value="Airbnb">Airbnb</option>
                                    <option value="Hostelworld">Hostelworld</option>
                                    <option value="Booking">Booking.com</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            )}

                            <button onClick={() => setStep(2)} disabled={!selectedRoomId || (bookingType === 'external' && !plataforma)} className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                                Continuar <ChevronRight size={18} />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={isOpenDates} onChange={e => setIsOpenDates(e.target.checked)} className="w-5 h-5 rounded border-zinc-700 bg-zinc-950 text-emerald-500" />
                                    <span className="text-white text-sm font-bold">Reserva Prepago (Fechas Abiertas)</span>
                                </label>
                                
                                {!isOpenDates ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <DatePicker selected={checkIn ? safeToDate(checkIn) : null} onChange={(d: Date | null) => setCheckIn(d ? d.toISOString().split('T')[0] : '')} minDate={todayDate} dateFormat="dd/MM/yyyy" placeholderText="Ingreso" className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-white text-sm" />
                                        <DatePicker selected={checkOut ? safeToDate(checkOut) : null} onChange={(d: Date | null) => setCheckOut(d ? d.toISOString().split('T')[0] : '')} minDate={safeToDate(checkIn) || todayDate} dateFormat="dd/MM/yyyy" placeholderText="Egreso" className="w-full bg-black/50 border border-zinc-800 rounded-xl p-3 text-white text-sm" />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-2">
                                        <span className="text-zinc-400 text-sm">Cantidad de noches:</span>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setOpenNights(Math.max(1, openNights-1))} className="w-8 h-8 rounded-full border border-zinc-700 text-white flex items-center justify-center"><Minus size={14} /></button>
                                            <span className="text-white font-bold">{openNights}</span>
                                            <button onClick={() => setOpenNights(openNights+1)} className="w-8 h-8 rounded-full border border-zinc-700 text-white flex items-center justify-center"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedRoom?.id === 'compartido' && (
                                <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                                    <span className="text-white font-bold text-sm">Huéspedes (Camas)</span>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setGuests(Math.max(1, guests-1))} className="w-8 h-8 rounded-full border border-zinc-700 text-white flex items-center justify-center"><Minus size={14} /></button>
                                        <span className="text-white font-bold">{guests}</span>
                                        <button onClick={() => setGuests(Math.min(4, guests+1))} className="w-8 h-8 rounded-full border border-zinc-700 text-white flex items-center justify-center"><Plus size={14} /></button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Nombre Completo" value={nombre} onChange={e => setNombre(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none placeholder:text-zinc-600" />
                                <input placeholder="DNI" value={dni} onChange={e => setDni(e.target.value)} onBlur={handleDniBlur} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none placeholder:text-zinc-600" />
                                <input placeholder="WhatsApp" value={telefono} onChange={e => setTelefono(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none placeholder:text-zinc-600" />
                                <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white text-sm outline-none placeholder:text-zinc-600" />
                            </div>

                            <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
                                <div className="flex justify-between text-white font-bold">
                                    <span className="text-sm">Alojamiento</span>
                                    <span className="text-xl text-emerald-400 font-black">${formatPrice(totalRoomPrice)}</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="flex-1 py-3 bg-zinc-800 text-zinc-400 rounded-xl font-bold flex items-center justify-center gap-2"><ChevronLeft size={18} /> Atrás</button>
                                <button onClick={() => setStep(3)} disabled={!nombre || !dni || (!isOpenDates && (!checkIn || !checkOut))} className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">Continuar <ChevronRight size={18} /></button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                                <div className="flex-1">
                                    <h4 className="text-white font-bold text-sm">Ropa de Cama y Toallas</h4>
                                    <p className="text-zinc-500 text-xs italic">${pricingRules?.linen || 3500} por juego</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setLinenCount(Math.max(0, linenCount - 1))} className="w-8 h-8 rounded-full border border-zinc-700 text-white flex items-center justify-center"><Minus size={14} /></button>
                                    <span className="text-white font-bold">{linenCount}</span>
                                    <button onClick={() => setLinenCount(Math.min(guests, linenCount + 1))} className="w-8 h-8 rounded-full border border-zinc-700 text-white flex items-center justify-center"><Plus size={14} /></button>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
                                {EXTRAS_CATEGORIES.map(cat => (
                                    <div key={cat.id} className="space-y-2">
                                        <h5 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{cat.name}</h5>
                                        {cat.items.map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800 rounded-xl">
                                                <div>
                                                    <p className="text-white text-xs">{item.name}</p>
                                                    <p className="text-emerald-400 text-xs font-bold">${formatPrice(item.price)}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {(selectedExtras[item.id] || 0) > 0 && (
                                                        <button onClick={() => setSelectedExtras({...selectedExtras, [item.id]: selectedExtras[item.id]-1})} className="text-zinc-400 hover:text-white transition-colors flex items-center justify-center"><Minus size={14} /></button>
                                                    )}
                                                    <span className="text-white text-sm font-bold">{selectedExtras[item.id] || 0}</span>
                                                    <button onClick={() => setSelectedExtras({...selectedExtras, [item.id]: (selectedExtras[item.id]||0)+1})} className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center"><Plus size={14} /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => setStep(2)} className="flex-1 py-3 bg-zinc-800 text-zinc-400 rounded-xl font-bold flex items-center justify-center gap-2"><ChevronLeft size={18} /> Atrás</button>
                                <button onClick={() => setStep(4)} className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">Continuar <ChevronRight size={18} /></button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-6">
                            <div className="space-y-3">
                                {RULES.map(rule => (
                                    <label key={rule.id} className="flex gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 cursor-pointer hover:bg-zinc-900 transition-colors">
                                        <input type="checkbox" checked={!!rulesAccepted[rule.id]} onChange={() => setRulesAccepted({...rulesAccepted, [rule.id]: !rulesAccepted[rule.id]})} className="w-5 h-5 rounded border-zinc-700 bg-zinc-950 text-emerald-500 mt-1" />
                                        <div className="flex-1">
                                            <p className="text-white font-bold text-sm">{rule.label}</p>
                                            <p className="text-zinc-500 text-xs mt-1 leading-relaxed italic">{rule.detail}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setStep(3)} className="flex-1 py-3 bg-zinc-800 text-zinc-400 rounded-xl font-bold flex items-center justify-center gap-2"><ChevronLeft size={18} /> Atrás</button>
                                <button onClick={() => setStep(5)} disabled={!RULES.every(r => rulesAccepted[r.id])} className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2">Continuar <ChevronRight size={18} /></button>
                            </div>
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-6">
                            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 divide-y divide-zinc-800 overflow-hidden">
                                <div className="p-4 flex gap-4">
                                    <img src={selectedRoom?.image} alt={selectedRoom?.name} className="w-16 h-16 rounded-xl object-cover shadow-lg" />
                                    <div>
                                        <h4 className="text-white font-bold">{selectedRoom?.name}</h4>
                                        <p className="text-zinc-500 text-xs italic">{nights} noches • {selectedRoomId === 'privada' ? 'Habitación completa' : `${guests} cama(s)`}</p>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    <div className="flex justify-between text-sm text-zinc-500"><span>Alojamiento</span><span>${formatPrice(totalRoomPrice)}</span></div>
                                    {extrasTotal > 0 && <div className="flex justify-between text-sm text-zinc-500"><span>Proveeduría & Ropa</span><span>${formatPrice(extrasTotal)}</span></div>}
                                    <div className="flex justify-between text-white font-black text-2xl pt-2 border-t border-zinc-800 mt-2"><span>TOTAL</span><span>${formatPrice(totalPrice)}</span></div>
                                </div>
                            </div>
                            
                            {(appliedRules.nights || appliedRules.guests || appliedRules.lead) && (
                                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                                    <p className="text-emerald-500 text-[10px] font-bold uppercase mb-2 tracking-widest">Descuentos Aplicados</p>
                                    <ul className="text-emerald-400 text-xs space-y-1">
                                        {appliedRules.nights && <li>✓ Estadía prolongada: -{appliedRules.nights.pct}%</li>}
                                        {appliedRules.guests && <li>✓ Descuento por grupo: -{appliedRules.guests.pct}%</li>}
                                        {appliedRules.lead && <li>✓ Reserva anticipada: -{appliedRules.lead.pct}%</li>}
                                    </ul>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button onClick={() => setStep(4)} className="flex-1 py-3 bg-zinc-800 text-zinc-400 rounded-xl font-bold flex items-center justify-center gap-2"><ChevronLeft size={18} /> Atrás</button>
                                <button onClick={() => setStep(6)} className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">Ir al Pago <ChevronRight size={18} /></button>
                            </div>
                        </div>
                    )}

                    {step === 6 && !submitted && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <button onClick={() => setPaymentMethod('transferencia')} className={`p-6 rounded-2xl border text-left transition-all ${paymentMethod === 'transferencia' ? 'bg-emerald-500/10 border-emerald-500 shadow-xl ring-1 ring-emerald-500' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
                                    <h4 className="text-white font-bold mb-1">Transferencia Bancaria</h4>
                                    <p className="text-zinc-500 text-xs">Alias: {PAYMENT_CONFIG.transferencia.alias}</p>
                                </button>
                                <button onClick={() => setPaymentMethod('mercadopago')} className={`p-6 rounded-2xl border text-left transition-all ${paymentMethod === 'mercadopago' ? 'bg-blue-500/10 border-blue-500 shadow-xl ring-1 ring-blue-500' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}>
                                    <h4 className="text-white font-bold mb-1">Mercado Pago</h4>
                                    <p className="text-zinc-500 text-xs">Alias o CVU de Mercado Pago.</p>
                                </button>
                            </div>
                            
                            {submitError && <p className="text-red-400 text-xs text-center font-bold px-4 py-2 bg-red-400/10 border border-red-400/20 rounded-lg">{submitError}</p>}
                            
                            <button onClick={handleSubmit} disabled={!paymentMethod || submitting} className="w-full py-4 bg-white text-black font-black rounded-xl hover:bg-zinc-200 disabled:bg-zinc-800 transition-all shadow-xl">{submitting ? 'Procesando...' : 'CONFIRMAR SOLICITUD'}</button>
                            <button onClick={() => setStep(5)} className="w-full text-zinc-500 text-[10px] font-bold uppercase tracking-widest py-2 hover:text-white transition-colors">Volver al resumen</button>
                        </div>
                    )}

                    {submitted && (
                        <div className="text-center py-12 animate-fade-in-up">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20"><Check size={40} className="text-emerald-400" /></div>
                            <h3 className="text-5xl font-black text-white mb-2">{bookingCode}</h3>
                            <p className="text-zinc-400 italic mb-8 mx-auto max-w-xs leading-tight">¡Solicitud enviada! Envianos el comprobante por WhatsApp para confirmar.</p>
                            <a href={`https://wa.me/5491134826691?text=${encodeURIComponent(`Hola! Registré mi reserva. Código: ${bookingCode}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 px-10 py-5 bg-[#25D366] text-white font-black rounded-full hover:scale-105 transition-all shadow-xl">Contactar vía WhatsApp</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const TERMS_TEXT = `* CHECK OUT ANTES DE LAS 10AM. 
* Cuartos con calefacción. 
* Baños y cocina/comedor compartidos en el exterior. 
* RESERVAS SOLO POR PAGO ANTICIPADO. 
* La estadía puede ser reprogramada sin recargos hasta 72hs antes del ingreso.`;

const RULES = [
    { id: 'ropa', label: 'Términos y condiciones', detail: TERMS_TEXT },
    { id: 'silencio', label: 'Convivencia', detail: 'Silencio de 23:00 a 08:00 hs. Respetamos el descanso.' },
    { id: 'pago', label: 'Pago anticipado', detail: 'La reserva se confirma únicamente mediante el pago anticipado en 24 hs.' },
    { id: 'cancelacion', label: 'Política de cancelación', detail: 'Reprogramación sin costo hasta 72 hs antes. Devolución 50% luego.' }
];

export default BookingModal;

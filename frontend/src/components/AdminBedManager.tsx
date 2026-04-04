import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ChevronLeft, ChevronRight, User, Calendar } from 'lucide-react';

interface Bed {
    id: number;
    room_type: string;
    label: string;
    bunk_num: number;
    level: string;
    is_active: boolean;
}

interface Block {
    id: number;
    bed_id: number;
    label: string;
    block_date: string;
    block_type: string;
    guest_name: string;
    solicitud_id: string;
}

const AdminBedManager: React.FC = () => {
    const [beds, setBeds] = useState<Bed[]>([]);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [loading, setLoading] = useState(false);
    const [roomTab, setRoomTab] = useState<'compartido' | 'privado'>('compartido');

    // Generate a week of dates starting from selectedDate
    const getWeekDates = () => {
        const dates: string[] = [];
        const start = new Date(selectedDate + 'T12:00:00');
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            dates.push(d.toISOString().split('T')[0]);
        }
        return dates;
    };

    const weekDates = getWeekDates();
    const weekEnd = weekDates[weekDates.length - 1];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bedsRes, blocksRes] = await Promise.all([
                fetch(`/api/beds?room_type=${roomTab}`),
                fetch(`/api/admin/beds/blocks?room_type=${roomTab}&from=${selectedDate}&to=${weekEnd}`)
            ]);
            const bedsData = await bedsRes.json();
            const blocksData = await blocksRes.json();
            setBeds(bedsData || []);
            setBlocks(blocksData || []);
        } catch {
            setBeds([]);
            setBlocks([]);
        }
        setLoading(false);
    };

    useEffect(() => { fetchData(); }, [selectedDate, roomTab]);

    const isBlocked = (bedId: number, date: string) => {
        return blocks.find(b => b.bed_id === bedId && b.block_date === date);
    };

    const handleToggleBlock = async (bedId: number, date: string) => {
        const existingBlock = isBlocked(bedId, date);

        if (existingBlock) {
            if (existingBlock.block_type === 'booking') {
                alert('Esta cama tiene una reserva confirmada. Para liberarla, cancelá la reserva desde Solicitudes.');
                return;
            }
            // Unblock
            await fetch(`/api/admin/beds/${bedId}/block`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date }),
            });
        } else {
            // Block
            await fetch(`/api/admin/beds/${bedId}/block`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date }),
            });
        }
        fetchData();
    };

    const shiftWeek = (direction: number) => {
        const d = new Date(selectedDate + 'T12:00:00');
        d.setDate(d.getDate() + (7 * direction));
        setSelectedDate(d.toISOString().split('T')[0]);
    };

    const goToToday = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
    };

    const formatDay = (dateStr: string) => {
        const d = new Date(dateStr + 'T12:00:00');
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return {
            day: days[d.getDay()],
            num: d.getDate(),
            month: d.toLocaleString('es-AR', { month: 'short' }),
            isToday: dateStr === new Date().toISOString().split('T')[0],
        };
    };

    // Group beds by bunk
    const bunks: { [key: number]: Bed[] } = {};
    beds.filter(b => b.room_type === 'compartido').forEach(bed => {
        if (!bunks[bed.bunk_num]) bunks[bed.bunk_num] = [];
        bunks[bed.bunk_num].push(bed);
    });

    const privateBed = beds.find(b => b.room_type === 'privado');

    return (
        <div className="animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold font-['Arial']">🛏️ Gestión de Camas</h2>
                    <p className="text-zinc-500 text-sm mt-1">Bloqueá o habilitá camas por día. Las reservas confirmadas aparecen en verde.</p>
                </div>
            </div>

            {/* Room tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setRoomTab('compartido')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${roomTab === 'compartido'
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        }`}
                >Cabaña Compartida (8 camas)</button>
                <button
                    onClick={() => setRoomTab('privado')}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${roomTab === 'privado'
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                        }`}
                >Habitación Privada</button>
            </div>

            {/* Week navigation */}
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => shiftWeek(-1)} className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors">
                    <ChevronLeft size={16} className="text-zinc-400" />
                </button>
                <button onClick={goToToday} className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-300 hover:bg-zinc-800 transition-colors font-bold">
                    Hoy
                </button>
                <button onClick={() => shiftWeek(1)} className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg hover:bg-zinc-800 transition-colors">
                    <ChevronRight size={16} className="text-zinc-400" />
                </button>
                <span className="text-zinc-400 text-sm ml-2">
                    <Calendar size={14} className="inline mr-1" />
                    {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </span>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <span className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                </div>
            ) : roomTab === 'compartido' ? (
                /* ── SHARED ROOM GRID ── */
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="text-left text-xs text-zinc-500 uppercase tracking-wider py-2 px-3 w-44 sticky left-0 bg-black z-10">Cama</th>
                                {weekDates.map(date => {
                                    const f = formatDay(date);
                                    return (
                                        <th key={date} className={`text-center px-1 py-2 min-w-[70px] ${f.isToday ? 'bg-emerald-500/5' : ''}`}>
                                            <p className={`text-[10px] uppercase tracking-wider font-bold ${f.isToday ? 'text-emerald-400' : 'text-zinc-600'}`}>{f.day}</p>
                                            <p className={`text-lg font-bold ${f.isToday ? 'text-emerald-400' : 'text-zinc-300'}`}>{f.num}</p>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {beds.map(bed => (
                                <tr key={bed.id} className="border-t border-zinc-800/50">
                                    <td className="py-2 px-3 sticky left-0 bg-black z-10">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs">{bed.level === 'arriba' ? '▲' : '▼'}</span>
                                            <div>
                                                <p className="text-sm text-white font-medium">Cucheta {bed.bunk_num}</p>
                                                <p className="text-[10px] text-zinc-500">{bed.level === 'arriba' ? 'Arriba' : 'Abajo'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {weekDates.map(date => {
                                        const block = isBlocked(bed.id, date);
                                        const isBooking = block?.block_type === 'booking';
                                        const isAdmin = block?.block_type === 'admin';

                                        return (
                                            <td key={date} className="py-2 px-1 text-center">
                                                <button
                                                    onClick={() => handleToggleBlock(bed.id, date)}
                                                    title={
                                                        isBooking ? `Reserva: ${block.guest_name}`
                                                            : isAdmin ? 'Bloqueada manualmente (clic para desbloquear)'
                                                                : 'Libre (clic para bloquear)'
                                                    }
                                                    className={`w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${isBooking
                                                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-default'
                                                        : isAdmin
                                                            ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20'
                                                            : 'bg-zinc-900/50 border border-zinc-800 text-zinc-600 hover:border-emerald-500/30 hover:text-emerald-400'
                                                        }`}
                                                >
                                                    {isBooking ? (
                                                        <div>
                                                            <User size={12} className="mx-auto mb-0.5" />
                                                            <span className="block text-[8px] truncate max-w-[60px] mx-auto">{block.guest_name.split(' ')[0]}</span>
                                                        </div>
                                                    ) : isAdmin ? (
                                                        <Lock size={14} className="mx-auto" />
                                                    ) : (
                                                        <Unlock size={14} className="mx-auto opacity-30" />
                                                    )}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* ── PRIVATE ROOM GRID ── */
                privateBed && (
                    <div>
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-4">
                            <h3 className="text-white font-bold mb-1">Habitación Privada</h3>
                            <p className="text-zinc-500 text-sm">3 plazas · Se reserva completa. Tocá un día para bloquear/desbloquear.</p>
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {weekDates.map(date => {
                                const f = formatDay(date);
                                const block = isBlocked(privateBed.id, date);
                                const isBooking = block?.block_type === 'booking';
                                const isAdmin = block?.block_type === 'admin';

                                return (
                                    <button
                                        key={date}
                                        onClick={() => handleToggleBlock(privateBed.id, date)}
                                        className={`p-4 rounded-xl border transition-all text-center ${isBooking
                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                            : isAdmin
                                                ? 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20'
                                                : 'bg-zinc-900 border-zinc-800 hover:border-emerald-500/30'
                                            }`}
                                    >
                                        <p className={`text-xs font-bold ${f.isToday ? 'text-emerald-400' : 'text-zinc-500'}`}>{f.day}</p>
                                        <p className={`text-2xl font-bold my-1 ${isBooking ? 'text-emerald-400' : isAdmin ? 'text-red-400' : 'text-white'}`}>{f.num}</p>
                                        <p className="text-[10px] text-zinc-600">{f.month}</p>
                                        {isBooking && (
                                            <div className="mt-2 text-[9px] text-emerald-400 font-medium truncate">
                                                <User size={10} className="inline mr-0.5" />
                                                {block.guest_name.split(' ')[0]}
                                            </div>
                                        )}
                                        {isAdmin && <Lock size={14} className="mx-auto mt-2 text-red-400" />}
                                        {!block && <Unlock size={14} className="mx-auto mt-2 text-zinc-700" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )
            )}

            {/* Legend */}
            <div className="flex items-center gap-6 mt-6 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-zinc-900 border border-zinc-800" />
                    <span className="text-zinc-500 text-xs">Libre</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500/15 border border-emerald-500/30" />
                    <span className="text-zinc-500 text-xs">Reserva confirmada</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500/10 border border-red-500/20" />
                    <span className="text-zinc-500 text-xs">Bloqueada por admin</span>
                </div>
            </div>
        </div>
    );
};

export default AdminBedManager;

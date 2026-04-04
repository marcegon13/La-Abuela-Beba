import React, { useState, useEffect } from 'react';
import { Check, Lock, User } from 'lucide-react';

interface Bed {
    id: number;
    room_type: string;
    label: string;
    bunk_num: number;
    level: string;
    is_active: boolean;
    blocked_dates: string[];
    block_type?: string;
}

interface BedMapProps {
    checkIn: string;  // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
    selectedBedIds: number[];
    maxSelections: number;
    onSelectBed: (bedId: number) => void;
}

const BedMap: React.FC<BedMapProps> = ({ checkIn, checkOut, selectedBedIds, maxSelections, onSelectBed }) => {
    const [beds, setBeds] = useState<Bed[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!checkIn || !checkOut) return;
        setLoading(true);

        fetch(`/api/beds/availability?room_type=compartido&from=${checkIn}&to=${checkOut}`)
            .then(res => res.json())
            .then((data: Bed[]) => {
                setBeds(data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [checkIn, checkOut]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <span className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    // Group beds by bunk number
    const bunks: { [key: number]: { arriba?: Bed; abajo?: Bed } } = {};
    beds.forEach(bed => {
        if (!bunks[bed.bunk_num]) bunks[bed.bunk_num] = {};
        if (bed.level === 'arriba') bunks[bed.bunk_num].arriba = bed;
        else bunks[bed.bunk_num].abajo = bed;
    });

    const getBedStatus = (bed: Bed): 'available' | 'blocked' | 'selected' => {
        if (selectedBedIds.includes(bed.id)) return 'selected';
        if (!bed.is_active || (bed.blocked_dates && bed.blocked_dates.length > 0)) return 'blocked';
        return 'available';
    };

    const getBedStyle = (status: 'available' | 'blocked' | 'selected') => {
        switch (status) {
            case 'selected':
                return 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400/40 shadow-lg shadow-emerald-500/20';
            case 'blocked':
                return 'border-red-500/30 bg-red-500/5 opacity-50 cursor-not-allowed';
            case 'available':
                return 'border-zinc-700 bg-zinc-900/60 hover:border-emerald-500/40 hover:bg-emerald-500/5 cursor-pointer';
        }
    };

    const renderBed = (bed: Bed | undefined, isTop: boolean) => {
        if (!bed) return null;
        const status = getBedStatus(bed);
        const isSelected = status === 'selected';
        const isClickable = (status === 'available' && selectedBedIds.length < maxSelections) || isSelected;

        return (
            <button
                onClick={() => (isClickable || isSelected) && onSelectBed(bed.id)}
                disabled={!isClickable && !isSelected}
                className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 ${getBedStyle(status)} ${!isClickable && !isSelected ? 'opacity-40 grayscale' : ''}`}
            >
                {/* Bed icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${status === 'selected'
                    ? 'bg-emerald-500 text-white'
                    : status === 'blocked'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                    {status === 'selected' ? (
                        <Check size={16} strokeWidth={3} />
                    ) : status === 'blocked' ? (
                        <Lock size={14} />
                    ) : (
                        <User size={14} />
                    )}
                </div>

                {/* Label */}
                <div className="flex-1 text-left">
                    <p className={`text-xs font-bold ${status === 'selected' ? 'text-emerald-300' : status === 'blocked' ? 'text-red-400/70' : 'text-zinc-300'
                        }`}>
                        {isTop ? '▲ Arriba' : '▼ Abajo'}
                    </p>
                    <p className={`text-[10px] ${status === 'blocked' ? 'text-red-500/50' : 'text-zinc-500'}`}>
                        {status === 'blocked' ? 'Ocupada' : status === 'selected' ? '¡Tu cama!' : 'Disponible'}
                    </p>
                </div>

                {/* Status dot */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${status === 'selected'
                    ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50'
                    : status === 'blocked'
                        ? 'bg-red-500/50'
                        : 'bg-emerald-500'
                    }`} />
            </button>
        );
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-bold text-white mb-1 font-['Arial']">Elegí tus camas</h3>
                <p className="text-[22px] text-zinc-400 font-['Calibri'] italic">
                    {selectedBedIds.length === 0 
                        ? `Seleccioná las ${maxSelections} camas para tu grupo.`
                        : selectedBedIds.length < maxSelections 
                            ? `Te faltan ${maxSelections - selectedBedIds.length} ${maxSelections - selectedBedIds.length === 1 ? 'cama' : 'camas'}.`
                            : '¡Camas seleccionadas correctamente!'}
                </p>
            </div>

            {/* Croquis visual */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-4">
                {/* Room label */}
                <div className="text-center mb-4">
                    <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Vista aérea — Cabaña Compartida</p>
                </div>

                {/* 4 Bunks in a grid */}
                <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(bunkNum => (
                        <div key={bunkNum} className="space-y-1.5">
                            {/* Bunk header */}
                            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider text-center">
                                Cucheta {bunkNum}
                            </p>
                            {/* Top bed */}
                            {renderBed(bunks[bunkNum]?.arriba, true)}
                            {/* Bottom bed */}
                            {renderBed(bunks[bunkNum]?.abajo, false)}
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-5 mt-4 pt-3 border-t border-zinc-800">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-zinc-500 text-[10px]">Disponible</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
                        <span className="text-zinc-500 text-[10px]">Tu selección</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                        <span className="text-zinc-500 text-[10px]">Ocupada</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BedMap;

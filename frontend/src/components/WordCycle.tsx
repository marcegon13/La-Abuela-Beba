import React from 'react';
import { RefreshCw, Search, Heart, BarChart3, Recycle } from 'lucide-react';

const WordCycle: React.FC = () => {
    const steps = [
        {
            text: 'Reconocer',
            icon: Search,
            color: 'from-blue-400 to-blue-600',
            description: 'Identificar el ecosistema y sus necesidades.'
        },
        {
            text: 'Preservar',
            icon: Heart,
            color: 'from-emerald-400 to-emerald-600',
            description: 'Protección activa de lo natural y lo cultural.'
        },
        {
            text: 'Medir',
            icon: BarChart3,
            color: 'from-amber-400 to-amber-600',
            description: 'Analizar el impacto y los progresos.'
        },
        {
            text: 'Regenerar',
            icon: Recycle,
            color: 'from-teal-400 to-teal-600',
            description: 'Restaurar y fortalecer la vida del territorio.'
        },
    ];

    return (
        <div className="flex flex-col items-center justify-center py-4 px-4 select-none">
            {/* Cycle Container - Even Smaller */}
            <div className="relative w-full max-w-[240px] md:max-w-[300px] aspect-square flex items-center justify-center">

                {/* Central Core - Smaller */}
                <div className="absolute z-10 w-12 h-12 md:w-16 md:h-16 rounded-full bg-zinc-900 border border-emerald-500/10 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 md:w-8 md:h-8 text-emerald-500/30" />
                </div>

                {/* Static Path */}
                <div className="absolute inset-0 border border-emerald-500/5 rounded-full"></div>

                {/* Rotating Container */}
                <div className="absolute inset-0 animate-[spin_25s_linear_infinite]">
                    {steps.map((step, index) => {
                        const angle = (index * 90) - 90;
                        const radiusPercent = 42;
                        const x = 50 + radiusPercent * Math.cos((angle * Math.PI) / 180);
                        const y = 50 + radiusPercent * Math.sin((angle * Math.PI) / 180);

                        const Icon = step.icon;

                        return (
                            <div
                                key={step.text}
                                className="absolute flex flex-col items-center group cursor-help z-20"
                                style={{
                                    left: `${x}%`,
                                    top: `${y}%`,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                <div className="animate-[spin_25s_linear_infinite_reverse] flex flex-col items-center relative">
                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-[110%] mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-zinc-700/50 p-2 rounded-lg text-center shadow-xl pointer-events-none w-32 left-1/2 -translate-x-1/2 hidden md:block z-50">
                                        <p className="text-[10px] text-zinc-300 leading-tight font-['Calibri']">{step.description}</p>
                                    </div>

                                    {/* Icon Circle - Smaller */}
                                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${step.color} p-[1px] shadow-lg transition-transform group-hover:scale-110 group-hover:shadow-${step.color.split('-')[1]}-500/30 duration-300`}>
                                        <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                                            <Icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
                                        </div>
                                    </div>

                                    {/* Text label - More compact */}
                                    <div className="mt-1.5 text-center">
                                        <span className="block text-[8px] md:text-[10px] font-bold text-white uppercase tracking-wider font-['Arial'] whitespace-nowrap bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/5 transition-colors group-hover:border-white/30">
                                            {step.text}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Mobile Legend - Even more compact */}
            <div className="mt-6 md:hidden flex flex-wrap justify-center gap-2 w-full max-w-[240px]">
                {steps.map(s => (
                    <div key={s.text} className="flex items-center gap-1.5 bg-zinc-900/40 p-1 px-2 rounded-full border border-white/5">
                        <div className={`w-1 h-1 rounded-full bg-gradient-to-r ${s.color}`}></div>
                        <span className="text-[7px] uppercase font-bold text-zinc-500 tracking-wider font-['Arial']">{s.text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WordCycle;

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MediaItem {
    type: 'image' | 'video';
    src: string;
    label?: string;
}

interface MediaSliderProps {
    items: MediaItem[];
    sectionTitle?: string;
    autoPlayInterval?: number;
    fullScreen?: boolean;
    overlayContent?: React.ReactNode;
    imageFit?: 'contain' | 'cover';
    bgColor?: string;
    showLabel?: boolean;
    showControls?: boolean;
    showArrows?: boolean;
    showDots?: boolean;
}

const MediaSlider: React.FC<MediaSliderProps> = ({
    items,
    autoPlayInterval = 6000,
    fullScreen = false,
    overlayContent,
    imageFit = 'cover',
    bgColor = 'bg-black',
    showLabel = true,
    showControls = true,
    showArrows = true,
    showDots = true
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, autoPlayInterval);

        return () => clearInterval(interval);
    }, [items.length, autoPlayInterval]);

    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const goToPrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    if (!items || items.length === 0) return null;

    return (
        <div className={`relative group overflow-hidden ${fullScreen ? 'h-screen' : 'h-[400px] w-full rounded-2xl'} ${bgColor}`}>
            {/* Slides — only render current + next to save GPU/memory */}
            {items.map((item, index) => {
                const nextIndex = (currentIndex + 1) % items.length;
                const prevIndex = (currentIndex - 1 + items.length) % items.length;
                const isActive = index === currentIndex;
                const isAdjacent = index === nextIndex || index === prevIndex;
                if (!isActive && !isAdjacent) return null;

                return (
                    <div
                        key={index}
                        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out flex items-center justify-center ${isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        {/* Overlay for contrast only in fullscreen or cover mode */}
                        {(fullScreen || imageFit === 'cover') && <div className="absolute inset-0 bg-black/30 z-10 pointer-events-none" />}

                        {item.type === 'video' ? (
                            <video
                                src={item.src}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className={`w-full h-full ${imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                                style={{ 
                                    willChange: 'transform',
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'translateZ(0)',
                                }}
                            />
                        ) : (
                            <img
                                src={item.src}
                                alt={item.label || 'Slide'}
                                className={`w-full h-full ${imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                                style={{ imageRendering: '-webkit-optimize-contrast' }}
                            />
                        )}
                    </div>
                );
            })}

            {/* Custom Overlay Content */}
            {overlayContent && (
                <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center">
                    <div className="pointer-events-auto w-full h-full flex flex-col items-center justify-center">
                        {overlayContent}
                    </div>
                </div>
            )}

            {/* Controls & Labels (Z-30) */}
            {showControls && (
                <div className={`absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 md:p-8 ${fullScreen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity duration-300'}`}>
                    {/* Top Spacer */}
                    <div className="flex-1" />

                    {/* Navigation Arrows (Sides) */}
                    {showArrows && (
                        <div className="absolute inset-y-0 left-0 right-0 flex justify-between items-center px-4 pointer-events-none">
                            <button
                                onClick={goToPrev}
                                className="pointer-events-auto p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all shadow-lg"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button
                                onClick={goToNext}
                                className="pointer-events-auto p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-all shadow-lg"
                            >
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    )}

                    {/* Bottom Info: Label + Dots */}
                    <div className="flex flex-col items-center gap-2 pointer-events-auto mt-auto bg-gradient-to-t from-black/99 via-black/40 to-transparent pt-8 pb-2 rounded-b-2xl">
                        {/* Dynamic Label - Only show if defined and not empty */}
                        {showLabel && items[currentIndex].label && (
                            <h3 className="text-lg md:text-xl font-bold font-sans tracking-wide text-white drop-shadow-md text-center animate-fade-in px-4">
                                {items[currentIndex].label}
                            </h3>
                        )}

                        {/* Dots */}
                        {showDots && (
                            <div className="flex gap-2 mt-2">
                                {items.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                        className={`transition-all duration-300 ${idx === currentIndex
                                            ? 'w-2 h-2 bg-emerald-500 scale-125'
                                            : 'w-1.5 h-1.5 bg-white/50 hover:bg-white'
                                            } rounded-full`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaSlider;

import React from 'react';
import { X, ShoppingBag, Leaf } from 'lucide-react';
import { EXTRAS_CATEGORIES } from './BookingModal'; // Use the same data!

interface ProveeduriaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onBookRoom: () => void; // A way to jump to booking
}

export const ProveeduriaModal: React.FC<ProveeduriaModalProps> = ({ isOpen, onClose, onBookRoom }) => {
    if (!isOpen) return null;

    const formatPrice = (price: number) => {
        return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-emerald-500/20 rounded-3xl shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                                <ShoppingBag className="text-emerald-400" size={20} />
                            </div>
                            <h2 className="text-3xl font-bold text-white font-['Arial']">Proveeduría Local</h2>
                        </div>
                        <p className="text-sm text-zinc-400 font-['Calibri'] italic">
                            Consumí productos locales y km 0.
                        </p>
                    </div>
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-zinc-800 rounded-full transition-colors md:relative md:top-auto md:right-auto">
                        <X size={20} className="text-zinc-400" />
                    </button>
                </div>

                <div className="p-8 pt-6">
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl mb-8">
                        <div className="flex gap-3 items-start">
                            <Leaf className="text-emerald-400 shrink-0 mt-1" size={24} />
                            <div>
                                <h3 className="text-md font-bold text-white mb-1">Catálogo de Productos</h3>
                                <p className="text-sm text-zinc-400 leading-relaxed font-['Calibri']">
                                    Todos nuestros proveedores son locales (Chapadmalal). Fomentamos una red libre de envases de un solo uso, fitosanitarios y químicos insolubles en el cuerpo humano.
                                </p>
                                <p className="text-xs text-emerald-500 font-bold mt-2 uppercase tracking-wide">
                                    * Los productos se añaden al realizar tu reserva de estadía.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {EXTRAS_CATEGORIES.map((cat: any) => (
                            <div key={cat.id} className="space-y-4">
                                <div className="border-b border-zinc-800 pb-3">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
                                        <div>
                                            <h4 className="text-lg text-white font-bold font-['Arial'] tracking-wider">{cat.name}</h4>
                                            {cat.supplier && (
                                                <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest mt-1">Proveedor: {cat.supplier} {cat.distance ? `(${cat.distance})` : ''}</p>
                                            )}
                                        </div>
                                        <p className="text-zinc-500 text-xs italic max-w-xs">{cat.description}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {cat.items.map((item: any) => (
                                        <div key={item.id} className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-emerald-500/30 transition-colors group">
                                            <div className="flex justify-between items-start gap-3">
                                                <p className="text-white text-sm font-medium group-hover:text-emerald-400 transition-colors">{item.name}</p>
                                                <p className="text-emerald-400 text-sm font-bold shrink-0">${formatPrice(item.price)} ARS</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 flex flex-col md:flex-row gap-3">
                        <button onClick={onClose}
                            className="px-6 py-3 border border-zinc-700 text-zinc-400 rounded-xl hover:bg-zinc-900 transition-colors flex items-center justify-center font-bold text-sm">
                            Volver
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                onBookRoom();
                            }}
                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                        >
                            Reservar Estadía y Productos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProveeduriaModal;

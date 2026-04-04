import React, { useState } from 'react';

interface BookingWidgetProps {
  basePrice: number;
}

const BookingWidget: React.FC<BookingWidgetProps> = ({ basePrice }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(1);

  const toggleWidget = () => setIsOpen(!isOpen);

  return (
    <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${isOpen ? 'w-80' : 'w-16 h-16'}`}>
      {!isOpen ? (
        <button
          onClick={toggleWidget}
          className="w-16 h-16 rounded-full bg-emerald-600 text-white shadow-lg flex items-center justify-center hover:bg-emerald-700 transition-colors animate-bounce"
          aria-label="Book Now"
        >
          <span className="text-sm font-bold">RESERVA</span>
        </button>
      ) : (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700">
          <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
            <h3 className="font-bold text-lg">Reserva tu Plaza</h3>
            <button onClick={toggleWidget} className="hover:text-zinc-200 text-xl font-bold">&times;</button>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Check-in</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 p-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Check-out</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 p-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Huéspedes</label>
              <select 
                value={guests} 
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full rounded-lg border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 p-2 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
              >
                {[1, 2, 3, 4, 5, 6].map(g => (
                  <option key={g} value={g}>{g} Persona{g > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
               <div className="flex justify-between items-center mb-4">
                  <span className="text-zinc-600 dark:text-zinc-400">Total aprox:</span>
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${basePrice * guests}</span>
               </div>
               <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md hover:shadow-lg">
                 Confirmar Reserva
               </button>
            </div>
            <p className="text-xs text-center text-zinc-500 dark:text-zinc-400 mt-2">
              Sumas +100 pts IRB con esta reserva.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingWidget;

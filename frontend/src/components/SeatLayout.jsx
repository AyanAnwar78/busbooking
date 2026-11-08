import React from 'react';
import { Armchair, CheckCircle2 } from 'lucide-react';

export default function SeatLayout({ seats = [], selectedSeats = [], onToggleSeat, maxSeats = 6 }) {
  // Group seats by row
  const rowsMap = {};
  seats.forEach((seat) => {
    if (!rowsMap[seat.row]) {
      rowsMap[seat.row] = [];
    }
    rowsMap[seat.row].push(seat);
  });

  const sortedRowKeys = Object.keys(rowsMap).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Bus Header / Driver Area */}
      <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span>Bus Front</span>
        </div>
        {/* Steering wheel symbol */}
        <div className="w-10 h-10 rounded-full border-4 border-slate-400 border-dashed flex items-center justify-center text-slate-400">
          <div className="w-3 h-3 rounded-full bg-slate-400"></div>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="space-y-3 max-w-sm mx-auto">
        {sortedRowKeys.map((rowKey) => {
          const rowSeats = rowsMap[rowKey].sort((a, b) => a.col - b.col);

          // Standard 2x2 layout with aisle between col 2 and col 3
          const leftPair = rowSeats.filter((s) => s.col <= 2);
          const rightPair = rowSeats.filter((s) => s.col > 2);

          return (
            <div key={rowKey} className="flex justify-between items-center gap-6">
              {/* Left pair (Cols 1, 2) */}
              <div className="flex gap-2">
                {leftPair.map((seat) => renderSeatButton(seat, selectedSeats, onToggleSeat, maxSeats))}
              </div>

              {/* Aisle */}
              <div className="text-[10px] text-slate-300 font-mono tracking-widest select-none uppercase">
                aisle
              </div>

              {/* Right pair (Cols 3, 4) */}
              <div className="flex gap-2">
                {rightPair.map((seat) => renderSeatButton(seat, selectedSeats, onToggleSeat, maxSeats))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap justify-center items-center gap-6 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md border-2 border-slate-300 bg-white flex items-center justify-center text-slate-400 font-medium text-[10px]">
            1A
          </div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium text-emerald-800">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-slate-200 text-slate-400 flex items-center justify-center font-medium text-[10px] cursor-not-allowed">
            ✕
          </div>
          <span>Booked</span>
        </div>
      </div>
    </div>
  );
}

function renderSeatButton(seat, selectedSeats, onToggleSeat, maxSeats) {
  const isBooked = seat.status === 'BOOKED';
  const isSelected = selectedSeats.includes(seat.seatNumber);

  return (
    <button
      key={seat.seatNumber}
      type="button"
      disabled={isBooked}
      onClick={() => onToggleSeat(seat)}
      title={`Seat ${seat.seatNumber} - ₹${seat.fare || 'Fare'} (${seat.status})`}
      className={`
        relative w-11 h-12 rounded-lg flex flex-col items-center justify-center text-xs transition-all duration-150
        ${
          isBooked
            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            : isSelected
            ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30 ring-2 ring-emerald-600 ring-offset-2 scale-105'
            : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-2 border-slate-200 hover:border-emerald-400 font-medium'
        }
      `}
    >
      <span className="text-[11px] font-semibold">{seat.seatNumber}</span>
      <span className="text-[9px] opacity-75">₹{seat.fare}</span>
    </button>
  );
}


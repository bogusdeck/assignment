import React from 'react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-4xl" }: any) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-end bg-black/80 backdrop-blur-sm sm:p-4"
      style={{ animation: 'fadeIn 0.2s ease-out forwards' }}
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} bg-black border-t-2 sm:border-2 border-purple-400 p-4 sm:p-8 shadow-[0_0_40px_rgba(192,132,252,0.15)] flex flex-col max-h-[90vh]`}
        style={{ animation: 'slideUp 0.3s ease-out forwards' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start border-b border-purple-400/30 pb-4 mb-4">
          <h2 className="text-3xl sm:text-4xl uppercase font-bold text-purple-400">-- {title} --</h2>
          <button type="button" onClick={onClose} className="text-white/70 hover:text-red-400 text-2xl font-bold">
            [ X ]
          </button>
        </div>
        <div className="overflow-y-auto custom-scrollbar flex flex-col flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

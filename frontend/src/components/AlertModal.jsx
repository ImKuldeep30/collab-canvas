import { X, HelpCircle } from "lucide-react";

export default function AlertModal({ isOpen, title = "Notification", message, onClose, onConfirm, type = "alert" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div 
        className="bg-[#121214]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-[0_25px_50px_rgba(0,0,0,0.6)] relative animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle size={16} className="text-rose-400 shrink-0" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-gray-300 text-xs leading-relaxed mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end mt-4">
          {type === "confirm" ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/10 hover:border-white/20 active:scale-[0.99] flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-[0_2px_10px_rgba(244,63,94,0.2)] active:scale-[0.99] flex-1 cursor-pointer"
              >
                Confirm
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-bold py-2.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-xs"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
import { X } from "lucide-react";

export default function AlertModal({ isOpen, title = "Notification", message, onClose, onConfirm, type = "alert" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative transform transition-all">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white shrink-0">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
        <p className="text-gray-300 text-sm mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end mt-4">
          {type === "confirm" ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-xl text-sm font-medium transition-colors flex-1"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors flex-1"
              >
                Confirm
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
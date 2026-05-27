import { useState, useEffect, useRef } from "react";
import { X, Send, Trash2, MessageSquare } from "lucide-react";

// Format timestamp: always show time; show date only if the message is from a previous day
const formatTimestamp = (ts) => {
  if (!ts) return "";
  const date = new Date(ts);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (isToday) return time;

  const dateStr = date.toLocaleDateString([], { day: "numeric", month: "short" });
  return `${dateStr}, ${time}`;
};

export default function ChatPanel({ socket, sessionId, onClose, messages, isAdmin, isChatEnabled }) {
  const [inputMessage, setInputMessage] = useState("");
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket && sessionId) {
      if (!isAdmin && !isChatEnabled) return;
      socket.emit("send-chat", { sessionId, message: inputMessage.trim() });
      setInputMessage("");
    }
  };

  const handleToggleChat = () => {
    if (socket && sessionId && isAdmin) {
      socket.emit("toggle-chat", { sessionId, e: !isChatEnabled });
    }
  };

  const handleClearChats = () => {
    if (socket && sessionId && isAdmin) {
      socket.emit("clear-chats", { sessionId });
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent text-white w-full">

      {/* ── Header ── */}
      <div className="flex justify-between items-center p-4 border-b border-white/10 shrink-0">
        <h3 className="text-white font-black tracking-tight text-sm flex items-center gap-2">
          <MessageSquare size={16} className="text-indigo-400" />
          Session Chat
        </h3>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={handleToggleChat}
                className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  isChatEnabled
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-transparent"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-transparent"
                }`}
              >
                {isChatEnabled ? "Disable Chat" : "Enable Chat"}
              </button>

              <button
                onClick={handleClearChats}
                title="Clear Chat History"
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Messages Area ── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        {messages.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center h-full opacity-60">
            <div className="w-14 h-14 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 shadow-[0_8px_32px_rgba(99,102,241,0.08)]">
              <MessageSquare size={24} className="text-indigo-400" />
            </div>
            <h4 className="text-xs font-bold text-gray-200">No Messages Yet</h4>
            <p className="text-[10px] text-gray-500 mt-1 max-w-[180px] mx-auto leading-relaxed">
              Introduce yourself and start collaborating with your team!
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.socketId === socket?.id;
            const timeLabel = formatTimestamp(msg.timestamp);

            return (
              <div
                key={index}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {/* Sender name — shown only for other people's messages */}
                {!isMe && (
                  <span className="text-[10px] text-indigo-400 mb-1 ml-1 font-extrabold tracking-wide">
                    {msg.username}
                  </span>
                )}

                {/* Message bubble */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs max-w-[85%] break-words shadow-sm leading-relaxed ${
                    isMe
                      ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-tr-none shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                      : "bg-white/5 border border-white/10 text-gray-100 rounded-tl-none shadow-inner"
                  }`}
                >
                  {msg.message}
                </div>

                {/* Timestamp below bubble */}
                {timeLabel && (
                  <span
                    className={`text-[9px] text-gray-500 mt-1 font-medium select-none ${
                      isMe ? "mr-0.5" : "ml-0.5"
                    }`}
                  >
                    {timeLabel}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Input Area ── */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={!isChatEnabled && !isAdmin}
            placeholder={
              !isChatEnabled && !isAdmin ? "Chat has been disabled" : "Type a message..."
            }
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-xs shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || (!isChatEnabled && !isAdmin)}
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white p-2.5 rounded-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}

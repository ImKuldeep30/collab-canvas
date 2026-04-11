import { useState, useEffect, useRef } from "react";

export default function ChatPanel({ socket, sessionId, onClose, messages, isAdmin, isChatEnabled }) {
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket && sessionId) {
      if (!isAdmin && !isChatEnabled) return;
      socket.emit("send-chat", {
        sessionId,
        message: inputMessage.trim(),
      });
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
    <div className="flex flex-col h-full bg-[#1e1e1e] text-white w-full">
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-white/20 bg-[#252525]">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Session Chat
        </h3>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={handleToggleChat}
                className={`text-xs px-2 py-1 rounded transition-colors ${isChatEnabled ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
              >
                {isChatEnabled ? 'Disable' : 'Enable'}
              </button>
              <button
                onClick={handleClearChats}
                className="text-xs px-2 py-1 rounded bg-gray-600 hover:bg-gray-500 transition-colors"
              >
                Clear
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors ml-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-10">
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.socketId === socket.id;
            return (
              <div
                key={index}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {!isMe && (
                  <span className="text-xs text-gray-400 mb-1 ml-1 font-semibold">
                    {msg.username}
                  </span>
                )}
                <div
                  className={`px-3 py-2 rounded-xl text-sm max-w-[85%] break-words shadow-sm ${
                    isMe
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-[#2d2d2d] text-gray-100 rounded-tl-none border border-white/10"
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-white/20 bg-[#252525]">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={!isChatEnabled && !isAdmin}
            placeholder={!isChatEnabled && !isAdmin ? "Chat is disabled by admin" : "Type a message..."}
            className="flex-1 bg-[#1a1a1a] text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || (!isChatEnabled && !isAdmin)}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

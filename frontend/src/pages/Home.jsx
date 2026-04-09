import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import CanvasBoard from "../components/CanvasBoard";
import Navbar from "../components/Navbar";

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canDraw, setCanDraw] = useState(true);

  useEffect(() => {
    const newSocket = io("http://192.168.1.10:4000"); // Socket connection available only after successful login
    setSocket(newSocket);

    // Global session events
    newSocket.on("kicked", (data) => {
      alert(data.message);
      setSessionId(null);
      setIsAdmin(false);
    });

    newSocket.on("session-terminated", (data) => {
      alert(data.message);
      setSessionId(null);
      setIsAdmin(false);
    });

    newSocket.on("permission-updated", (data) => {
      // If this user was updated, update local drawing permission
      if (data.socketId === newSocket.id) {
        setCanDraw(data.canDraw);
      }
    });

    return () => {
      newSocket.off("kicked");
      newSocket.off("session-terminated");
      newSocket.off("permission-updated");
      newSocket.close();
    }
  }, []);

  // Update session credentials periodically or when session changes
  useEffect(() => {
    if (socket && sessionId) {
      socket.emit("get-session-users", sessionId, (response) => {
        setIsAdmin(response.isAdmin);
        setCanDraw(response.canDraw);
      });
    } else {
      setIsAdmin(false);
      setCanDraw(true);
    }
  }, [socket, sessionId]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#171717]">

      {/* Navbar */}
      <div className="w-full flex justify-center pt-2 relative z-50">
        <Navbar socket={socket} sessionId={sessionId} setSessionId={setSessionId} isAdmin={isAdmin} />
      </div>

      {/* Canvas area */}
      <div className="flex-1 border-3 mx-2 mb-2 border-white/20 backdrop-blur-md rounded-2xl overflow-hidden relative z-10" >
        <CanvasBoard socket={socket} sessionId={sessionId} canDraw={canDraw} />
      </div>

    </div>
  );
}

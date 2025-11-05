"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ user, children }: any) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user?._id) return;
    const newSocket = io("http://localhost:5000", {
      query: { userId: user._id },
    });

    newSocket.on("swap-request-received", (data) => {
      toast.info("📩 New swap request received!");
    });

    newSocket.on("swap-accepted", () => {
      toast.success("✅ Your swap was accepted!");
    });

    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import socket from "@/lib/socket";
import api from "@/lib/api";

const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
      setToken(storedToken);
      socket.connect();
      socket.emit("join", parsed._id);
      setupSocketListeners();
    }
  }, []);

  const setupSocketListeners = () => {
    socket.on("swap-request-received", () =>
      toast.info("📩 New swap request!", {
        action: { label: "View", onClick: () => router.push("/requests") },
      })
    );
    socket.on("swap-updated", () =>
      toast.success("✅ Your swap request was accepted!")
    );
    socket.on("swap-rejected", () =>
      toast.error("❌ Your swap request was rejected.")
    );
  };

  const login = async (email: string, password: string) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    setToken(data.token);
    socket.connect();
    socket.emit("join", data.user._id);
    setupSocketListeners();
    router.push("/dashboard");
  };

  const signup = async (name: string, email: string, password: string) => {
    await api.post("/auth/signup", { name, email, password });
    toast.success("Account created! Please log in.");
    router.push("/login");
  };

  const logout = () => {
    socket.disconnect();
    localStorage.clear();
    setUser(null);
    setToken(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

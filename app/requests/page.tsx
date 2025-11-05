"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function RequestsPage() {
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const socket = useSocket();
  const { token } = useAuth();

  // Fetch all requests
  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/swaps");
      setIncoming(data.incoming || []);
      setOutgoing(data.outgoing || []);
    } catch (err) {
      toast.error("Failed to fetch swap requests");
    }
  };

  // Accept swap request
  const handleAccept = async (id: string) => {
    try {
      await api.post(`/swaps/${id}/accept`);
      toast.success("Swap accepted successfully!");
      fetchRequests();
    } catch {
      toast.error("Failed to accept swap");
    }
  };

  // Real-time Socket Events — FIXED to match backend
  useEffect(() => {
    fetchRequests();

    if (socket) {
      // 🔹 When someone sends you a new swap request
      socket.on("newSwapRequest", (data: any) => {
        toast.info(`📩 New swap request from ${data.from}`);
        fetchRequests();
      });

      // 🔹 When your swap request is accepted
      socket.on("swapAccepted", (data: any) => {
        toast.success(`✅ Your swap request was accepted by ${data.otherUser}`);
        fetchRequests();
      });
    }

    // Cleanup
    return () => {
      socket?.off("newSwapRequest");
      socket?.off("swapAccepted");
    };
  }, [socket]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-10">
      {/* Page Header */}
      <motion.h1
        className="text-4xl font-bold text-gray-800 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Swap Requests
      </motion.h1>

      {/* Incoming Requests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Incoming Requests
        </h2>
        {incoming.length === 0 ? (
          <p className="text-gray-500 italic">No incoming requests</p>
        ) : (
          <div className="grid gap-4">
            {incoming.map((req, i) => (
              <motion.div
                key={req._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-gray-200 shadow-sm hover:shadow-md transition">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {req.requester?.name || "Someone"} wants to swap!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-gray-700">
                      <b>{req.requester?.name || "Someone"}</b> wants to swap{" "}
                      <b>{req.offeredEvent?.title}</b> for your{" "}
                      <b>{req.requestedEvent?.title}</b>.
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(req.requestedEvent?.date).toLocaleString()}
                    </p>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleAccept(req._id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Outgoing Requests */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          Outgoing Requests
        </h2>
        {outgoing.length === 0 ? (
          <p className="text-gray-500 italic">No outgoing requests</p>
        ) : (
          <div className="grid gap-4">
            {outgoing.map((req, i) => (
              <motion.div
                key={req._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-gray-200 shadow-sm hover:shadow-md transition">
                  <CardHeader>
                    <CardTitle className="text-lg">Your Request</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">
                      You requested to swap your{" "}
                      <b>{req.offeredEvent?.title}</b> for{" "}
                      <b>{req.requestedEvent?.title}</b>.
                    </p>
                    <p
                      className={`text-sm mt-2 ${
                        req.status === "accepted"
                          ? "text-green-600 font-medium"
                          : "text-yellow-600"
                      }`}
                    >
                      {req.status === "accepted" ? "✅ Accepted" : "⏳ Pending"}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

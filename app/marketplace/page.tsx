"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { io } from "socket.io-client";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MarketplacePage() {
  const [availableEvents, setAvailableEvents] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [socket, setSocket] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // Fetch user
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [available, mine] = await Promise.all([
          api.get("/events/swappable"),
          api.get("/events"),
        ]);
        setAvailableEvents(available.data);
        setMyEvents(mine.data.filter((e: any) => e.isSwappable));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load events");
      }
    };
    fetchEvents();
  }, []);

  // Setup socket
  useEffect(() => {
    if (user) {
      const s = io("http://localhost:5000", { query: { userId: user._id } });

      s.on("newSwapRequest", (data) => {
        toast.info(`New swap request from ${data.from}`);
      });

      s.on("swapAccepted", (data) => {
        toast.success(`Your swap was accepted by ${data.otherUser}`);
      });

      setSocket(s);
      return () => s.disconnect();
    }
  }, [user]);

  const handleSwapRequest = async (
    requestedEventId: string,
    offeredEventId: string
  ) => {
    try {
      await api.post("/swaps", { requestedEventId, offeredEventId });
      toast.success("Swap request sent!");
      setSelectedRequest(null);

      if (socket && user) {
        const event = availableEvents.find((e) => e._id === requestedEventId);
        socket.emit("sendSwapRequest", {
          toUserId: event?.user?._id,
          fromName: user.name,
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send swap request");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">
        🎯 Marketplace
      </h2>

      {availableEvents.length === 0 ? (
        <p className="text-gray-500 text-center mt-10">
          No swappable slots available.
        </p>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {availableEvents.map((event) => (
            <motion.div
              layout
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-lg transition-all duration-300 rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-indigo-700">
                    {event.title}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleString()}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3 text-sm">
                    Posted by:{" "}
                    <span className="font-medium">{event.user?.name}</span>
                  </p>
                  <Button
                    onClick={() => setSelectedRequest(event)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                  >
                    Request Swap
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Swap Selection Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <Dialog
            open={!!selectedRequest}
            onOpenChange={() => setSelectedRequest(null)}
          >
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Swap Request</DialogTitle>
                <DialogDescription>
                  Select one of your swappable slots to offer.
                </DialogDescription>
              </DialogHeader>

              {myEvents.length === 0 ? (
                <p className="text-gray-500 mb-3">
                  You have no swappable events. Mark one as swappable first.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto mt-3">
                  {myEvents.map((e) => (
                    <motion.button
                      key={e._id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() =>
                        handleSwapRequest(selectedRequest._id, e._id)
                      }
                      className="w-full border border-gray-200 rounded-lg p-3 text-left hover:bg-indigo-50 transition"
                    >
                      <div className="font-medium text-gray-800">{e.title}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(e.date).toLocaleString()}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}

              <Button
                variant="secondary"
                onClick={() => setSelectedRequest(null)}
                className="mt-4 w-full"
              >
                Cancel
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

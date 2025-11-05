"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

const SOCKET_URL = "http://localhost:5000";

interface Event {
  _id: string;
  title: string;
  date: string;
  isSwappable: boolean;
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [socket, setSocket] = useState<any>(null);

  // Fetch all events
  const fetchEvents = async () => {
    try {
      const res = await api.get("/events");
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Create new event
  const createEvent = async () => {
    if (!title || !date) return toast.error("Please enter title and date!");
    try {
      await api.post("/events", { title, date });
      toast.success("✅ Event created!");
      setTitle("");
      setDate("");
      fetchEvents();
    } catch {
      toast.error("Failed to create event");
    }
  };

  // Toggle Swappable
  const toggleSwappable = async (id: string, isSwappable: boolean) => {
    try {
      await api.put(`/events/${id}`, { isSwappable: !isSwappable });
      toast.success(
        isSwappable ? "Removed from swappable" : "Marked as swappable"
      );
      fetchEvents();
    } catch {
      toast.error("Failed to update event");
    }
  };

  // Socket Setup
  useEffect(() => {
    if (!token || !user) return;
    const newSocket = io(SOCKET_URL, {
      query: { userId: user._id },
      transports: ["websocket"],
    });
    setSocket(newSocket);

    newSocket.on("swapAccepted", (data: any) => {
      toast.success(`Your swap with ${data.otherUser} was accepted!`);
      fetchEvents();
    });

    newSocket.on("newSwapRequest", (data: any) => {
      toast.info(`${data.from} sent you a swap request`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, user]);

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-10 px-4">
      {/* Header */}
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        My Events
      </h1>

      {/* Create Event Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-10">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Add New Event
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Event title (e.g. Team Meeting)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={createEvent}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Add
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.length === 0 ? (
          <p className="text-center text-gray-500 py-10">
            No events yet. Add your first one above!
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event._id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-lg text-gray-800">
                  {event.title}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(event.date).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => toggleSwappable(event._id, event.isSwappable)}
                className={`py-2 px-4 rounded-lg font-medium transition ${
                  event.isSwappable
                    ? "bg-gray-200 hover:bg-gray-300 text-gray-700"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {event.isSwappable ? "Unmark Swappable" : "Make Swappable"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="flex justify-between bg-white shadow p-4 rounded-lg mb-6">
      <h1 className="font-bold text-xl text-indigo-600">ShiftSwap</h1>
      <div className="space-x-4">
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/marketplace">Marketplace</Link>
            <Link href="/requests">Requests</Link>
            <button
              onClick={logout}
              className="bg-red-500 text-white px-3 py-1 rounded-md"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup">Signup</Link>
          </>
        )}
      </div>
    </nav>
  );
};

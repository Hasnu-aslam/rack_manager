"use client";

import { useOffline } from "@/hooks/useOffline";

export default function OfflineIndicator() {
  const isOnline = useOffline();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded shadow-lg z-50">
      <div className="flex items-center gap-2">
        <span>⚠️</span>
        <span>You are offline. Changes will be synced when you reconnect.</span>
      </div>
    </div>
  );
}

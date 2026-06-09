import { useNotificationsSocket } from "@/hooks/use-notifications-socket";
import { useNotifications } from "@/store";
import { useEffect } from "react";

export function NotificationHub() {
  useNotificationsSocket();
  const fetchNotifications = useNotifications((s) => s.fetchNotifications);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return null;
}

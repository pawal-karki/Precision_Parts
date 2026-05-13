import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { useList, store } from "@/lib/store";
import { api } from "@/lib/api";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function NotificationBell({ className, dotClassName, to = "/customer/notifications", isButton = false, onClick }) {
  const { list: notifications } = useList("notifications");

  const reload = async () => {
    try {
      const rows = await api.getNotifications();
      store.set("notifications", Array.isArray(rows) ? rows : []);
    } catch {
      // Silently fail in background polling
    }
  };

  useEffect(() => {
    reload();
    const interval = setInterval(reload, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const content = (
    <>
      <Icon name="notifications" />
      {unreadCount > 0 && (
        <span className={cn("absolute top-1 right-1 w-2 h-2 bg-error rounded-full ring-2 ring-white dark:ring-neutral-950", dotClassName)} />
      )}
    </>
  );

  const baseClasses = cn(
    "p-2 rounded-full transition-all duration-200 relative flex items-center justify-center font-headline tracking-tight font-semibold",
    className
  );

  if (isButton) {
    return (
      <button type="button" onClick={onClick} className={cn(baseClasses, "text-slate-600 dark:text-slate-300 hover:bg-stone-100/50 dark:hover:bg-neutral-800/50")}>
        {content}
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          baseClasses,
          isActive 
            ? "text-neutral-900 dark:text-white border-b-2 border-stone-400 dark:border-neutral-500 pb-1" 
            : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200"
        )
      }
    >
      {content}
    </NavLink>
  );
}

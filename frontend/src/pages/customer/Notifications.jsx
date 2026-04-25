import { useEffect } from "react";
import { useList, store } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence, PageTransition, StaggerList, FadeInItem, fadeInUp } from "@/components/ui/motion";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const typeConfig = {
  error: {
    icon: "error",
    borderColor: "border-l-error",
    iconColor: "text-error",
    bg: "bg-error-container/10",
    label: "Critical",
    labelColor: "text-error",
    statBg: "bg-error-container/10",
    statBorder: "border-error/20",
  },
  warning: {
    icon: "warning",
    borderColor: "border-l-amber-500",
    iconColor: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    label: "Warnings",
    labelColor: "text-amber-600 dark:text-amber-400",
    statBg: "bg-amber-50 dark:bg-amber-500/10",
    statBorder: "border-amber-200 dark:border-amber-500/20",
  },
  info: {
    icon: "info",
    borderColor: "border-l-secondary",
    iconColor: "text-secondary",
    bg: "bg-secondary-container/10",
    label: "Info",
    labelColor: "text-secondary",
    statBg: "bg-secondary-container/10",
    statBorder: "border-secondary/20",
  },
  success: {
    icon: "check_circle",
    borderColor: "border-l-emerald-500",
    iconColor: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    label: "Resolved",
    labelColor: "text-emerald-600 dark:text-emerald-400",
    statBg: "bg-emerald-50 dark:bg-emerald-500/10",
    statBorder: "border-emerald-200 dark:border-emerald-500/20",
  },
};

export default function Notifications() {
  const { list: notifications } = useList("notifications");
  const toast = useToast();

  const reload = async () => {
    try {
      const rows = await api.getNotifications();
      store.set("notifications", Array.isArray(rows) ? rows : []);
    } catch {
      toast("Could not load notifications", "error");
    }
  };

  useEffect(() => { reload(); }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) {
      toast("All notifications are already read", "info");
      return;
    }
    try {
      await api.markAllRead();
      await reload();
      toast(`Marked ${unread.length} notification${unread.length > 1 ? "s" : ""} as read`, "success");
    } catch {
      toast("Could not mark as read", "error");
    }
  };

  const handleDismiss = async (id) => {
    try {
      await api.markNotificationRead(id);
      await reload();
      toast("Notification dismissed", "info");
    } catch {
      toast("Could not dismiss notification", "error");
    }
  };

  const handleTakeAction = async (notification) => {
    if (!notification.isRead) {
      try { await api.markNotificationRead(notification.id); } catch {}
    }
    await reload();
    toast(`Action taken on: ${notification.title}`, "success");
  };

  const statTypes = ["error", "warning", "info", "success"];

  return (
    <PageTransition>
      <div className="space-y-8 max-w-4xl mx-auto">
        <motion.section variants={fadeInUp} initial="initial" animate="animate" className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-on-surface dark:text-white tracking-tight font-headline">
              Notifications & Alerts
            </h1>
            <p className="text-on-surface-variant dark:text-stone-400 mt-1">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
            <Icon name="done_all" className="text-sm" />
            Mark All Read
          </Button>
        </motion.section>

        {/* Stats */}
        <StaggerList className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statTypes.map((type) => {
            const config = typeConfig[type];
            const count = notifications.filter((n) => n.severity === type).length;
            return (
              <FadeInItem key={type}>
                <div className={`${config.statBg} rounded-xl p-4 border ${config.statBorder}`}>
                  <p className={`text-xs ${config.labelColor} font-bold uppercase tracking-wider`}>
                    {config.label}
                  </p>
                  <p className={`text-2xl font-extrabold ${config.labelColor} mt-1`}>
                    {count}
                  </p>
                </div>
              </FadeInItem>
            );
          })}
        </StaggerList>

        {/* Notification Feed */}
        <section className="space-y-4">
          <AnimatePresence mode="popLayout">
            {notifications.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <Icon name="notifications_off" className="text-5xl text-on-surface-variant/20 mb-3" />
                <p className="text-on-surface-variant text-sm">All caught up! No notifications.</p>
              </motion.div>
            )}
            {notifications.map((notification, i) => {
              const config = typeConfig[notification.type] || typeConfig.info;
              return (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                  exit={{ opacity: 0, x: -80, transition: { duration: 0.25 } }}
                  className={`bg-surface-container-lowest dark:bg-stone-900 rounded-xl p-6 border border-surface-container-low dark:border-stone-800 border-l-4 ${config.borderColor} ${
                    !notification.isRead
                      ? "ring-1 ring-surface-container-highest dark:ring-stone-700"
                      : "opacity-75"
                  } transition-all`}
                >
                  <div className="flex items-start gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.bg}`}
                    >
                      <Icon name={config.icon} className={config.iconColor} />
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm">
                            {notification.title}
                            {!notification.isRead && (
                              <span className="ml-2 w-2 h-2 bg-secondary rounded-full inline-block" />
                            )}
                          </h4>
                          <p className="text-sm text-on-surface-variant mt-1">{notification.message}</p>
                        </div>
                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap ml-4">
                          {new Date(notification.createdAtUtc || notification.time || "").toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="secondary" size="sm" onClick={() => handleTakeAction(notification)}>
                          Take Action
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDismiss(notification.id)}>
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </section>
      </div>
    </PageTransition>
  );
}
     
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { toast, Toaster } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { theme } = useTheme();

  // Request browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Update toast theme based on app theme
  const isDark = theme === "dark" || theme === "pastel-dark";

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        theme={isDark ? "dark" : "light"}
        toastOptions={{
          style: {
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.2)",
            backdropFilter: "blur(20px)",
            padding: "12px 16px",
          },
        }}
      />
    </>
  );
}

/* ============================================================
   In-memory notification history — powers the NotificationBell.
   Toasts vanish after a few seconds; this keeps a running list
   so there's something for the bell to show. Lives in module
   scope (not React state) so plain functions like
   notifyTaskUpdated() can push to it without needing to be hooks.
   ============================================================ */

export interface NotificationRecord {
  id: string;
  title: string;
  description: string;
  variant: "success" | "error" | "warning";
  timestamp: number;
  read: boolean;
}

let records: NotificationRecord[] = [];
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function pushRecord(record: Omit<NotificationRecord, "id" | "timestamp" | "read">) {
  records = [
    {
      ...record,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      read: false,
    },
    ...records,
  ].slice(0, 50); // cap history so it can't grow forever
  emitChange();
}

function markAllRead() {
  records = records.map((r) => ({ ...r, read: true }));
  emitChange();
}

function markRead(id: string) {
  records = records.map((r) => (r.id === id ? { ...r, read: true } : r));
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return records;
}

// Hook for components (like NotificationBell) that need to reactively
// read the history and re-render when it changes.
export function useNotificationHistory() {
  const history = useSyncExternalStore(subscribe, getSnapshot);
  const unreadCount = history.filter((r) => !r.read).length;
  return { history, unreadCount, markAllRead, markRead };
}

// Helper functions for triggering notifications
export function notifyTaskCreated(taskTitle: string) {
  const description = `"${taskTitle}" has been added to the board.`;
  toast.success("Task Created", { description, duration: 3000 });
  pushRecord({ title: "Task Created", description, variant: "success" });
  sendBrowserNotification("Task Created", description);
}

export function notifyTaskUpdated(taskTitle: string) {
  const description = `"${taskTitle}" has been updated.`;
  toast.success("Task Updated", { description, duration: 3000 });
  pushRecord({ title: "Task Updated", description, variant: "success" });
  sendBrowserNotification("Task Updated", description);
}

export function notifyTaskDeleted(taskTitle: string) {
  const description = `"${taskTitle}" has been removed.`;
  toast.error("Task Deleted", { description, duration: 3000 });
  pushRecord({ title: "Task Deleted", description, variant: "error" });
}

export function notifyDeadlineWarning(taskTitle: string, dueDate: string) {
  const description = `"${taskTitle}" is due on ${dueDate}.`;
  toast.warning("Deadline Approaching", {
    description,
    duration: 5000,
    action: {
      label: "View",
      onClick: () => {},
    },
  });
  pushRecord({ title: "Deadline Approaching", description, variant: "warning" });

  sendBrowserNotification(
    "Deadline Approaching",
    `"${taskTitle}" is due on ${dueDate}. Hurry up!`
  );
}

function sendBrowserNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
    });
  }
}

// Hook to check upcoming deadlines
export function useDeadlineChecker(tasks: { id: string; title: string; dueDate: string; column: string }[]) {
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      tasks.forEach((task) => {
        // Skip completed/paused tasks
        if (task.column === "done" || task.column === "paused") return;

        // Skip already notified
        if (notifiedRef.current.has(task.id)) return;

        // Parse dueDate - it's in format like "Nov 24"
        const dueDateStr = task.dueDate;
        const parsed = new Date(`${dueDateStr} ${new Date().getFullYear()}`);

        if (!isNaN(parsed.getTime())) {
          // Check if due within 24 hours or overdue
          if (parsed <= in24Hours) {
            const isOverdue = parsed < now;
            const description = `"${task.title}" ${
              isOverdue ? `was due on ${dueDateStr}.` : `is due on ${dueDateStr}.`
            }`;
            if (isOverdue) {
              toast.error("Overdue!", { description, duration: 6000 });
              pushRecord({ title: "Overdue!", description, variant: "error" });
            } else {
              toast.warning("Deadline Approaching", { description, duration: 5000 });
              pushRecord({ title: "Deadline Approaching", description, variant: "warning" });
            }
            notifiedRef.current.add(task.id);
          }
        }
      });
    };

    // Check immediately and then every 5 minutes
    checkDeadlines();
    const interval = setInterval(checkDeadlines, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [tasks]);
}
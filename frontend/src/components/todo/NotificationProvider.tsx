import { useEffect, useRef, type ReactNode } from "react";
import { toast, Toaster } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { theme } = useTheme();
  const notifiedRef = useRef<Set<string>>(new Set());

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

// Helper functions for triggering notifications
export function notifyTaskCreated(taskTitle: string) {
  toast.success("Task Created", {
    description: `"${taskTitle}" has been added to the board.`,
    duration: 3000,
  });

  sendBrowserNotification("Task Created", `"${taskTitle}" has been added to the board.`);
}

export function notifyTaskUpdated(taskTitle: string) {
  toast.success("Task Updated", {
    description: `"${taskTitle}" has been updated.`,
    duration: 3000,
  });

  sendBrowserNotification("Task Updated", `"${taskTitle}" has been updated.`);
}

export function notifyTaskDeleted(taskTitle: string) {
  toast.error("Task Deleted", {
    description: `"${taskTitle}" has been removed.`,
    duration: 3000,
  });
}

export function notifyDeadlineWarning(taskTitle: string, dueDate: string) {
  toast.warning("Deadline Approaching", {
    description: `"${taskTitle}" is due on ${dueDate}.`,
    duration: 5000,
    action: {
      label: "View",
      onClick: () => {},
    },
  });

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
            if (isOverdue) {
              toast.error("Overdue!", {
                description: `"${task.title}" was due on ${dueDateStr}.`,
                duration: 6000,
              });
            } else {
              toast.warning("Deadline Approaching", {
                description: `"${task.title}" is due on ${dueDateStr}.`,
                duration: 5000,
              });
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


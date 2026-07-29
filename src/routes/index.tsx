import { createFileRoute } from "@tanstack/react-router";
import { TodoApp } from "@/components/todo/TodoApp";
import { LoginPage } from "@/components/todo/LoginPage";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Task Board — Homepage Design" },
      {
        name: "description",
        content:
          "A responsive Kanban and list task board for managing design projects.",
      },
      { property: "og:title", content: "Task Board — Homepage Design" },
      {
        property: "og:description",
        content:
          "A responsive Kanban and list task board for managing design projects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <AuthProvider>
      <IndexInner />
    </AuthProvider>
  );
}

function IndexInner() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-app-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <TodoApp />;
}

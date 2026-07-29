import { createFileRoute } from "@tanstack/react-router";
import { TodoApp } from "@/components/todo/TodoApp";
import { LoginPage } from "@/components/todo/LoginPage";
import { useAuth } from "@/contexts/AuthContext";
import { AuthProvider } from "@/contexts/AuthContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Team Task Board" },
      {
        name: "description",
        content:
          "A pastel-themed team task board with glass UI.",
      },
      { property: "og:title", content: "Team Task Board" },
      {
        property: "og:description",
        content:
          "A pastel-themed team task board with glass UI.",
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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
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

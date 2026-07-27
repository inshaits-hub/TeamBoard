import { createFileRoute } from "@tanstack/react-router";
import { TodoApp } from "@/components/todo/TodoApp";

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
  return <TodoApp />;
}

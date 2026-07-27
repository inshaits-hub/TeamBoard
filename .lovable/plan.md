## Plan: Responsive TODO App (Frontend Only)

### What we'll build
A single-page TODO app at `/` that replaces the placeholder. It will include:
- **List view** and **Kanban board view** with a toggle.
- **Add, edit, delete** tasks.
- **Drag-and-drop** to move tasks between Kanban columns.
- **Priority/labels** (e.g., Low, Medium, High + category tags like UI Design, Copywriting, Illustration).
- **Search/filter** by text and label.
- **In-memory state** (resets on refresh, as requested).
- Responsive layout: sidebar collapses on mobile, board scrolls horizontally on small screens, list stacks vertically.

### Design direction
Match the uploaded reference image:
- Soft pastel background (`#fcfbf8` / warm off-white) with rounded-2xl cards.
- Pastel label badges (lavender, mint, peach, sky blue).
- Purple/indigo primary accent for buttons and active states.
- Clean card shadows, generous whitespace, and a right-side summary panel.
- Existing dark/light tokens in `src/styles.css` will be extended rather than replaced.

### Technical approach
- Keep everything in the browser: React `useState` and `useMemo`, no backend or localStorage.
- Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop (lightweight, accessible, touch-friendly).
- Use `lucide-react` for icons and existing shadcn-style Tailwind tokens.
- Add new semantic color tokens to `src/styles.css` for the pastel palette.
- Build small components under `src/components/todo/`:
  - `TodoApp.tsx` — main container, state, view toggle, search/filter.
  - `ListView.tsx` — checklist layout.
  - `BoardView.tsx` — Kanban columns.
  - `TaskCard.tsx` — shared card UI.
  - `TaskForm.tsx` — add/edit modal or inline form.
  - `Sidebar.tsx` — progress summary and recent activity.
  - `types.ts` — Task, Column, Label types.
- Replace `src/routes/index.tsx` with the new TODO app and add route-specific `head()` metadata.
- Keep `src/routes/__root.tsx` as the shared shell.

### Implementation steps
1. Extend `src/styles.css` with pastel semantic tokens (background, label colors, primary accent).
2. Install `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`.
3. Create `src/components/todo/types.ts` and the component files above.
4. Rewrite `src/routes/index.tsx` to render `TodoApp` with proper `head()` metadata.
5. Verify responsiveness in the preview and run the build/typecheck.

### Out of scope
- Backend persistence or localStorage (in-memory only per request).
- User authentication.
- Real-time collaboration.

### Deliverable
A polished, responsive TODO app at `/` with list + Kanban views, drag-and-drop, labels, priority, and search/filter.
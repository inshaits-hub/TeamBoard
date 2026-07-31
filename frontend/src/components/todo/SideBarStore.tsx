import { useSyncExternalStore } from "react";

let isOpen = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function toggleSidebarPanel() {
  isOpen = !isOpen;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return isOpen;
}

export function useSidebarPanelOpen() {
  return useSyncExternalStore(subscribe, getSnapshot);
}
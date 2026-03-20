import type { ReactNode } from "react";

export interface ResponseRenderer {
  id: string;
  name: string;
  match: (content: string) => boolean;
  render: (content: string, onAction?: (msg: string) => void) => ReactNode;
  priority: number;
  enabled: boolean;
}

const registry: ResponseRenderer[] = [];

export function registerRenderer(renderer: ResponseRenderer): void {
  const idx = registry.findIndex((r) => r.id === renderer.id);
  if (idx >= 0) {
    registry[idx] = renderer;
  } else {
    registry.push(renderer);
  }
  registry.sort((a, b) => b.priority - a.priority);
}

export function unregisterRenderer(id: string): void {
  const idx = registry.findIndex((r) => r.id === id);
  if (idx >= 0) registry.splice(idx, 1);
}

export function getRenderers(): ResponseRenderer[] {
  return registry.filter((r) => r.enabled);
}

export function findMatchingRenderer(
  content: string,
): ResponseRenderer | null {
  for (const r of registry) {
    if (r.enabled && r.match(content)) return r;
  }
  return null;
}

export function setRendererEnabled(id: string, enabled: boolean): void {
  const r = registry.find((r) => r.id === id);
  if (r) r.enabled = enabled;
}

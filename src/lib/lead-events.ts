import "server-only";
import { EventEmitter } from "node:events";

/**
 * In-process signal that the lead inbox changed (new lead, status change, deletion).
 * Cached on globalThis so route handlers and server actions share one emitter.
 */
const g = globalThis as typeof globalThis & { __leadEvents?: EventEmitter };
export const leadEvents = (g.__leadEvents ??= new EventEmitter().setMaxListeners(200));

export function leadsChanged(): void {
  leadEvents.emit("change");
}

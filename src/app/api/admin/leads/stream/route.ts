import { isAdmin } from "@/lib/auth";
import { leadEvents } from "@/lib/lead-events";
import { inboxState } from "@/lib/repo/leads";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events for the admin panel: sends the inbox snapshot on connect and again
 * whenever a lead is created, marked or deleted, so open tabs update without a reload.
 */
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });

  const encoder = new TextEncoder();
  let stop = () => {};
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let last = "";
      const write = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          stop();
        }
      };
      const push = () => {
        const state = JSON.stringify(inboxState());
        if (state === last) return;
        last = state;
        write(`data: ${state}\n\n`);
      };

      write("retry: 3000\n\n");
      push();
      leadEvents.on("change", push);
      // Safety net for changes the emitter cannot see (another server process), plus a
      // keep-alive comment so proxies do not close an idle connection.
      const poll = setInterval(push, 10_000);
      const ping = setInterval(() => write(": ping\n\n"), 25_000);

      stop = () => {
        leadEvents.off("change", push);
        clearInterval(poll);
        clearInterval(ping);
      };
      request.signal.addEventListener("abort", () => {
        stop();
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      });
    },
    cancel() {
      stop();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      // no-transform keeps compression from buffering the events; X-Accel-Buffering does the same for nginx.
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

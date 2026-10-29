import {
  ConfigurationError,
  getAssistant,
  runAssistant,
} from "@/lib/assistant";
import { resolveVisitor, responseHeaders } from "@/lib/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request): Promise<Response> {
  let body: { message?: unknown; sessionId?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  const sessionId = typeof body.sessionId === "string" ? body.sessionId : undefined;
  if (!message || message.length > 4_000) {
    return Response.json({ error: "Message must be between 1 and 4,000 characters." }, { status: 400 });
  }

  const visitor = resolveVisitor(request);
  try {
    if (sessionId) {
      const existing = await getAssistant().get(sessionId);
      if (existing.metadata.visitorId !== visitor.id || existing.metadata.surface !== "web") {
        return Response.json({ error: "Conversation not found." }, { status: 404 });
      }
    }
    const result = await runAssistant({
      message,
      sessionId,
      name: message.length > 52 ? `${message.slice(0, 49)}…` : message,
      metadata: { surface: "web", visitorId: visitor.id },
    });
    return Response.json(result, { headers: responseHeaders(visitor.setCookie) });
  } catch (error) {
    const status = error instanceof ConfigurationError ? 503 : 500;
    return Response.json(
      { error: error instanceof ConfigurationError ? error.message : "The assistant could not respond." },
      { status, headers: responseHeaders(visitor.setCookie) },
    );
  }
}

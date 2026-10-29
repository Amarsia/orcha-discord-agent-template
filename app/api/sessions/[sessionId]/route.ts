import { ConfigurationError, getAssistant } from "@/lib/assistant";
import { resolveVisitor, responseHeaders } from "@/lib/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ sessionId: string }> };

export async function GET(request: Request, context: Context): Promise<Response> {
  const { sessionId } = await context.params;
  if (!/^ses_[a-zA-Z0-9_-]+$/.test(sessionId)) {
    return Response.json({ error: "Invalid conversation ID." }, { status: 400 });
  }

  const visitor = resolveVisitor(request);
  try {
    const assistant = getAssistant();
    const session = await assistant.get(sessionId);
    if (session.metadata.visitorId !== visitor.id || session.metadata.surface !== "web") {
      return Response.json({ error: "Conversation not found." }, { status: 404 });
    }
    const history = await assistant.history(sessionId, { page: 1, pageSize: 200 });
    return Response.json(history, { headers: responseHeaders(visitor.setCookie) });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof ConfigurationError
            ? error.message
            : "Conversation could not be loaded.",
      },
      {
        status: error instanceof ConfigurationError ? 503 : 404,
        headers: responseHeaders(visitor.setCookie),
      },
    );
  }
}

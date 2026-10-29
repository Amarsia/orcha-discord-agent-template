import { ConfigurationError, getAssistant } from "@/lib/assistant";
import { resolveVisitor, responseHeaders } from "@/lib/visitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const visitor = resolveVisitor(request);
  try {
    const sessions = await getAssistant().list({
      page: 1,
      pageSize: 20,
      metadata: { surface: "web", visitorId: visitor.id },
    });
    return Response.json(sessions, { headers: responseHeaders(visitor.setCookie) });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof ConfigurationError
            ? error.message
            : "Recent sessions could not be loaded.",
      },
      {
        status: error instanceof ConfigurationError ? 503 : 500,
        headers: responseHeaders(visitor.setCookie),
      },
    );
  }
}

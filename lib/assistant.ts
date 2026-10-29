import type { AgentRuntime } from "orchajs";

import { orcha } from "@/orcha";

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export function getAssistant(): AgentRuntime {
  if (!process.env.OPENAI_API_KEY) {
    throw new ConfigurationError("OPENAI_API_KEY is not configured.");
  }
  const assistant = orcha.assistant as AgentRuntime | undefined;
  if (!assistant) {
    throw new ConfigurationError('The "assistant" agent is not registered.');
  }
  return assistant;
}

export function outputToText(output: unknown): string {
  if (typeof output === "string") return output;
  if (output === null || output === undefined) return "";
  return JSON.stringify(output, null, 2);
}

export async function runAssistant(input: {
  message: string;
  sessionId?: string;
  name: string;
  metadata: Record<string, string>;
}): Promise<{ sessionId: string; output: string }> {
  const assistant = getAssistant();
  const execution = input.sessionId
    ? assistant.resume(input.sessionId, { content: input.message })
    : assistant.run({
        content: input.message,
        name: input.name,
        metadata: input.metadata,
      });
  const result = await execution.result;
  if (result.status === "failed") {
    throw new Error(result.error?.message ?? "The assistant could not complete the request.");
  }
  const output = outputToText(result.output);
  if (!output) throw new Error("The assistant returned an empty response.");
  return { sessionId: execution.sessionId, output };
}

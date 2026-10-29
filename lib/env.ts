import { z } from "zod";

const sharedSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  ORCHA_SESSION_DIRECTORY: z.string().default(".orcha/sessions"),
  AMARSIA_PROJECT_KEY: z.string().optional(),
  AMARSIA_API_URL: z.url().optional(),
});

const discordSchema = sharedSchema.extend({
  DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
  DISCORD_CLIENT_ID: z.string().regex(/^\d+$/, "DISCORD_CLIENT_ID must be a Discord snowflake"),
  DISCORD_GUILD_ID: z
    .string()
    .regex(/^\d+$/, "DISCORD_GUILD_ID must be a Discord snowflake")
    .optional(),
});

export type DiscordEnvironment = z.infer<typeof discordSchema>;

function formatError(error: z.ZodError): Error {
  return new Error(
    `Invalid environment:\n${error.issues.map((issue) => `- ${issue.path.join(".")}: ${issue.message}`).join("\n")}`,
  );
}

export function validateSharedEnv(): z.infer<typeof sharedSchema> {
  const result = sharedSchema.safeParse(process.env);
  if (!result.success) throw formatError(result.error);
  return result.data;
}

export function validateDiscordEnv(): DiscordEnvironment {
  const result = discordSchema.safeParse(process.env);
  if (!result.success) throw formatError(result.error);
  return result.data;
}

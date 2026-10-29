export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(
    {
      assistantConfigured: Boolean(process.env.OPENAI_API_KEY),
      discordConfigured: Boolean(process.env.DISCORD_TOKEN && process.env.DISCORD_CLIENT_ID),
      guildMode: process.env.DISCORD_GUILD_ID ? "development" : "global",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

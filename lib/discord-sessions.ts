import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

type SessionMap = Record<string, string>;

const mapFile = path.join(
  process.env.ORCHA_SESSION_DIRECTORY ?? ".orcha/sessions",
  "discord-session-map.json",
);

let writeQueue = Promise.resolve();

async function readMap(): Promise<SessionMap> {
  try {
    return JSON.parse(await readFile(mapFile, "utf8")) as SessionMap;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

async function writeMap(value: SessionMap): Promise<void> {
  await mkdir(path.dirname(mapFile), { recursive: true });
  const temporary = `${mapFile}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  await rename(temporary, mapFile);
}

export function discordConversationKey(input: {
  guildId: string | null;
  channelId: string;
  threadId?: string | null;
  userId: string;
}): string {
  if (!input.guildId) return `dm:${input.userId}`;
  return `guild:${input.guildId}:channel:${input.threadId ?? input.channelId}`;
}

export async function getDiscordSession(key: string): Promise<string | undefined> {
  return (await readMap())[key];
}

export async function setDiscordSession(key: string, sessionId: string): Promise<void> {
  writeQueue = writeQueue.then(async () => {
    const current = await readMap();
    current[key] = sessionId;
    await writeMap(current);
  });
  return writeQueue;
}

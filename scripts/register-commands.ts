import "dotenv/config";

import { REST, Routes } from "discord.js";

import { commands } from "../discord/commands";
import { validateDiscordEnv } from "../lib/env";

const env = validateDiscordEnv();
const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
const route = env.DISCORD_GUILD_ID
  ? Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID)
  : Routes.applicationCommands(env.DISCORD_CLIENT_ID);

await rest.put(route, { body: commands });
console.info(
  `Registered ${commands.length} commands ${env.DISCORD_GUILD_ID ? `for guild ${env.DISCORD_GUILD_ID}` : "globally"}.`,
);

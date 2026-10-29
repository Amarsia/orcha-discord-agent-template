import "dotenv/config";

import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  type ChatInputCommandInteraction,
  type Message,
} from "discord.js";

import { botConfig } from "../config/bot";
import { runAssistant } from "../lib/assistant";
import {
  discordConversationKey,
  getDiscordSession,
  setDiscordSession,
} from "../lib/discord-sessions";
import { validateDiscordEnv } from "../lib/env";
import {
  promptFromCommand,
  replyToInteraction,
  replyToMessage,
} from "./respond";

const env = validateDiscordEnv();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

function conversationFor(input: {
  guildId: string | null;
  channelId: string;
  userId: string;
  isThread: boolean;
}): string {
  return discordConversationKey({
    guildId: input.guildId,
    channelId: input.channelId,
    threadId: input.isThread ? input.channelId : null,
    userId: input.userId,
  });
}

async function answer(input: {
  message: string;
  key: string;
  userId: string;
  guildId: string | null;
  channelId: string;
}): Promise<string> {
  const existingSession = await getDiscordSession(input.key);
  const result = await runAssistant({
    message: input.message,
    sessionId: existingSession,
    name: `Discord conversation ${input.channelId}`,
    metadata: {
      surface: "discord",
      discordConversationKey: input.key,
      discordUserId: input.userId,
      discordGuildId: input.guildId ?? "dm",
      discordChannelId: input.channelId,
    },
  });
  if (result.sessionId !== existingSession) {
    await setDiscordSession(input.key, result.sessionId);
  }
  return result.output;
}

async function handleAsk(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply();
  const key = conversationFor({
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    userId: interaction.user.id,
    isThread: interaction.channel?.isThread() ?? false,
  });
  const output = await answer({
    message: promptFromCommand(interaction),
    key,
    userId: interaction.user.id,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
  });
  await replyToInteraction(interaction, output);
}

async function handleMessage(message: Message): Promise<void> {
  if (message.author.bot || !client.user) return;
  const isDirectMessage = !message.guildId;
  const isMentioned = message.mentions.has(client.user);
  if (!isDirectMessage && !isMentioned) return;

  const prompt = message.content
    .replace(new RegExp(`<@!?${client.user.id}>`, "g"), "")
    .trim();
  if (!prompt) {
    await replyToMessage(message, "Mention me with a question, or use `/ask`.");
    return;
  }

  await message.channel.sendTyping();
  const key = conversationFor({
    guildId: message.guildId,
    channelId: message.channelId,
    userId: message.author.id,
    isThread: message.channel.isThread(),
  });
  const output = await answer({
    message: prompt,
    key,
    userId: message.author.id,
    guildId: message.guildId,
    channelId: message.channelId,
  });
  await replyToMessage(message, output);
}

client.once(Events.ClientReady, (readyClient) => {
  readyClient.user.setActivity(botConfig.status, { type: ActivityType.Listening });
  console.info(`Discord worker ready as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    if (interaction.commandName === "help") {
      await replyToInteraction(
        interaction,
        botConfig.commands.map((command) => `**/${command.name}** — ${command.description}`).join("\n"),
      );
    } else if (interaction.commandName === "ask") {
      await handleAsk(interaction);
    }
  } catch (error) {
    console.error("Interaction failed", error);
    await replyToInteraction(interaction, "I couldn't complete that request. Please try again.");
  }
});

client.on(Events.MessageCreate, (message) => {
  void handleMessage(message).catch(async (error) => {
    console.error("Message handling failed", error);
    await replyToMessage(message, "I couldn't complete that request. Please try again.");
  });
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    client.destroy();
    process.exit(0);
  });
}

void client.login(env.DISCORD_TOKEN);

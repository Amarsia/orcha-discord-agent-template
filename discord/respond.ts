import type {
  ChatInputCommandInteraction,
  Message,
  RepliableInteraction,
} from "discord.js";

export const DISCORD_MESSAGE_LIMIT = 2_000;

export function splitDiscordMessage(text: string): string[] {
  const chunks: string[] = [];
  let remaining = text.trim();
  while (remaining.length > DISCORD_MESSAGE_LIMIT) {
    const window = remaining.slice(0, DISCORD_MESSAGE_LIMIT);
    const boundary = Math.max(window.lastIndexOf("\n"), window.lastIndexOf(" "));
    const splitAt = boundary > 1_000 ? boundary : DISCORD_MESSAGE_LIMIT;
    chunks.push(remaining.slice(0, splitAt).trimEnd());
    remaining = remaining.slice(splitAt).trimStart();
  }
  if (remaining) chunks.push(remaining);
  return chunks.length ? chunks : ["The assistant returned an empty response."];
}

export async function replyToInteraction(
  interaction: RepliableInteraction,
  text: string,
): Promise<void> {
  const [first, ...rest] = splitDiscordMessage(text);
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ content: first, allowedMentions: { parse: [] } });
  } else {
    await interaction.reply({ content: first, allowedMentions: { parse: [] } });
  }
  for (const chunk of rest) {
    await interaction.followUp({ content: chunk, allowedMentions: { parse: [] } });
  }
}

export async function replyToMessage(message: Message, text: string): Promise<void> {
  for (const [index, chunk] of splitDiscordMessage(text).entries()) {
    await message.reply({
      content: chunk,
      allowedMentions: { parse: [], repliedUser: index === 0 },
    });
  }
}

export function promptFromCommand(interaction: ChatInputCommandInteraction): string {
  return interaction.options.getString("prompt", true).trim();
}

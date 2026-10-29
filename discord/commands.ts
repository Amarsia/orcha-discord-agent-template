import { SlashCommandBuilder } from "discord.js";

export const commands = [
  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask the Orcha assistant a question")
    .addStringOption((option) =>
      option
        .setName("prompt")
        .setDescription("What would you like to ask?")
        .setMaxLength(4_000)
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show available commands and usage tips"),
].map((command) => command.toJSON());

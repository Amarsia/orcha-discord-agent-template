export type BotCapability = {
  title: string;
  description: string;
};

export type BotCommand = {
  name: "ask" | "help";
  description: string;
  usage: string;
};

export const botConfig = {
  name: "Orcha Guide",
  username: "orcha-guide",
  description:
    "A production-ready Discord assistant that brings durable Orcha conversations into your community.",
  status: "Ask me anything",
  accent: "#5865f2",
  capabilities: [
    {
      title: "Context-aware answers",
      description: "Continue a durable conversation in a channel, thread, or DM.",
    },
    {
      title: "Discord-native workflow",
      description: "Use slash commands, mentions, or direct messages without leaving Discord.",
    },
    {
      title: "Shared Orcha runtime",
      description: "The web test chat and Discord worker use one assistant definition.",
    },
  ] satisfies BotCapability[],
  commands: [
    {
      name: "ask",
      description: "Ask the assistant a question.",
      usage: "/ask prompt: How should we structure this project?",
    },
    {
      name: "help",
      description: "Show commands and usage tips.",
      usage: "/help",
    },
  ] satisfies BotCommand[],
  suggestedPrompts: [
    "Summarize the trade-offs of this architecture.",
    "Turn these requirements into an implementation plan.",
    "Explain this concept with a practical example.",
  ],
  links: {
    orcha: "https://github.com/Amarsia/orcha",
    discordDeveloperPortal: "https://discord.com/developers/applications",
  },
} as const;

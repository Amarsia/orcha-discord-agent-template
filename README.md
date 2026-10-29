# Orcha Discord Agent Template

A production-quality Discord assistant powered by [OrchaJS](https://github.com/Amarsia/orcha), `discord.js`, and Next.js 16.4.3. The template includes a long-running Discord worker, durable conversation mapping, and a polished local console for inspecting setup and testing the same assistant used by Discord.

## Features

- `/ask` and `/help` application commands
- Direct-message and bot-mention support
- Durable sessions scoped to each DM, channel, or thread
- Replies deferred before model work and safely split at Discord's 2,000-character limit
- Shared server-side Orcha assistant for Discord and local web chat
- Visitor-isolated web sessions with HttpOnly, SameSite cookies
- Bot profile, connection state, capabilities, commands, sessions, and themes
- Validated environment configuration and command registration script
- One-process Docker startup for the web app and Discord worker

## Requirements

- Node.js 20.9 or newer
- An OpenAI API key
- A Discord application and bot token

## Discord setup

1. Create an application in the [Discord Developer Portal](https://discord.com/developers/applications).
2. On **Bot**, create a bot and enable the **Message Content Intent**. This is required for DM and mention-based prompts; slash commands work without message content.
3. Under **OAuth2 → URL Generator**, select `bot` and `applications.commands`. Grant View Channels, Send Messages, Read Message History, and Use Slash Commands.
4. Copy the application ID and bot token into your local environment.

Never commit a bot token. Rotate it immediately if it is exposed.

## Local setup

```bash
npm install
cp .env.example .env
```

Fill in `OPENAI_API_KEY`, `DISCORD_TOKEN`, and `DISCORD_CLIENT_ID`. During development, set `DISCORD_GUILD_ID` so command updates appear immediately. Production deployments must also provide a random `VISITOR_COOKIE_SECRET` of at least 32 characters.

Register commands:

```bash
npm run discord:register
```

Run both services:

```bash
npm run dev:all
```

Or run them independently with `npm run dev` and `npm run dev:discord`.

## Customize

- Product and Discord-facing identity: `config/bot.ts`
- Agent model: `orcha/assistant/index.json`
- Agent behavior: `orcha/assistant/instructions.md`
- Theme and visual system: `app/globals.css`

## Session behavior

Discord identities are converted to stable conversation keys:

- DMs: one session per Discord user
- Guild channels: one session per guild channel
- Threads: one session per thread

The mapping is stored alongside Orcha data in `ORCHA_SESSION_DIRECTORY`. Web test sessions use separate `surface: "web"` metadata plus a signed, unguessable visitor cookie. API routes verify ownership before resuming or reading any session, so a web visitor cannot access Discord or another visitor's history.

The bundled JSONL store is intended for a single application instance with persistent disk. For horizontal scaling, replace it and the Discord session map with a shared transactional store.

## Docker

```bash
docker build -t orcha-discord-agent .
docker run --env-file .env.local -p 3000:3000 \
  -v orcha-sessions:/data/sessions orcha-discord-agent
```

The container starts Next.js and the Discord worker together. If either process exits, the orchestration script terminates the other so the container can be restarted by your platform.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the Next.js console |
| `npm run dev:discord` | Run the Discord worker in watch mode |
| `npm run dev:all` | Run both development services |
| `npm run discord:register` | Register guild or global commands |
| `npm start` | Run both production services |
| `npm run agent:playground` | Open the Orcha playground |

## License

MIT

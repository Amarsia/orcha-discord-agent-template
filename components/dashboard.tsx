"use client";

import {
  ArrowUp,
  Bot,
  Check,
  CircleAlert,
  Command,
  ExternalLink,
  Hash,
  MessageCircle,
  Radio,
  Server,
  Sparkles,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { ThemeSelector } from "@/components/theme-selector";
import { botConfig } from "@/config/bot";
import { contentToText, type ChatMessage, type SessionSummary } from "@/lib/chat-types";

type Status = {
  assistantConfigured: boolean;
  discordConfigured: boolean;
  guildMode: "development" | "global";
};

type HistoryResponse = {
  items?: Array<{
    id?: string;
    type?: string;
    role?: "user" | "assistant";
    content?: unknown;
    createdAt?: string;
  }>;
  error?: string;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function Dashboard() {
  const [status, setStatus] = useState<Status>();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    try {
      const [statusResponse, sessionsResponse] = await Promise.all([
        fetch("/api/status", { cache: "no-store" }),
        fetch("/api/sessions", { cache: "no-store" }),
      ]);
      const nextStatus = (await statusResponse.json()) as Status;
      const sessionData = (await sessionsResponse.json()) as {
        items?: SessionSummary[];
        error?: string;
      };
      setStatus(nextStatus);
      setSessions(sessionData.items ?? []);
      if (!sessionsResponse.ok && sessionData.error) setError(sessionData.error);
    } catch {
      setError("The local console could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function openSession(id: string): Promise<void> {
    setError(undefined);
    try {
      const response = await fetch(`/api/sessions/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as HistoryResponse;
      if (!response.ok) throw new Error(data.error ?? "Session could not be loaded.");
      setMessages(
        (data.items ?? []).flatMap((item) =>
          item.type === "message" && item.role
            ? [{
                id: item.id ?? crypto.randomUUID(),
                role: item.role,
                content: contentToText(item.content),
                createdAt: item.createdAt ?? new Date().toISOString(),
              }]
            : [],
        ),
      );
      setSessionId(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Session could not be loaded.");
    }
  }

  async function send(event?: FormEvent): Promise<void> {
    event?.preventDefault();
    const message = input.trim();
    if (!message || sending) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setSending(true);
    setError(undefined);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
      });
      const data = (await response.json()) as {
        sessionId?: string;
        output?: string;
        error?: string;
      };
      if (!response.ok || !data.sessionId || !data.output) {
        throw new Error(data.error ?? "The assistant returned an invalid response.");
      }
      setSessionId(data.sessionId);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.output!,
          createdAt: new Date().toISOString(),
        },
      ]);
      void refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The assistant could not respond.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      <header className="topbar">
        <a href="#overview" className="brand" aria-label={`${botConfig.name} home`}>
          <span><Bot /></span>
          <strong>{botConfig.name}</strong>
          <small>Discord agent</small>
        </a>
        <nav aria-label="Page sections">
          <a href="#capabilities">Capabilities</a>
          <a href="#commands">Commands</a>
          <a href="#test-chat">Test chat</a>
        </nav>
        <ThemeSelector />
      </header>

      <div className="page">
        <section className="hero" id="overview">
          <div className="bot-avatar"><Bot /></div>
          <div className="hero-copy">
            <div className="eyebrow"><span /> Ready for your community</div>
            <h1>{botConfig.name}</h1>
            <p>{botConfig.description}</p>
            <div className="hero-actions">
              <a className="primary-button" href={botConfig.links.discordDeveloperPortal} target="_blank" rel="noreferrer">
                Configure in Discord <ExternalLink />
              </a>
              <a className="secondary-button" href="#test-chat">Try locally</a>
            </div>
          </div>
          <div className="profile-card">
            <div><Radio /><span>Presence</span><strong>{botConfig.status}</strong></div>
            <div><Hash /><span>Username</span><strong>@{botConfig.username}</strong></div>
            <div><Sparkles /><span>Runtime</span><strong>OrchaJS</strong></div>
          </div>
        </section>

        <section className="status-grid" aria-label="Setup status">
          <article>
            <Server />
            <div><small>Discord connection</small><strong>{status?.discordConfigured ? "Configured" : "Needs setup"}</strong></div>
            {status?.discordConfigured ? <Check className="good" /> : <CircleAlert className="warn" />}
          </article>
          <article>
            <Sparkles />
            <div><small>AI provider</small><strong>{status?.assistantConfigured ? "OpenAI ready" : "API key missing"}</strong></div>
            {status?.assistantConfigured ? <Check className="good" /> : <CircleAlert className="warn" />}
          </article>
          <article>
            <Command />
            <div><small>Command scope</small><strong>{status?.guildMode === "development" ? "Test guild" : "Global"}</strong></div>
            <span className="status-pill">{loading ? "Checking" : "Detected"}</span>
          </article>
        </section>

        <section className="section" id="capabilities">
          <div className="section-heading"><div><span>Built for Discord</span><h2>One assistant, every conversation</h2></div></div>
          <div className="capability-grid">
            {botConfig.capabilities.map((capability, index) => (
              <article key={capability.title}>
                <span className="index">0{index + 1}</span>
                <h3>{capability.title}</h3>
                <p>{capability.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section command-section" id="commands">
          <div className="section-heading"><div><span>Slash commands</span><h2>Simple commands, durable context</h2></div></div>
          <div className="command-list">
            {botConfig.commands.map((command) => (
              <article key={command.name}>
                <code>/{command.name}</code>
                <div><strong>{command.description}</strong><span>{command.usage}</span></div>
              </article>
            ))}
          </div>
        </section>

        <section className="workspace" id="test-chat">
          <aside className="sessions-panel">
            <div className="panel-heading"><div><span>Local only</span><h2>Recent Orcha sessions</h2></div><MessageCircle /></div>
            {loading ? (
              <div className="skeleton-list" aria-label="Loading sessions"><i /><i /><i /></div>
            ) : sessions.length ? (
              <div className="session-list">
                {sessions.map((session) => (
                  <button key={session.sessionId} type="button" data-active={session.sessionId === sessionId || undefined} onClick={() => void openSession(session.sessionId)}>
                    <span>{session.name || "Untitled session"}</span>
                    <time dateTime={session.updatedAt}>{formatDate(session.updatedAt)}</time>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state"><MessageCircle /><strong>No sessions yet</strong><p>Start a test chat to create your first isolated web session.</p></div>
            )}
          </aside>

          <section className="chat-card" aria-label="Local test chat">
            <header><div><span className="live-dot" /><div><strong>Local test chat</strong><small>Private to this browser</small></div></div><button type="button" onClick={() => { setSessionId(undefined); setMessages([]); setError(undefined); }}>New chat</button></header>
            <div className="messages" aria-live="polite">
              {messages.length ? messages.map((message) => (
                <article key={message.id} className={`chat-message ${message.role}`}>
                  {message.role === "assistant" ? <Bot /> : null}
                  <div><Markdown remarkPlugins={[remarkGfm]}>{message.content}</Markdown></div>
                </article>
              )) : (
                <div className="chat-welcome">
                  <Bot />
                  <h3>Test your assistant</h3>
                  <p>These sessions are isolated from Discord and from other visitors.</p>
                  <div>{botConfig.suggestedPrompts.map((prompt) => <button type="button" key={prompt} onClick={() => setInput(prompt)}>{prompt}</button>)}</div>
                </div>
              )}
              {sending ? <div className="typing" aria-label="Assistant is thinking"><i /><i /><i /></div> : null}
            </div>
            {error ? <div className="error-banner" role="alert">{error}</div> : null}
            <form className="composer" onSubmit={(event) => void send(event)}>
              <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Ask Orcha Guide…" maxLength={4_000} rows={1} disabled={sending} aria-label="Message Orcha Guide" />
              <button type="submit" disabled={!input.trim() || sending} aria-label="Send message"><ArrowUp /></button>
            </form>
          </section>
        </section>
      </div>

      <footer><span>Built with <a href={botConfig.links.orcha} target="_blank" rel="noreferrer">OrchaJS</a> and discord.js</span><span>MIT licensed template</span></footer>
    </main>
  );
}

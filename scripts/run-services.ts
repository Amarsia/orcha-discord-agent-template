import "dotenv/config";

import { spawn, type ChildProcess } from "node:child_process";

import { validateDiscordEnv } from "../lib/env";

validateDiscordEnv();

const production = process.argv.includes("--production");
const children: ChildProcess[] = [];
let stopping = false;

function start(command: string, args: string[], label: string): ChildProcess {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
  });
  child.once("exit", (code, signal) => {
    if (!stopping) {
      console.error(`${label} exited (${signal ?? code ?? "unknown"}); stopping services.`);
      shutdown(code ?? 1);
    }
  });
  children.push(child);
  return child;
}

function shutdown(exitCode = 0): void {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(exitCode), 5_000).unref();
}

start("npm", ["run", production ? "start:web" : "dev"], "Next.js");
start("npm", ["run", production ? "start:discord" : "dev:discord"], "Discord worker");

process.once("SIGINT", () => shutdown(0));
process.once("SIGTERM", () => shutdown(0));

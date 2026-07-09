/**
 * Advisor strategy: Sonnet 4.6 handles execution; Fable 5 is consulted on hard problems.
 *
 * The advisor_20260301 tool is server-side — Anthropic's infrastructure runs Fable 5
 * automatically when Sonnet 4.6 decides it needs a second opinion. No client-side
 * tool execution is needed.
 *
 * Usage:
 *   node tools/advisor.mjs "your question here"
 *   echo "your question" | node tools/advisor.mjs
 */
import Anthropic from "@anthropic-ai/sdk";
import { createInterface } from "readline";

const client = new Anthropic();

const EXECUTOR_MODEL = "claude-sonnet-4-6";
const ADVISOR_MODEL = "claude-fable-5";

const SYSTEM = `You are a helpful assistant for the dragon-drift browser game project (Three.js / WebGL).
The project has two game modes in js/ and godfall/js/.

When you encounter a hard problem — subtle game logic bugs, WebGL performance issues,
architectural decisions, or anything you are uncertain about — call the advisor tool
to consult a more capable model. For routine questions, answer directly to save tokens.`;

async function getQuery() {
  const args = process.argv.slice(2);
  if (args.length > 0) return args.join(" ");

  if (!process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin });
    const lines = [];
    for await (const line of rl) lines.push(line);
    return lines.join("\n").trim();
  }

  process.stderr.write(
    `Usage: node tools/advisor.mjs "your question"\n` +
    `       echo "your question" | node tools/advisor.mjs\n`,
  );
  process.exit(1);
}

async function run() {
  const query = await getQuery();

  process.stderr.write(`executor: ${EXECUTOR_MODEL}  advisor: ${ADVISOR_MODEL}\n\n`);

  const messages = [{ role: "user", content: query }];

  // Server-side tools may need multiple rounds if they hit the 10-iteration limit.
  const MAX_CONTINUATIONS = 5;
  let continuations = 0;

  while (continuations <= MAX_CONTINUATIONS) {
    const stream = client.beta.messages.stream(
      {
        model: EXECUTOR_MODEL,
        max_tokens: 16000,
        system: SYSTEM,
        thinking: { type: "adaptive" },
        tools: [
          {
            type: "advisor_20260301",
            name: "advisor",
            model: ADVISOR_MODEL,
          },
        ],
        messages,
      },
      { headers: { "anthropic-beta": "advisor-tool-2026-03-01" } },
    );

    // Stream text deltas to stdout as they arrive
    stream.on("text", (delta) => process.stdout.write(delta));

    // Notify when the executor decides to consult the advisor
    stream.on("streamEvent", (event) => {
      if (
        event.type === "content_block_start" &&
        event.content_block?.type === "server_tool_use" &&
        event.content_block?.name === "advisor"
      ) {
        process.stderr.write(`\n[consulting ${ADVISOR_MODEL}...]\n`);
      }
    });

    const message = await stream.finalMessage();

    if (message.stop_reason === "end_turn") break;

    // Server-side tool loop hit its 10-iteration limit — re-send to continue.
    // Do NOT add a new user message; the trailing server_tool_use block tells
    // the API to resume automatically.
    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      continuations++;
      continue;
    }

    // Unexpected stop reason — bail out
    process.stderr.write(`\n[stopped: ${message.stop_reason}]\n`);
    break;
  }

  if (continuations > MAX_CONTINUATIONS) {
    process.stderr.write("\n[max continuations reached]\n");
  }

  process.stdout.write("\n");
}

run().catch((err) => {
  process.stderr.write(`\nError: ${err.message}\n`);
  process.exit(1);
});

/**
 * Zero-dependency MCP server over stdio (JSON-RPC 2.0, newline-delimited).
 *
 * Why hand-rolled: adding `@modelcontextprotocol/sdk` would drag a dozen
 * packages into a repo whose dependency surface is deliberately small
 * (see AGENTS.md §1.4). The stdio transport is line-delimited JSON with three
 * methods we actually need: initialize, tools/list, tools/call.
 *
 * Contract for a tool:
 *   { name, description, inputSchema, handler(args) -> string | object |
 *     { content: [...], isError?: boolean } }
 * A handler that throws becomes an `isError` result, never a broken connection.
 */
import readline from 'node:readline';

const SUPPORTED_PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const FALLBACK_PROTOCOL = SUPPORTED_PROTOCOLS[0];

const JSONRPC = { parseError: -32700, invalidRequest: -32600, methodNotFound: -32601, internalError: -32603 };

/** stdout is reserved for JSON-RPC frames — every stray console.log is redirected. */
function silenceStdout() {
  for (const level of ['log', 'info', 'debug', 'trace', 'warn']) {
    console[level] = (...args) => console.error(`[${level}]:`, ...args);
  }
}

function send(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

function reply(id, result) {
  send({ jsonrpc: '2.0', id, result });
}

function replyError(id, code, message, data) {
  send({ jsonrpc: '2.0', id, error: { code, message, ...(data ? { data } : {}) } });
}

function normalizeToolResult(value) {
  if (value && typeof value === 'object' && Array.isArray(value.content)) return value;
  const text =
    typeof value === 'string'
      ? value
      : JSON.stringify(value ?? null, null, 2);
  return { content: [{ type: 'text', text }] };
}

export function startServer({ name, version = '1.0.0', instructions = '', tools }) {
  silenceStdout();

  const byName = new Map(tools.map((t) => [t.name, t]));
  let clientProtocol = FALLBACK_PROTOCOL;

  const handlers = {
    initialize(params) {
      const requested = params?.protocolVersion;
      clientProtocol = SUPPORTED_PROTOCOLS.includes(requested) ? requested : FALLBACK_PROTOCOL;
      return {
        protocolVersion: clientProtocol,
        capabilities: { tools: {} },
        serverInfo: { name, title: name, version },
        instructions,
      };
    },

    'tools/list'() {
      return {
        tools: tools.map((t) => ({
          name: t.name,
          title: t.title || t.name,
          description: t.description,
          inputSchema: t.inputSchema || { type: 'object', properties: {} },
        })),
      };
    },

    async 'tools/call'({ name: toolName, arguments: args }) {
      const tool = byName.get(toolName);
      if (!tool) {
        return { content: [{ type: 'text', text: `Unknown tool: ${toolName}` }], isError: true };
      }
      try {
        return normalizeToolResult(await tool.handler(args ?? {}));
      } catch (e) {
        return {
          content: [{ type: 'text', text: `Tool "${toolName}" failed: ${e?.message ?? String(e)}` }],
          isError: true,
        };
      }
    },

    ping() {
      return {};
    },
  };

  const rl = readline.createInterface({ input: process.stdin, terminal: false });

  rl.on('line', (line) => {
    const text = line.trim();
    if (!text) return;

    let msg;
    try {
      msg = JSON.parse(text);
    } catch {
      replyError(null, JSONRPC.parseError, 'Invalid JSON');
      return;
    }

    const { id, method, params } = msg ?? {};
    if (!method) return;

    // Notifications (no id) must never be answered.
    if (id === undefined || id === null) return;

    const handler = handlers[method];
    if (!handler) {
      replyError(id, JSONRPC.methodNotFound, `Method not found: ${method}`);
      return;
    }

    Promise.resolve()
      .then(() => handler(params))
      .then((result) => reply(id, result))
      .catch((e) => replyError(id, JSONRPC.internalError, String(e?.message ?? e)));
  });

  rl.on('close', () => process.exit(0));
  process.on('uncaughtException', (e) => console.error('[uncaught]', e?.stack ?? e));
  process.on('unhandledRejection', (e) => console.error('[unhandled]', e));
}

/** Tiny schema builders so tool definitions stay readable without a validator lib. */
export const obj = (properties, required = []) => ({
  type: 'object',
  properties,
  ...(required.length ? { required } : {}),
  additionalProperties: false,
});

/** `extra` là object schema hoặc giá trị mặc định viết tắt ('src/data' → {default:'src/data'}). */
const asExtra = (extra) =>
  typeof extra === 'object' && extra !== null ? extra : { default: extra };

export const str = (description, extra = {}) => ({ type: 'string', description, ...asExtra(extra) });
export const bool = (description, def = false) => ({ type: 'boolean', description, default: def });
export const num = (description, extra = {}) => ({ type: 'number', description, ...asExtra(extra) });
export const en = (description, values, def = undefined) => ({
  type: 'string',
  description,
  enum: values,
  ...(def === undefined ? {} : { default: def }),
});
export const arr = (description, items = { type: 'string' }) => ({
  type: 'array',
  description,
  items,
});

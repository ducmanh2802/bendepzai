#!/usr/bin/env node
/**
 * Minimal MCP stdio client — chỉ dùng để smoke-test server trong mcp/.
 *
 *   node mcp/devclient.mjs mcp/quality-gates.mjs
 *   node mcp/devclient.mjs mcp/curriculum.mjs check_game_registration:'{"game_id":"connect_dots"}'
 *
 * Không phải một phần của app; nó ở lại repo vì đây là cách nhanh nhất để kiểm
 * tra một server còn sống mà không mở client MCP nào.
 */
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import path from 'node:path';

const [serverPath, ...callSpecs] = process.argv.slice(2);
if (!serverPath) {
  console.error('Usage: node mcp/devclient.mjs <mcp/server.mjs> [tool:jsonArgs ...]');
  process.exit(2);
}

const child = spawn(process.execPath, [path.resolve(serverPath)], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: { ...process.env, KBT_DEVCLIENT: '1' },
});

const pending = new Map();
let nextId = 1;

readline.createInterface({ input: child.stdout }).on('line', (line) => {
  let msg;
  try {
    msg = JSON.parse(line);
  } catch {
    return console.error('← (non-JSON)', line.slice(0, 200));
  }
  const done = pending.get(msg.id);
  if (done) {
    pending.delete(msg.id);
    done(msg);
  }
});

function request(method, params) {
  const id = nextId++;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}
function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
}

let clientDone = false;
child.on('exit', (code) => {
  if (clientDone) return;
  console.error(`server exited with code ${code}`);
  process.exit(code === 0 ? 0 : 1);
});

const timeout = setTimeout(() => {
  console.error('⚖ timeout 180s — kill server');
  child.kill();
  process.exit(1);
}, 180000);

const init = await request('initialize', {
  protocolVersion: '2025-06-18',
  capabilities: {},
  clientInfo: { name: 'devclient', version: '1.0.0' },
});
console.log('initialize →', JSON.stringify(init.result?.serverInfo), 'protocol', init.result?.protocolVersion);
notify('notifications/initialized', {});

const list = await request('tools/list', {});
console.log(`tools/list → ${list.result?.tools.length} tool(s):`);
for (const t of list.result?.tools ?? []) console.log('  -', t.name, '·', (t.description || '').split('.')[0]);

for (const spec of callSpecs) {
  const idx = spec.indexOf(':');
  const name = idx === -1 ? spec : spec.slice(0, idx);
  const raw = idx === -1 ? '{}' : spec.slice(idx + 1);
  let args;
  try {
    args = JSON.parse(raw);
  } catch {
    args = {};
  }
  const res = await request('tools/call', { name, arguments: args });
  const content = res.result?.content?.map((c) => c.text).join('\n') ?? JSON.stringify(res.error ?? res);
  console.log(`\n### tools/call ${name}(${raw})\n${content.slice(0, 4000)}`);
  if (res.result?.isError) console.log('  (isError=true)');
}

clearTimeout(timeout);
clientDone = true;
child.kill();
process.exit(0);

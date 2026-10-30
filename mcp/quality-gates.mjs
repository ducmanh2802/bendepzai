#!/usr/bin/env node
/**
 * MCP server: quality gates of Kho Báu Tri Thức.
 *
 * Exposes the same commands docs/SDLC.md §4 defines, so an agent runs the real
 * gate instead of guessing flags. Everything returns bounded output.
 *
 * Register: Qoder Settings → MCP → add, command `node`, args [this file].
 * Run by hand: node mcp/quality-gates.mjs   (then speak JSON-RPC on stdin)
 */
import { startServer, obj, str, num, bool, en } from './lib/server.mjs';
import { npmRun, run, git, readSource, listFiles, fileSynopsis, clip, stripAnsi, ROOT } from './lib/repo.mjs';

const GATES = {
  verify: { script: 'verify', timeout: 600000, note: 'typecheck + 971 test + build + bundle budget' },
  'verify:quick': { script: 'verify:quick', timeout: 180000, note: 'typecheck + unit test (~25s)' },
  typecheck: { script: 'typecheck', timeout: 120000, note: 'tsc --noEmit (~6s)' },
  'test:ci': { script: 'test:ci', timeout: 300000, note: 'vitest run, KHÔNG chạm docs/audit-*' },
  build: { script: 'build', timeout: 300000, note: 'vite build → dist/' },
  'check:budget': { script: 'check:budget', timeout: 60000, note: 'main chunk ≤ 600 kB' },
};

function gateResult(name, res) {
  const lines = stripAnsi(res.out + '\n' + res.err).split('\n');
  const testLine = lines.find((l) => /Tests\s+\d+/.test(l)) || null;
  const filesLine = lines.find((l) => /Test Files\s+\d+/.test(l)) || null;
  return {
    gate: name,
    ok: res.code === 0 && !res.timedOut,
    exitCode: res.code,
    timedOut: res.timedOut,
    durationMs: res.ms,
    summary: testLine && filesLine ? `${filesLine.trim()} | ${testLine.trim()}` : null,
    outputTail: clip(stripAnsi((res.err || res.out).trim()), 3500),
  };
}

startServer({
  name: 'kbt-quality-gates',
  version: '1.0.0',
  instructions:
    'Cổng chất lượng của Kho Báu Tri Thức. Luôn chạy `run_gate("verify:quick")` sau khi sửa code, ' +
    'và `run_gate("verify")` trước khi nói "xong" (docs/SDLC.md §0). UI/trò chơi đổi thì chạy thêm run_qa_probe.',
  tools: [
    {
      name: 'run_gate',
      description: 'Chạy một cổng kiểm tra của dự án và trả về exit code + output rút gọn.',
      inputSchema: obj({ gate: en('Tên npm script cần chạy', Object.keys(GATES)), timeout_seconds: num('Giới hạn thời gian giây (mặc định theo từng gate)') }, ['gate']),
      async handler({ gate, timeout_seconds }) {
        const spec = GATES[gate];
        if (!spec) throw new Error(`Gate không hợp lệ: ${gate}. Chọn: ${Object.keys(GATES).join(', ')}`);
        const res = await npmRun(spec.script, { timeoutMs: timeout_seconds ? timeout_seconds * 1000 : spec.timeout });
        return gateResult(gate, res);
      },
    },

    {
      name: 'list_qa_probes',
      description: 'Liệt kê probe Playwright trong qa/ kèm mô tả, và cho biết probe nào chạy được qua run_qa_probe.',
      inputSchema: obj({}),
      handler() {
        return listFiles('qa', { extension: '.mjs', limit: 100 })
          .filter((f) => !f.endsWith('lib.mjs') && !f.endsWith('run-one.mjs'))
          .map((f) => {
            const { text } = readSource(f, 8000);
            return {
              file: f,
              runnerCompatible: /export\s+default\s+async\s+function/.test(text),
              synopsis: fileSynopsis(f, 4),
            };
          });
      },
    },

    {
      name: 'run_qa_probe',
      description:
        'Chạy một probe QA trên bản build thật (vite preview + Chromium). Cần dist/ — tự build nếu rebuild=true.',
      inputSchema: obj({
        probe: str('Đường dẫn probe trong qa/, vd "qa/golden-path.mjs" hoặc "qa/games.mjs"', { default: 'qa/golden-path.mjs' }),
        rebuild: bool('Chạy npm run build trước khi probe (mặc định true nếu thiếu dist/)', true),
        port: num('Port preview, mặc định 4173. Đổi nếu port bận.', 4173),
      }),
      async handler({ probe = 'qa/golden-path.mjs', rebuild, port = 4173 }) {
        const hasDist = listFiles('dist', { extension: '.html', limit: 3 }).length > 0;
        let built = null;
        if (rebuild || !hasDist) built = gateResult('build', await npmRun('build', { timeoutMs: 300000 }));
        if (rebuild || !hasDist) {
          if (built && !built.ok) return { ok: false, reason: 'build failed', build: built };
        }

        const res = await run(process.execPath, ['qa/run-one.mjs', probe], {
          timeoutMs: 420000,
          env: { PORT: String(port) },
        });

        const stdout = res.out;
        const jsonStart = stdout.indexOf('{');
        let state = null;
        try {
          state = jsonStart >= 0 ? JSON.parse(stdout.slice(jsonStart)) : null;
        } catch {
          state = null;
        }

        return {
          probe,
          ok: res.code === 0,
          exitCode: res.code,
          timedOut: res.timedOut,
          durationMs: res.ms,
          verdict: clip((res.err || '').trim().split('\n').filter((l) => /QA (PASS|FAIL)/.test(l)).join(' '), 200) || null,
          stepCount: state?.steps?.length ?? null,
          lastSteps: (state?.steps ?? []).slice(-6).map((s) => s.step),
          errors: state?.errors ?? null,
          failedAt: state?.failedAt ?? null,
          note:
            state && state.errors?.length === 0 && res.code !== 0
              ? 'Probe không ghi lỗi nhưng exit code khác 0 — xem outputTail.'
              : undefined,
          outputTail: clip((res.err || '') + '\n' + (state ? '' : stdout), 2500),
        };
      },
    },

    {
      name: 'bundle_report',
      description: 'Báo cáo kích thước chunk sau build + kết luận budget 600 kB (npm run check:budget).',
      inputSchema: obj({ top: num('Số chunk lớn nhất muốn xem, mặc định 10', 10) }),
      async handler({ top = 10 }) {
        const { getBudgetReport } = await import('../scripts/check-bundle-budget.mjs');
        const rep = getBudgetReport(ROOT + '/dist');
        return {
          ok: rep.ok,
          reason: rep.reason,
          budgetKb: 600,
          goalKb: 450,
          mainChunk: rep.mainChunk,
          mainKiloBytes: rep.mainKiloBytes ?? null,
          meetsGoal: rep.meetsGoal ?? false,
          largestChunks: rep.chunks.slice(0, top).map((c) => ({ kb: +(c.bytes / 1024).toFixed(1), file: c.file, main: !!c.isMain })),
          hint: rep.ok ? undefined : ' chunk vượt 600 kB: tách sang lazy import ở src/components/games/registry.ts, đừng nhập thẳng vào Hub.',
        };
      },
    },

    {
      name: 'workspace_status',
      description: 'Nhánh hiện tại, commit gần nhất, file đã sửa/chưa theo dõi, và cổng git hooks đã bật chưa.',
      inputSchema: obj({}),
      async handler() {
        const [status, branch, log, hooks] = await Promise.all([
          git(['status', '--short']),
          git(['rev-parse', '--abbrev-ref', 'HEAD']),
          git(['log', '--oneline', '-5']),
          git(['config', '--get', 'core.hooksPath']),
        ]);
        return {
          branch: branch.out.trim() || null,
          hooksPath: hooks.code === 0 ? hooks.out.trim() : null,
          hooksInstalled: hooks.code === 0 && /scripts\/hooks/.test(hooks.out),
          recentCommits: log.out.trim().split('\n').filter(Boolean),
          changedFiles: status.out.trim().split('\n').filter(Boolean).slice(0, 60),
        };
      },
    },

    {
      name: 'audit_state',
      description: 'Đọc trạng thái audit tăng dần: docs/audit-state.json + phần cuối docs/AUDIT_REPORT.md.',
      inputSchema: obj({ tail_lines: num('Số dòng cuối của AUDIT_REPORT.md, mặc định 40', 40) }),
      handler({ tail_lines = 40 }) {
        let state = null;
        try {
          state = JSON.parse(readSource('docs/audit-state.json', 200000).text);
        } catch (e) {
          state = { error: e.message };
        }
        let report = '';
        let totalBytes = 0;
        try {
          const r = readSource('docs/AUDIT_REPORT.md', 120000);
          report = r.text.split('\n').slice(-tail_lines).join('\n');
          totalBytes = r.bytes;
        } catch (e) {
          report = 'Không đọc được AUDIT_REPORT.md: ' + e.message;
        }
        return {
          stateKeys: state && !state.error ? Object.keys(state).slice(0, 20) : null,
          statePreview: clip(JSON.stringify(state), 1500),
          reportBytes: totalBytes,
          reportTail: clip(report, 4000),
        };
      },
    },
  ],
});

import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const workspace = mkdtempSync(join(tmpdir(), 'jobsearch-skill-package-smoke-'));

try {
  const packResult = run('npm', ['pack', '--json', '--pack-destination', workspace]);
  const [pack] = JSON.parse(packResult.stdout);
  const packedFiles = new Set(pack.files.map((file) => file.path));

  const required = [
    'bin/jobsearch-skill.js',
    'src/index.js',
    'src/render.js',
    'fixtures/job-post.md',
    'fixtures/candidate-notes.md',
    'docs/SAFETY.md',
    'SKILL.md',
    'README.md',
    'LICENSE',
    'SECURITY.md',
    'CHANGELOG.md'
  ];

  const missing = required.filter((entry) => !packedFiles.has(entry));

  if (missing.length > 0) {
    throw new Error(`package smoke missing entries:\n${missing.join('\n')}`);
  }

  writeFileSync(join(workspace, 'package.json'), '{"private":true,"type":"module"}\n');
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', join(workspace, pack.filename)], {
    cwd: workspace
  });

  const importResult = run(process.execPath, [
    '--input-type=module',
    '--eval',
    "import { createApplicationBrief, parseCandidateNotes, parseJobPost, renderMarkdown } from 'jobsearch-skill'; const brief = createApplicationBrief('# Engineer\\n## Requirements\\n- Node.js', 'Skills:\\n- Node.js'); if (brief.fitScore !== 100 || typeof parseCandidateNotes !== 'function' || typeof parseJobPost !== 'function' || typeof renderMarkdown !== 'function') process.exit(1);"
  ], { cwd: workspace });

  const packageRoot = join(workspace, 'node_modules', 'jobsearch-skill');
  const installedBin = join(workspace, 'node_modules', '.bin', 'jobsearch-skill');
  const jobFixture = join(packageRoot, 'fixtures', 'job-post.md');
  const binResult = run(installedBin, [
    '--format',
    'json',
    '--candidate',
    join(packageRoot, 'fixtures', 'candidate-notes.md'),
    jobFixture
  ], { cwd: workspace });
  JSON.parse(binResult.stdout);

  const unknownOption = runExpectingFailure(installedBin, [jobFixture, '--unknown'], { cwd: workspace });
  if (unknownOption.status !== 2 || !unknownOption.stderr.includes('Unknown option "--unknown"')) {
    throw new Error(`installed CLI did not reject an unknown option cleanly:\n${unknownOption.stderr}`);
  }

  const extraPositional = runExpectingFailure(installedBin, [jobFixture, 'extra.md'], { cwd: workspace });
  if (extraPositional.status !== 2 || !extraPositional.stderr.includes('Unexpected positional argument "extra.md"')) {
    throw new Error(`installed CLI did not reject an extra positional cleanly:\n${extraPositional.stderr}`);
  }

  const missingJob = join(workspace, 'missing-job-post.md');
  const missingInput = runExpectingFailure(installedBin, [missingJob], { cwd: workspace });
  if (missingInput.status !== 2
    || !missingInput.stderr.includes(`job-post file "${missingJob}" does not exist`)
    || !missingInput.stderr.includes('Usage: jobsearch-skill')
    || missingInput.stderr.includes('node:fs')) {
    throw new Error(`installed CLI did not report a missing input cleanly:\n${missingInput.stderr}`);
  }

  console.log(`package smoke passed: installed ${pack.filename}, imported root API, and verified installed CLI parsing and input errors`);
} finally {
  rmSync(workspace, { recursive: true, force: true });
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    const output = `${result.stdout || ''}\n${result.stderr || ''}`;
    throw new Error(`${command} ${args.join(' ')} failed with status ${result.status}:\n${output}`);
  }
  return result;
}

function runExpectingFailure(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status === 0 || result.error) {
    throw new Error(`${command} ${args.join(' ')} unexpectedly succeeded or failed to start`);
  }
  return result;
}

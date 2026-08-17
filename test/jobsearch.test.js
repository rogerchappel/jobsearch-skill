import test from 'node:test';
import assert from 'node:assert/strict';
import fs, { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApplicationBrief, parseCandidateNotes, parseJobPost, renderMarkdown } from '../src/index.js';

test('parses job metadata and requirements', () => {
  const job = parseJobPost(fs.readFileSync('fixtures/job-post.md', 'utf8'));
  assert.equal(job.title, 'Senior Agent Workflow Engineer');
  assert.equal(job.company, 'Example Robotics');
  assert.equal(job.seniority, 'senior');
  assert.equal(job.requirements.length, 4);
});

test('parses company only from supported metadata forms', () => {
  assert.equal(parseJobPost('# Platform Engineer\nCompany: Example Robotics').company, 'Example Robotics');
  assert.equal(parseJobPost('# Platform Engineer at Example Robotics').company, 'Example Robotics');
});

test('does not infer company from incidental role prose', () => {
  const job = parseJobPost([
    '# Platform Engineer',
    '## Responsibilities',
    '- Operate services at Scale',
    '## Requirements',
    '- Node.js'
  ].join('\n'));

  assert.equal(job.company, 'Unknown company');
});

test('does not infer seniority from action verbs in role content', () => {
  for (const line of ['Lead incident reviews', 'Staff the support rotation']) {
    const job = parseJobPost(`# Backend Engineer\n## Responsibilities\n- ${line}`);
    assert.equal(job.seniority, 'unspecified');
  }
});

test('detects genuine seniority from the role title', () => {
  for (const [title, seniority] of [
    ['Lead Platform Engineer', 'lead'],
    ['Senior Backend Engineer', 'senior'],
    ['Junior Software Engineer', 'junior']
  ]) {
    assert.equal(parseJobPost(`# ${title}`).seniority, seniority);
  }
});

test('respects explicit remote-work negation', () => {
  const job = parseJobPost('# Backend Engineer\nLocation: Brisbane; remote work is not offered');
  assert.deepEqual(job.signals, []);
});

test('detects genuine remote roles', () => {
  const job = parseJobPost('# Backend Engineer\nLocation: Remote within Australia');
  assert.deepEqual(job.signals, ['remote-friendly']);
});

test('does not infer job signals from domain phrases', () => {
  const job = parseJobPost([
    '# Backend Engineer',
    '## Requirements',
    '- Experience with contract testing',
    '## Responsibilities',
    '- Improve application startup time'
  ].join('\n'));
  assert.deepEqual(job.signals, []);
});

test('detects explicit contract and startup descriptions', () => {
  const contract = parseJobPost('# Contract Backend Engineer\nEmployment type: 6-month contract');
  const startup = parseJobPost('# Backend Engineer\nCompany stage: Series A startup');
  assert.deepEqual(contract.signals, ['non-permanent']);
  assert.deepEqual(startup.signals, ['startup']);
});

test('does not treat arbitrary keyword-bearing bullets as application instructions', () => {
  const job = parseJobPost([
    '# Backend Engineer',
    '## Requirements',
    '- Apply security patches',
    '- Send telemetry metrics'
  ].join('\n'));
  assert.deepEqual(job.instructions, []);
});

test('extracts instructions from application context', () => {
  const job = parseJobPost([
    '# Backend Engineer',
    '## How to Apply',
    '- Email your resume to jobs@example.com',
    '- Include a portfolio and cover letter'
  ].join('\n'));
  assert.deepEqual(job.instructions, [
    'Email your resume to jobs@example.com',
    'Include a portfolio and cover letter'
  ]);
});

test('parses conventionally indented job-post bullets by section', () => {
  const job = parseJobPost([
    '# Backend Engineer',
    '## Requirements',
    '  - Build Node.js services',
    '## Responsibilities',
    '   * Operate production systems',
    '## How to Apply',
    ' - Email your resume to jobs@example.com',
    '    - This code-block-like line is not an application instruction'
  ].join('\n'));

  assert.deepEqual(job.requirements, ['Build Node.js services']);
  assert.deepEqual(job.responsibilities, ['Operate production systems']);
  assert.deepEqual(job.instructions, ['Email your resume to jobs@example.com']);
});

test('creates evidence-backed brief', () => {
  const brief = createApplicationBrief(fs.readFileSync('fixtures/job-post.md', 'utf8'), fs.readFileSync('fixtures/candidate-notes.md', 'utf8'));
  assert.equal(brief.fitScore, 75);
  const communicationEvidence = brief.evidenceMap.find(item => item.requirement.startsWith('Communicate'));
  assert.deepEqual(communicationEvidence.evidence, []);
  assert.ok(brief.missingEvidence.includes('Communicate tradeoffs with product and engineering teams'));
  assert.ok(brief.riskFlags.some(flag => flag.includes('Candidate constraint')));
});

test('keeps incidental company-like prose out of application briefs', () => {
  const brief = createApplicationBrief([
    '# Platform Engineer',
    '## Responsibilities',
    '- Operate services at Scale',
    '## Requirements',
    '- Node.js'
  ].join('\n'));

  assert.equal(brief.job.company, 'Unknown company');
});

test('does not treat generic requirement language as evidence', () => {
  const brief = createApplicationBrief(
    '# Rust Engineer\nCompany: Example\n## Requirements\n- Experience with Rust\n## How to apply\n- Apply online',
    'Skills:\n- JavaScript experience'
  );

  assert.equal(brief.fitScore, 0);
  assert.deepEqual(brief.evidenceMap[0].evidence, []);
  assert.deepEqual(brief.missingEvidence, ['Experience with Rust']);
});

test('does not match different technologies through the word development', () => {
  const brief = createApplicationBrief(
    '# Python Developer\nCompany: Example\n## Requirements\n- Python development\n## How to apply\n- Apply online',
    'Skills:\n- Java development'
  );

  assert.equal(brief.fitScore, 0);
  assert.deepEqual(brief.evidenceMap[0].evidence, []);
  assert.deepEqual(brief.missingEvidence, ['Python development']);
});

test('matches a distinctive technology token despite different surrounding words', () => {
  const brief = createApplicationBrief(
    '# Python Developer\nCompany: Example\n## Requirements\n- Python development\n## How to apply\n- Apply online',
    'Projects:\n- Built Python services'
  );

  assert.equal(brief.fitScore, 100);
  assert.deepEqual(brief.evidenceMap[0].evidence, ['Built Python services']);
  assert.deepEqual(brief.missingEvidence, []);
});

test('matches exact distinctive short and punctuation technology tokens', () => {
  for (const technology of ['C++', 'C#', 'Go', 'SQL', 'AWS']) {
    const brief = createApplicationBrief(
      `# Engineer\nCompany: Example\n## Requirements\n- ${technology}\n## How to apply\n- Apply online`,
      `Skills:\n- ${technology}`
    );

    assert.equal(brief.fitScore, 100, technology);
    assert.deepEqual(brief.evidenceMap[0].evidence, [technology], technology);
    assert.deepEqual(brief.missingEvidence, [], technology);
  }
});

test('does not match unrelated short or common words', () => {
  const brief = createApplicationBrief(
    '# Engineer\nCompany: Example\n## Requirements\n- Be an API pro with strong skills\n## How to apply\n- Apply online',
    'Skills:\n- An expert at work'
  );

  assert.equal(brief.fitScore, 0);
  assert.deepEqual(brief.evidenceMap[0].evidence, []);
});

test('reports a requirement as missing when candidate notes contain no evidence', () => {
  const brief = createApplicationBrief(
    '# Python Developer\nCompany: Example\n## Requirements\n- Python development\n## How to apply\n- Apply online'
  );

  assert.equal(brief.fitScore, 0);
  assert.deepEqual(brief.evidenceMap[0].evidence, []);
  assert.deepEqual(brief.missingEvidence, ['Python development']);
});

test('parses minimum qualifications without absorbing other sections', () => {
  const job = parseJobPost([
    '# Platform Engineer',
    '## Responsibilities',
    '- Operate services',
    '## Minimum Qualifications',
    '- Five years with Kubernetes',
    '## How to Apply',
    '- Email resume@example.com'
  ].join('\n'));

  assert.deepEqual(job.requirements, ['Five years with Kubernetes']);
  assert.deepEqual(job.responsibilities, ['Operate services']);
});

for (const heading of ['Requirements', 'Qualifications']) {
  test(`keeps an empty ${heading} section empty`, () => {
    const job = parseJobPost([
      '# Platform Engineer',
      '## Responsibilities',
      '- Operate services',
      `## ${heading}`,
      '## How to Apply',
      '- Email resume@example.com'
    ].join('\n'));

    assert.deepEqual(job.requirements, []);
    assert.deepEqual(job.responsibilities, ['Operate services']);
  });
}

test('falls back to all bullets when no recognized requirements section exists', () => {
  const job = parseJobPost([
    '# Platform Engineer',
    '- Five years with Kubernetes',
    '- Experience operating services'
  ].join('\n'));

  assert.deepEqual(job.requirements, [
    'Five years with Kubernetes',
    'Experience operating services'
  ]);
});

test('parses candidate notes under Markdown headings', () => {
  const notes = parseCandidateNotes([
    '## Skills',
    '- JavaScript',
    '## Projects',
    '- Built a release tool',
    '## Constraints',
    '- Remote only',
    '## Supporting Evidence',
    '- Reduced build time by 30%'
  ].join('\n'));

  assert.deepEqual(notes.skills, ['JavaScript']);
  assert.deepEqual(notes.projects, ['Built a release tool']);
  assert.deepEqual(notes.constraints, ['Remote only']);
  assert.deepEqual(notes.proof, ['Reduced build time by 30%']);
});

test('parses conventionally indented bullets in every candidate evidence section', () => {
  const notes = parseCandidateNotes([
    '## Skills',
    ' - Node.js',
    '## Projects',
    '  * Built Node.js services',
    '## Constraints',
    '   - Remote only',
    '## Evidence',
    '  - Reduced Node.js service latency by 30%',
    '    - This code-block-like line is not evidence'
  ].join('\n'));

  assert.deepEqual(notes.skills, ['Node.js']);
  assert.deepEqual(notes.projects, ['Built Node.js services']);
  assert.deepEqual(notes.constraints, ['Remote only']);
  assert.deepEqual(notes.proof, ['Reduced Node.js service latency by 30%']);
});

test('creates an evidence-backed brief from indented Markdown bullets', () => {
  const brief = createApplicationBrief(
    '# Node.js Engineer\n## Requirements\n  - Build Node.js services',
    '## Projects\n   * Built Node.js services'
  );

  assert.equal(brief.fitScore, 100);
  assert.deepEqual(brief.evidenceMap, [{
    requirement: 'Build Node.js services',
    evidence: ['Built Node.js services']
  }]);
  assert.deepEqual(brief.missingEvidence, []);
});

test('keeps colon-terminated candidate note headings compatible', () => {
  const notes = parseCandidateNotes('Skills:\n- JavaScript\nProjects:\n- CLI tooling');

  assert.deepEqual(notes.skills, ['JavaScript']);
  assert.deepEqual(notes.projects, ['CLI tooling']);
});

test('renders markdown brief', () => {
  const brief = createApplicationBrief(fs.readFileSync('fixtures/job-post.md', 'utf8'), fs.readFileSync('fixtures/candidate-notes.md', 'utf8'));
  const markdown = renderMarkdown(brief);
  assert.match(markdown, /# Application Brief/);
  assert.match(markdown, /Ask for explicit approval/);
});

test('CLI help exits cleanly with usage text', () => {
  const result = spawnSync(process.execPath, ['bin/jobsearch-skill.js', '--help'], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Usage: jobsearch-skill/);
});

for (const invocation of [
  ['--help', 'fixtures/job-post.md'],
  ['fixtures/job-post.md', '--help'],
  ['--help', '--unknown']
]) {
  test(`CLI rejects help mixed with unsupported arguments: ${invocation.join(' ')}`, () => {
    const result = runCli(invocation);

    assert.equal(result.status, 2);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /Unknown option "--help"/);
    assert.match(result.stderr, /Usage: jobsearch-skill/);
  });
}

test('CLI rejects unsupported formats', () => {
  const result = runCli(['fixtures/job-post.md', '--format', 'yaml']);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsupported --format "yaml".*markdown or json/);
});

test('CLI accepts options before the job-post input', () => {
  const result = runCli([
    '--format',
    'json',
    '--candidate',
    'fixtures/candidate-notes.md',
    'fixtures/job-post.md'
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).fitScore, 75);
});

test('CLI rejects unknown flags with usage', () => {
  const result = runCli(['fixtures/job-post.md', '--unknown']);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Unknown option "--unknown"/);
  assert.match(result.stderr, /Usage: jobsearch-skill/);
});

test('CLI rejects extra positional arguments with usage', () => {
  const result = runCli(['fixtures/job-post.md', 'fixtures/candidate-notes.md']);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Unexpected positional argument "fixtures\/candidate-notes\.md"/);
  assert.match(result.stderr, /Usage: jobsearch-skill/);
});

test('CLI rejects duplicate options with usage', () => {
  const result = runCli([
    'fixtures/job-post.md',
    '--format',
    'json',
    '--format',
    'markdown'
  ]);

  assert.equal(result.status, 2);
  assert.match(result.stderr, /--format may only be specified once/);
  assert.match(result.stderr, /Usage: jobsearch-skill/);
});

for (const flag of ['--format', '--candidate']) {
  test(`CLI rejects a missing ${flag} value`, () => {
    const result = runCli(['fixtures/job-post.md', flag]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, new RegExp(`${flag} requires a value`));
  });
}

for (const input of [
  { label: 'job-post', args: (path) => [path] },
  { label: 'candidate', args: (path) => ['fixtures/job-post.md', '--candidate', path] }
]) {
  test(`CLI reports a missing ${input.label} file without a stack trace`, () => {
    const path = join(tmpdir(), `jobsearch-skill-missing-${input.label}-${process.pid}.md`);
    const result = runCli(input.args(path));

    assert.equal(result.status, 2);
    assert.match(result.stderr, new RegExp(`${input.label} file .* does not exist`));
    assert.match(result.stderr, /Usage: jobsearch-skill/);
    assert.doesNotMatch(result.stderr, /node:fs|at readInputFile/);
  });

  test(`CLI rejects a directory used as the ${input.label} input`, () => {
    const directory = mkdtempSync(join(tmpdir(), 'jobsearch-skill-directory-'));
    try {
      const result = runCli(input.args(directory));
      assert.equal(result.status, 2);
      assert.match(result.stderr, new RegExp(`${input.label} path .* is not a regular file`));
      assert.match(result.stderr, /Usage: jobsearch-skill/);
      assert.doesNotMatch(result.stderr, /node:fs|at readInputFile/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}

test('CLI reports an unreadable input where permissions are enforced', (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'jobsearch-skill-unreadable-'));
  const path = join(directory, 'job-post.md');
  try {
    writeFileSync(path, '# Example');
    chmodSync(path, 0o000);
    if (fs.readFileSync(path, 'utf8') === '# Example') {
      t.skip('current user can read mode-000 files');
      return;
    }
  } catch (error) {
    if (error.code !== 'EACCES' && error.code !== 'EPERM') throw error;
    const result = runCli([path]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /job-post file .* is not readable/);
    assert.match(result.stderr, /Usage: jobsearch-skill/);
    assert.doesNotMatch(result.stderr, /node:fs|at readInputFile/);
  } finally {
    chmodSync(path, 0o600);
    rmSync(directory, { recursive: true, force: true });
  }
});

function runCli(args) {
  return spawnSync(process.execPath, ['bin/jobsearch-skill.js', ...args], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });
}

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createApplicationBrief, parseCandidateNotes, parseJobPost, renderMarkdown } from '../src/index.js';

test('parses job metadata and requirements', () => {
  const job = parseJobPost(fs.readFileSync('fixtures/job-post.md', 'utf8'));
  assert.equal(job.title, 'Senior Agent Workflow Engineer');
  assert.equal(job.company, 'Example Robotics');
  assert.equal(job.seniority, 'senior');
  assert.equal(job.requirements.length, 4);
});

test('creates evidence-backed brief', () => {
  const brief = createApplicationBrief(fs.readFileSync('fixtures/job-post.md', 'utf8'), fs.readFileSync('fixtures/candidate-notes.md', 'utf8'));
  assert.equal(brief.fitScore, 75);
  const communicationEvidence = brief.evidenceMap.find(item => item.requirement.startsWith('Communicate'));
  assert.deepEqual(communicationEvidence.evidence, []);
  assert.ok(brief.missingEvidence.includes('Communicate tradeoffs with product and engineering teams'));
  assert.ok(brief.riskFlags.some(flag => flag.includes('Candidate constraint')));
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

test('CLI rejects unsupported formats', () => {
  const result = runCli(['fixtures/job-post.md', '--format', 'yaml']);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsupported --format "yaml".*markdown or json/);
});

for (const flag of ['--format', '--candidate']) {
  test(`CLI rejects a missing ${flag} value`, () => {
    const result = runCli(['fixtures/job-post.md', flag]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, new RegExp(`${flag} requires a value`));
  });
}

function runCli(args) {
  return spawnSync(process.execPath, ['bin/jobsearch-skill.js', ...args], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf8'
  });
}

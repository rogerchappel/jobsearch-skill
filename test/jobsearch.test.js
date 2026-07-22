import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createApplicationBrief, parseJobPost, renderMarkdown } from '../src/index.js';

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

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
  assert.ok(brief.fitScore >= 75);
  assert.ok(brief.riskFlags.some(flag => flag.includes('Candidate constraint')));
});

test('renders markdown brief', () => {
  const brief = createApplicationBrief(fs.readFileSync('fixtures/job-post.md', 'utf8'), fs.readFileSync('fixtures/candidate-notes.md', 'utf8'));
  const markdown = renderMarkdown(brief);
  assert.match(markdown, /# Application Brief/);
  assert.match(markdown, /Ask for explicit approval/);
});

#!/usr/bin/env node
import fs from 'node:fs';
import { createApplicationBrief, renderMarkdown } from '../src/index.js';
const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help')) {
  console.log('Usage: jobsearch-skill <job-post.md> [--candidate notes.md] [--format markdown|json]');
  process.exit(args.length === 0 ? 1 : 0);
}
const jobPath = args[0];
const candidatePath = valueAfter('--candidate');
const format = valueAfter('--format') || 'markdown';
if (!['markdown', 'json'].includes(format)) {
  fail(`Unsupported --format "${format}". Expected markdown or json.`);
}
const jobText = fs.readFileSync(jobPath, 'utf8');
const candidateText = candidatePath ? fs.readFileSync(candidatePath, 'utf8') : '';
const brief = createApplicationBrief(jobText, candidateText);
if (format === 'json') console.log(JSON.stringify(brief, null, 2));
else console.log(renderMarkdown(brief));
function valueAfter(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) fail(`${flag} requires a value.`);
  return value;
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(2);
}

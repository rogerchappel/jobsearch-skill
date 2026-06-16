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
const jobText = fs.readFileSync(jobPath, 'utf8');
const candidateText = candidatePath ? fs.readFileSync(candidatePath, 'utf8') : '';
const brief = createApplicationBrief(jobText, candidateText);
if (format === 'json') console.log(JSON.stringify(brief, null, 2));
else console.log(renderMarkdown(brief));
function valueAfter(flag) { const index = args.indexOf(flag); return index === -1 ? undefined : args[index + 1]; }

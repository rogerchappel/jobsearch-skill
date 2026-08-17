#!/usr/bin/env node
import fs from 'node:fs';
import { createApplicationBrief, renderMarkdown } from '../src/index.js';

const usage = 'Usage: jobsearch-skill <job-post.md> [--candidate notes.md] [--format markdown|json]';
const args = process.argv.slice(2);
if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
  console.log(usage);
  process.exit(args.length === 0 ? 1 : 0);
}
const { jobPath, candidatePath, format } = parseArgs(args);
if (!['markdown', 'json'].includes(format)) {
  fail(`Unsupported --format "${format}". Expected markdown or json.`);
}
const jobText = readInputFile('job-post', jobPath);
const candidateText = candidatePath ? readInputFile('candidate', candidatePath) : '';
const brief = createApplicationBrief(jobText, candidateText);
if (format === 'json') console.log(JSON.stringify(brief, null, 2));
else console.log(renderMarkdown(brief));

function parseArgs(argv) {
  const parsed = { candidatePath: undefined, format: 'markdown', jobPath: undefined };
  const seen = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--candidate' || argument === '--format') {
      if (seen.has(argument)) fail(`${argument} may only be specified once.`);
      const value = argv[index + 1];
      if (!value || value.startsWith('-')) fail(`${argument} requires a value.`);
      seen.add(argument);
      if (argument === '--candidate') parsed.candidatePath = value;
      else parsed.format = value;
      index += 1;
    } else if (argument.startsWith('-')) {
      fail(`Unknown option "${argument}".`);
    } else if (parsed.jobPath) {
      fail(`Unexpected positional argument "${argument}".`);
    } else {
      parsed.jobPath = argument;
    }
  }

  if (!parsed.jobPath) fail('A job-post path is required.');
  return parsed;
}

function readInputFile(label, path) {
  try {
    const stats = fs.statSync(path);
    if (!stats.isFile()) fail(`${label} path "${path}" is not a regular file.`);
    return fs.readFileSync(path, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') fail(`${label} file "${path}" does not exist.`);
    if (error?.code === 'EACCES' || error?.code === 'EPERM') {
      fail(`${label} file "${path}" is not readable.`);
    }
    if (error?.code === 'EISDIR') fail(`${label} path "${path}" is not a regular file.`);
    throw error;
  }
}

function fail(message) {
  console.error(`Error: ${message}\n${usage}`);
  process.exit(2);
}

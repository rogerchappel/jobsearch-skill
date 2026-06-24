import fs from 'node:fs';

const required = ['README.md', 'SKILL.md', 'docs/PRD.md', 'docs/TASKS.md', 'docs/ORCHESTRATION.md', 'package.json'];
const missing = required.filter(file => !fs.existsSync(file));
if (missing.length) { console.error('Missing required files: ' + missing.join(', ')); process.exit(1); }

const skill = fs.readFileSync('SKILL.md', 'utf8');
for (const phrase of ['Side Effects', 'Approval Requirements', 'Validation']) {
  if (!skill.includes(phrase)) { console.error('SKILL.md missing ' + phrase); process.exit(1); }
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredFiles = ['bin', 'src', 'fixtures', 'docs', 'SKILL.md', 'README.md', 'LICENSE', 'SECURITY.md', 'CONTRIBUTING.md', 'CHANGELOG.md'];
const requiredScripts = ['test', 'check', 'smoke', 'package:smoke', 'release:check'];
const missingFiles = requiredFiles.filter(file => !pkg.files?.includes(file));
const missingScripts = requiredScripts.filter(script => !pkg.scripts?.[script]);

if (pkg.bin?.['jobsearch-skill'] !== 'bin/jobsearch-skill.js') {
  console.error('package.json bin must expose bin/jobsearch-skill.js');
  process.exit(1);
}

if (missingFiles.length) {
  console.error('package.json files missing: ' + missingFiles.join(', '));
  process.exit(1);
}

if (missingScripts.length) {
  console.error('package.json scripts missing: ' + missingScripts.join(', '));
  process.exit(1);
}

if (pkg.repository?.url !== 'git+https://github.com/rogerchappel/jobsearch-skill.git') {
  console.error('package.json repository URL is not the public GitHub repo');
  process.exit(1);
}

console.log('check ok');

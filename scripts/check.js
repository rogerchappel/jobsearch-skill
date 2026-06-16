import fs from 'node:fs';
const required = ['README.md', 'SKILL.md', 'docs/PRD.md', 'docs/TASKS.md', 'docs/ORCHESTRATION.md', 'package.json'];
const missing = required.filter(file => !fs.existsSync(file));
if (missing.length) { console.error('Missing required files: ' + missing.join(', ')); process.exit(1); }
const skill = fs.readFileSync('SKILL.md', 'utf8');
for (const phrase of ['Side Effects', 'Approval Requirements', 'Validation']) {
  if (!skill.includes(phrase)) { console.error('SKILL.md missing ' + phrase); process.exit(1); }
}
console.log('check ok');

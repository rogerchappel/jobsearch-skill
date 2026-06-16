export function renderMarkdown(brief) {
  const lines = [];
  lines.push('# Application Brief');
  lines.push('');
  lines.push('- Role: ' + brief.job.title, '- Company: ' + brief.job.company, '- Location: ' + brief.job.location, '- Seniority: ' + brief.job.seniority, '- Fit score: ' + brief.fitScore + '%');
  lines.push('', '## Evidence Map');
  for (const item of brief.evidenceMap) {
    lines.push('- ' + item.requirement);
    lines.push('  Evidence: ' + (item.evidence.length ? item.evidence.join('; ') : 'missing'));
  }
  lines.push('', '## Missing Evidence', ...asBullets(brief.missingEvidence));
  lines.push('', '## Risk Flags', ...asBullets(brief.riskFlags));
  lines.push('', '## Next Actions', ...asBullets(brief.nextActions));
  return lines.join('\n') + '\n';
}

function asBullets(items) {
  return items.length ? items.map(item => '- ' + item) : ['- None'];
}

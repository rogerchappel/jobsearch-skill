const fieldPatterns = {
  title: [/^#\s+(.+)/m, /^title:\s*(.+)$/im],
  company: [/^company:\s*(.+)$/im, / at ([A-Z][A-Za-z0-9 &.-]+)/],
  location: [/^location:\s*(.+)$/im, /\b(remote|hybrid|onsite|on-site)\b[^\n.]*/i]
};

export function parseJobPost(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  const sections = collectSections(normalized);
  const requirements = extractBullets(sections.requirements || sections.qualifications || normalized);
  const responsibilities = extractBullets(sections.responsibilities || sections.role || '');
  const instructions = extractInstructions(normalized);
  return {
    title: firstMatch(normalized, fieldPatterns.title) || 'Unknown role',
    company: firstMatch(normalized, fieldPatterns.company) || 'Unknown company',
    location: firstMatch(normalized, fieldPatterns.location) || 'Unspecified location',
    seniority: detectSeniority(normalized),
    requirements,
    responsibilities,
    instructions,
    signals: detectSignals(normalized)
  };
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
}

function collectSections(text) {
  const sections = {};
  const parts = text.split(/^##\s+/m);
  for (const part of parts) {
    const [heading, ...rest] = part.split('\n');
    if (!rest.length) continue;
    const key = heading.trim().toLowerCase().replace(/[^a-z]+/g, '-');
    sections[key] = rest.join('\n');
  }
  return sections;
}

function extractBullets(text) {
  return text.split('\n').map(line => line.match(/^[-*]\s+(.+)/)?.[1]?.trim()).filter(Boolean);
}

function extractInstructions(text) {
  const lines = text.split('\n').filter(line => /apply|send|portfolio|cover letter|email/i.test(line));
  return lines.map(line => line.replace(/^[-*]\s+/, '').trim()).slice(0, 6);
}

function detectSeniority(text) {
  if (/principal|staff|lead/i.test(text)) return 'lead';
  if (/senior|sr\./i.test(text)) return 'senior';
  if (/junior|entry/i.test(text)) return 'junior';
  return 'unspecified';
}

function detectSignals(text) {
  const signals = [];
  if (/remote/i.test(text)) signals.push('remote-friendly');
  if (/visa|sponsor/i.test(text)) signals.push('visa-mentioned');
  if (/contract|temporary/i.test(text)) signals.push('non-permanent');
  if (/startup|seed|series [abc]/i.test(text)) signals.push('startup');
  return signals;
}

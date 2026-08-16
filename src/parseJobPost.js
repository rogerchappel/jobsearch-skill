const fieldPatterns = {
  title: [/^#\s+(.+)/m, /^title:\s*(.+)$/im],
  company: [/^company:\s*(.+)$/im, /^#\s+.+?\s+at\s+([A-Z][A-Za-z0-9 &.'-]*)\s*$/m],
  location: [/^location:\s*(.+)$/im, /\b(remote|hybrid|onsite|on-site)\b[^\n.]*/i]
};

export function parseJobPost(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  const sections = collectSections(normalized);
  const requirements = extractBullets(firstSection(sections, [
    'requirements',
    'minimum-requirements',
    'qualifications',
    'minimum-qualifications',
    'required-qualifications'
  ]) ?? normalized);
  const responsibilities = extractBullets(firstSection(sections, ['responsibilities', 'role']) || '');
  const instructions = extractInstructions(normalized, sections);
  const title = firstMatch(normalized, fieldPatterns.title) || 'Unknown role';
  return {
    title,
    company: firstMatch(normalized, fieldPatterns.company) || 'Unknown company',
    location: firstMatch(normalized, fieldPatterns.location) || 'Unspecified location',
    seniority: detectSeniority(title),
    requirements,
    responsibilities,
    instructions,
    signals: detectSignals(normalized)
  };
}

function firstSection(sections, keys) {
  return keys.map(key => sections[key]).find(section => section !== undefined);
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
  return text.split('\n').map(line => line.match(/^ {0,3}[-*]\s+(.+)/)?.[1]?.trim()).filter(Boolean);
}

function extractInstructions(text, sections) {
  const applicationSection = firstSection(sections, [
    'how-to-apply',
    'application',
    'application-instructions',
    'application-process',
    'apply'
  ]);
  if (applicationSection !== undefined) {
    const bullets = extractBullets(applicationSection);
    return (bullets.length ? bullets : applicationSection.split('\n').map(line => line.trim()).filter(Boolean)).slice(0, 6);
  }

  return text.split('\n')
    .map(line => line.replace(/^ {0,3}[-*]\s+/, '').trim())
    .filter(line => /^(?:to apply|apply (?:at|here|online|via|with)|please (?:apply|send|email)|send (?:your|a)|email (?:your|a))/i.test(line))
    .slice(0, 6);
}

function detectSeniority(title) {
  if (/\b(?:principal|staff|lead)\b/i.test(title)) return 'lead';
  if (/\b(?:senior|sr\.)/i.test(title)) return 'senior';
  if (/\b(?:junior|entry(?:-level)?)\b/i.test(title)) return 'junior';
  return 'unspecified';
}

function detectSignals(text) {
  const signals = [];
  const title = firstMatch(text, fieldPatterns.title) || '';
  const location = text.match(/^location:\s*(.+)$/im)?.[1] || '';
  const employment = text.match(/^(?:employment type|job type|engagement):\s*(.+)$/im)?.[1] || '';
  const companyStage = text.match(/^(?:company stage|funding stage):\s*(.+)$/im)?.[1] || '';
  const remoteContext = `${title}\n${location}`;

  if (/\bremote\b/i.test(remoteContext) && !/\b(?:no|not|isn't|is not|without)\b[^\n.;]{0,30}\bremote\b|\bremote\b[^\n.;]{0,30}\b(?:not (?:available|offered|supported)|unavailable)\b/i.test(remoteContext)) {
    signals.push('remote-friendly');
  }
  if (/visa|sponsor/i.test(text)) signals.push('visa-mentioned');
  if (/\b(?:contract(?:or)?|temporary|fixed-term|freelance)\b/i.test(`${title}\n${employment}`)) signals.push('non-permanent');
  if (/\b(?:startup|seed(?:-stage)?|series [abc])\b/i.test(companyStage)) signals.push('startup');
  return signals;
}

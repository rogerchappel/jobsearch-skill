export function parseCandidateNotes(text = '') {
  const skills = collectList(text, /^skills?$/i);
  const projects = collectList(text, /^projects?$/i);
  const constraints = collectList(text, /^constraints?$/i);
  const proof = collectList(text, /^(?:proof|proofs|evidence|supporting evidence)$/i);
  return { skills, projects, constraints, proof, raw: text };
}

function collectList(text, headingPattern) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let active = false;
  for (const line of lines) {
    const heading = parseHeading(line);
    if (heading !== undefined) active = headingPattern.test(heading);
    const bullet = line.match(/^ {0,3}[-*]\s+(.+)/);
    if (active && bullet) out.push(bullet[1].trim());
  }
  return out;
}

function parseHeading(line) {
  const trimmed = line.trim();
  const markdown = trimmed.match(/^#{1,6}\s+(.+?)\s*#*$/);
  if (markdown) return markdown[1].trim();
  const plain = trimmed.match(/^([A-Za-z][A-Za-z ]+):$/);
  return plain?.[1].trim();
}

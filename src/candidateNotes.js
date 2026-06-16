export function parseCandidateNotes(text = '') {
  const skills = collectList(text, /skills?:/i);
  const projects = collectList(text, /projects?:/i);
  const constraints = collectList(text, /constraints?:/i);
  const proof = collectList(text, /proof|evidence/i);
  return { skills, projects, constraints, proof, raw: text };
}

function collectList(text, headingPattern) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let active = false;
  for (const line of lines) {
    if (/^[A-Za-z ].+:$/.test(line.trim())) active = headingPattern.test(line);
    const bullet = line.match(/^[-*]\s+(.+)/);
    if (active && bullet) out.push(bullet[1].trim());
  }
  return out;
}

import { parseCandidateNotes } from './candidateNotes.js';
import { parseJobPost } from './parseJobPost.js';

export function createApplicationBrief(jobText, candidateText = '') {
  const job = parseJobPost(jobText);
  const candidate = parseCandidateNotes(candidateText);
  const evidenceMap = job.requirements.map(requirement => ({
    requirement,
    evidence: findEvidence(requirement, candidate),
  }));
  const matched = evidenceMap.filter(item => item.evidence.length > 0).length;
  const fitScore = job.requirements.length ? Math.round((matched / job.requirements.length) * 100) : 0;
  return {
    job,
    candidateSummary: { skills: candidate.skills, projects: candidate.projects, constraints: candidate.constraints },
    fitScore,
    evidenceMap,
    missingEvidence: evidenceMap.filter(item => item.evidence.length === 0).map(item => item.requirement),
    riskFlags: riskFlags(job, candidate),
    nextActions: nextActions(job, fitScore)
  };
}

function findEvidence(requirement, candidate) {
  const tokens = keywords(requirement);
  const pool = [...candidate.skills, ...candidate.projects, ...candidate.proof];
  return pool.filter(item => {
    const evidenceTokens = new Set(keywords(item));
    return tokens.some(token => evidenceTokens.has(token));
  }).slice(0, 3);
}

const genericWords = new Set([
  'ability', 'demonstrated', 'excellent', 'experience', 'familiarity', 'knowledge',
  'preferred', 'proficiency', 'required', 'skills', 'strong', 'using', 'with', 'work', 'working', 'years'
]);

function keywords(value) {
  return value.toLowerCase().split(/[^a-z0-9+#]+/)
    .filter(word => word.length > 3 && !genericWords.has(word));
}

function riskFlags(job, candidate) {
  const flags = [];
  if (job.instructions.length === 0) flags.push('Application instructions are unclear.');
  if (candidate.constraints.length) flags.push(...candidate.constraints.map(item => 'Candidate constraint: ' + item));
  if (job.requirements.length > 8) flags.push('Large requirement set needs careful evidence review.');
  return flags;
}

function nextActions(job, fitScore) {
  const actions = ['Review missing evidence before drafting outreach.'];
  if (fitScore < 60) actions.push('Collect stronger proof points or reconsider fit.');
  if (job.instructions.length) actions.push('Follow saved application instructions exactly after approval.');
  actions.push('Ask for explicit approval before sending or submitting anything externally.');
  return actions;
}

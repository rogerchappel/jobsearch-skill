# jobsearch-skill

Local-first agent skill for turning a saved job post and candidate notes into a reviewable application brief.

## Quickstart

~~~bash
npm install
npm test
npm run smoke
node bin/jobsearch-skill.js fixtures/job-post.md --candidate fixtures/candidate-notes.md --format json
~~~

For a human-readable brief:

~~~bash
node bin/jobsearch-skill.js fixtures/job-post.md --candidate fixtures/candidate-notes.md --format markdown
~~~

## Library API

The package root exports `createApplicationBrief`, `parseCandidateNotes`,
`parseJobPost`, and `renderMarkdown` for ECMAScript module consumers:

~~~js
import { createApplicationBrief, renderMarkdown } from 'jobsearch-skill';

const brief = createApplicationBrief(jobPostMarkdown, candidateNotesMarkdown);
console.log(renderMarkdown(brief));
~~~

## What It Produces

- Role metadata and seniority signals
- Requirement-to-evidence map
- Fit score based on local candidate notes
- Missing evidence and risk flags
- Next actions with approval boundaries

## Input Expectations

The job post should be a local Markdown or text file containing the role title,
responsibilities, requirements, and any location or compensation notes you want
reflected in the brief. Candidate notes should be local evidence supplied by the
user, not scraped profile data.

Requirement bullets are read from `Requirements`, `Minimum Requirements`,
`Qualifications`, `Minimum Qualifications`, or `Required Qualifications`
level-two Markdown sections. A recognized section may be empty; in that case,
the parsed requirements are empty. For compatibility with unstructured saved
posts, when none of those headings is present, all bullets in the document are
treated as requirements. Candidate notes accept `Skills`, `Projects`,
`Constraints`, and `Proof`, `Evidence`, or `Supporting Evidence` as either
Markdown headings (for example, `## Skills`) or colon-terminated headings (for
example, `Skills:`).

Evidence matching is deterministic token matching, not semantic inference. A
requirement matches a candidate skill, project, or proof item when they share
at least one distinctive, case-insensitive token. Common qualifiers and broad
terms such as `experience`, `skills`, and `development` are ignored, so `Java
development` does not satisfy `Python development`; an item that mentions
`Python` does. This intentionally conservative heuristic can miss synonyms,
abbreviations, and related technologies, so review both matches and missing
evidence rather than treating the fit score as a hiring decision.

The CLI accepts exactly one job-post path plus optional `--candidate` and
`--format` flags. Flags may appear before or after the job-post path, and each
flag may be supplied at most once. `--format` accepts only `markdown` (the
default) or `json`. Missing values, unknown flags, duplicate flags, and extra
positional arguments produce a concise usage error and exit status 2.

## Verification

Run the release-readiness gate before publishing or sharing an updated skill:

~~~bash
npm run check
npm run lint
npm test
npm run smoke
npm run package:smoke
npm run release:check
~~~

`npm run lint` is the contributor-facing static check alias used by the release
gate, and currently delegates to the same local package validation as
`npm run check`. The package smoke creates the tarball, installs it in a
disposable consumer, imports the package root, exercises the library API, and
runs the installed CLI.

## Limitations

The parser is deterministic and intentionally conservative. It does not scrape live job boards, submit applications, send messages, or invent credentials.

## Safety Notes

Treat the output as a planning brief. A human should approve any downstream external action such as submitting an application, contacting a recruiter, or saving data to an external CRM.

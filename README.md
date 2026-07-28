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

`--format` accepts only `markdown` (the default) or `json`. When `--format` or
`--candidate` is supplied, it must be followed by a value; invalid or missing
values produce an error and a nonzero exit.

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
`npm run check`.

## Limitations

The parser is deterministic and intentionally conservative. It does not scrape live job boards, submit applications, send messages, or invent credentials.

## Safety Notes

Treat the output as a planning brief. A human should approve any downstream external action such as submitting an application, contacting a recruiter, or saving data to an external CRM.

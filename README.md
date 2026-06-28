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

## Verification

Run the release-readiness gate before publishing or sharing an updated skill:

~~~bash
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
~~~

## Limitations

The parser is deterministic and intentionally conservative. It does not scrape live job boards, submit applications, send messages, or invent credentials.

## Safety Notes

Treat the output as a planning brief. A human should approve any downstream external action such as submitting an application, contacting a recruiter, or saving data to an external CRM.

# JobSearch Skill

Use this skill when an agent needs to prepare a job-application brief from local evidence before drafting outreach or application material.

## Inputs

- A saved job post in markdown or plain text.
- Optional candidate notes with projects, skills, constraints, and proof points.

## Side Effects

This skill only reads local files and writes command output. It must not apply to roles, send messages, update CRMs, scrape job boards, or fabricate credentials.

## Approval Requirements

Ask for explicit approval before any downstream external action such as sending email, submitting an application, saving to a CRM, or contacting a recruiter.

## Example

~~~bash
jobsearch-skill fixtures/job-post.md --candidate fixtures/candidate-notes.md --format markdown
~~~

## Validation

Run `npm test`, `npm run check`, and `npm run smoke`. Confirm the brief cites local evidence and lists missing evidence instead of inventing it.

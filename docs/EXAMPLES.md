# Examples

## Markdown Brief

~~~bash
jobsearch-skill fixtures/job-post.md --candidate fixtures/candidate-notes.md
~~~

## JSON Brief

~~~bash
jobsearch-skill fixtures/job-post.md --candidate fixtures/candidate-notes.md --format json
~~~

Use JSON when another local agent step needs structured evidence and risk flags.

The format value is required when the flag is present and must be `markdown` or
`json`. Candidate notes may organize bullet evidence with Markdown headings:

~~~markdown
## Skills
- Node.js CLI development

## Projects
- Built a local release tool

## Constraints
- Remote only

## Supporting Evidence
- Reduced build time by 30%
~~~

Colon-terminated headings such as `Skills:` remain supported.

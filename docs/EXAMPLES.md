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

## Evidence Matching

Matching uses shared distinctive tokens after lowercasing and removing broad
terms. For example, this candidate evidence is a match for a `Python
development` requirement because both contain `Python`:

~~~markdown
Projects:
- Built Python services
~~~

`Java development` is not a match: `development` is ignored and the technology
tokens differ. The matcher does not infer synonyms or related technologies, so
the generated evidence map and missing-evidence list still require human
review.

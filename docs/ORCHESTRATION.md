# Orchestration

1. Collect local inputs: job post markdown and optional candidate notes.
2. Run `jobsearch-skill <job-post>` with candidate notes when available.
3. Review fit score, evidence matches, missing proof, and risk flags.
4. Draft human-facing material in a separate step only after approval.

## Boundaries

- Local file reads are allowed.
- External account writes require a separate approved tool.
- Network calls are out of scope for this MVP.

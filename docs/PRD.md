# Product Requirements

## Goal

`jobsearch-skill` helps agents convert a saved job post and candidate notes into a reviewable application brief before any external action.

## Users

- Agents preparing role research.
- Candidates reviewing application readiness.
- Workflow builders testing job-search automations.

## MVP

- Parse local markdown job posts.
- Extract role metadata, requirements, instructions, and signals.
- Compare requirements with candidate evidence.
- Emit markdown or JSON briefs.
- Keep all side effects local.

## Safety

The tool never applies to jobs, sends email, scrapes live boards, fabricates experience, or writes to external systems.

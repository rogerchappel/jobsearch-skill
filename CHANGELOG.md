# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Expose the documented library API from the package root and verify both root
  imports and the installed CLI against the packed artifact.
- Recognize common qualification headings without mixing unrelated job-post
  sections into requirements.
- Support Markdown headings in candidate notes and parse CLI arguments in any
  documented order while rejecting unknown, duplicate, extra, or invalid
  arguments with clear usage diagnostics.

## 0.1.0

- Initial public release of the local-first job application brief skill and CLI.

Package distribution intentionally excludes `package-lock.json`. The lockfile is
used to make repository and CI installs reproducible; it is not needed by
consumers of this dependency-free package, whose `engines` field declares the
runtime requirement. The package smoke check validates the actual consumer
artifact and its executable/library surface.

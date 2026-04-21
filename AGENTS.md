<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Codex Bridge

This workspace includes a repo-local Codex plugin bridge at `plugins/claude-workspace-bridge`.
Its `skills` entry is a symlink to `.agent/skills`, so Codex and Claude Code share the same skill source.
For MCP-backed docs and web retrieval, use the plugin MCP definitions for `context7` and `tavily` after configuring credentials.

## Local Plugins

This repo also exposes project-scoped Codex plugins via `.agents/plugins/marketplace.json`.
Those entries point directly to the Claude-managed source trees for `axiom` and `swiftui-expert`.

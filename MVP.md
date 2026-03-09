# Arch — MVP Specification

## Overview

Arch is a local architecture engine for codebases.

It analyzes a repository, constructs a structural graph of the system, and allows developers or AI tools to query that graph to understand dependencies, flows, and relevant code snippets.

Arch focuses on deterministic code analysis, not AI inference. AI is optional and never required to use Arch.

## Core Principles

Arch must follow these principles:

1. Deterministic Architecture Analysis

   - Arch must extract architecture using:
     - AST parsing
     - static analysis
     - dependency graphs
   - It must never rely on AI to analyze code.

2. Local-First

   - Arch must run fully locally.
   - Requirements:
     - no API keys
     - no internet connection required
     - no cloud services
   - Users should be able to run `arch build` on any repository.

3. Fast Execution

   - Arch should feel instantaneous.
   - Target performance:

     | Repo Size | Target Build Time |
     | --- | --- |
     | 10k LOC | < 1s |
     | 50k LOC | < 3s |
     | 100k LOC | < 8s |

   - Performance matters more than deep analysis in the MVP.

4. Deterministic Output

   - Arch should always produce the same graph for the same code.
   - No heuristics based on:
     - embeddings
     - AI
     - semantic guesses

5. AI-Ready Output

   - Arch should generate context that AI tools can consume easily.
   - But Arch itself should not be an AI tool.

## MVP Scope

- Focus: TypeScript / JavaScript repositories.
- Supported languages:
  - TypeScript
  - JavaScript
- Future support may include Python, Go, Rust — but the MVP must focus on TypeScript.

## High Level Architecture

Arch has three main systems arranged as a pipeline:

Repository → AST Parser → Architecture Graph → Query Engine → Context Compiler

### Repository Graph Model

The architecture graph consists of:

- Nodes
- Edges

### Node Types

The following node types are supported in MVP:

- `file` — source file
- `class` — class definition
- `method` — class method
- `function` — standalone function
- `interface` — interface definition
- `type` — type definition
- `route` — http route

### Node Schema

Each node has the following structure:

```ts
interface ArchNode {
  id: string
  type: NodeType
  name: string
  filePath: string
  loc: {
    startLine: number
    endLine: number
    startOffset?: number
    endOffset?: number
  }

  exported?: boolean
  signature?: string
}
```

Example:

```json
{
  "id": "method:src/auth/AuthService.ts#login",
  "type": "method",
  "name": "login",
  "filePath": "src/auth/AuthService.ts",
  "loc": {
    "startLine": 12,
    "endLine": 48
  }
}
```

### Edge Types

Edges describe relationships between nodes.

Supported edge types:

- `contains` — file contains symbol
- `imports` — file imports file
- `calls` — function/method calls function
- `extends` — class extends class
- `implements` — class implements interface
- `references` — symbol references another symbol

Edge schema:

```ts
interface ArchEdge {
  from: string
  to: string
  type: EdgeType
  filePath?: string
  loc?: {
    startLine: number
    endLine: number
  }
}
```

Example:

```json
{
  "from": "method:AuthController.login",
  "to": "method:AuthService.login",
  "type": "calls"
}
```

## Directory Structure

Arch stores generated data in `.arch`:

```
.arch/
  graph/
    nodes.jsonl
    edges.jsonl
    graph-meta.json
  index/
    symbols.json
    files.json
  contexts/
```

### JSONL Format

Nodes and edges use JSONL.

Example:

```
{"id":"class:AuthService","type":"class"}
{"id":"method:AuthService.login","type":"method"}
```

Advantages:

- appendable
- diffable
- fast to parse

## CLI Commands

The MVP provides six commands:

- `arch build`
- `arch stats`
- `arch query`
- `arch deps`
- `arch show`
- `arch context`

### `arch build`

Builds the architecture graph.

Example:

```
Scanning repository...

Files scanned: 182
Symbols extracted: 621
Edges created: 1842

Graph saved to .arch/graph
```

### `arch stats`

Displays architecture statistics.

Example:

```
Repository Architecture

Files: 182
Symbols: 621
Edges: 1842

Symbol Types
  classes: 44
  methods: 279
  functions: 128
```

### `arch query`

Search for symbols.

Example:

```
arch query AuthService

Matches

class src/auth/AuthService.ts#AuthService

methods
  AuthService.login
  AuthService.logout
```

### `arch deps`

Show dependencies for a symbol.

Example:

```
arch deps AuthService

Imports
  JwtService
  UserRepository

Calls
  JwtService.generateToken
```

### `arch show`

Display a symbol snippet.

Example:

```
arch show AuthService.login

src/auth/AuthService.ts:12-48

async login(email: string, password: string) {
  ...
}
```

### `arch context`

Compile context for a feature or symbol.

Example:

```
arch context authentication

Authentication Flow

AuthController.login
  → AuthService.login
  → JwtService.generateToken
```

## Context Compiler

The context compiler returns:

- entrypoints
- dependency paths
- relevant files
- code snippets

Example JSON:

```json
{
  "query": "authentication",
  "entrypoints": ["AuthController.login"],
  "files": [
    "src/auth/AuthController.ts",
    "src/auth/AuthService.ts",
    "src/auth/JwtService.ts"
  ],
  "paths": [
    [
      "AuthController.login",
      "AuthService.login",
      "JwtService.generateToken"
    ]
  ]
}
```

### Snippet Extraction

Snippets are extracted via AST node location.

Steps:

1. Identify relevant nodes
2. Retrieve node location
3. Extract source text
4. Include minimal surrounding context

Example snippet:

```json
{
  "file": "src/auth/AuthService.ts",
  "symbol": "AuthService.login",
  "startLine": 12,
  "endLine": 48
}
```

## AST Parser

Arch uses `ts-morph`.

Parser responsibilities:

- load project
- parse source files
- extract symbols
- extract imports
- detect calls
- record node locations

Parser Pipeline:

source files → AST parsing → symbol extraction → relationship extraction → node + edge creation

### Snippet Selection Rules

Context bundles should remain small. Limits:

- max snippets: 8
- max files: 6
- max lines: 300

## What Arch Will NOT Include

These features are explicitly excluded from MVP.

### No AI inside Arch

Arch must not:

- call OpenAI
- require API keys
- generate AI summaries

AI integration can be added later as optional plugins.

### No Vector Databases

Arch must not include:

- embeddings
- semantic search
- vector storage

Architecture graphs replace this.

### No Cloud Services

Arch must never depend on:

- remote APIs
- hosted services

### No heavy IDE integration in MVP

IDE plugins are future work.

## Roadmap

Phase 1 — Graph Engine

Features:

- file discovery
- AST parsing
- symbol extraction
- import edges
- contains edges

Commands:

- `arch build`
- `arch stats`

Phase 2 — Symbol Queries

Features:

- node lookup
- snippet extraction

Commands:

- `arch query`
- `arch show`

Phase 3 — Dependency Analysis

Features:

- call detection
- dependency traversal

Commands:

- `arch deps`

Phase 4 — Context Compiler

Features:

- query scoring
- graph expansion
- snippet selection

Commands:

- `arch context`

Phase 5 — Optional AI Integrations

Possible future features:

- AI explanation layer
- MCP server
- IDE plugins

But the core should remain:

- fast
- local
- deterministic

## Package Architecture

```
packages/
  arch-cli
  arch-core
  arch-parser-ts
  arch-graph
  arch-context
```

### Module Responsibilities

- `arch-parser-ts`: AST parsing and symbol extraction.
- `arch-graph`: Graph storage and traversal.
- `arch-context`: Context compilation.
- `arch-cli`: Command line interface.

## Best Practices

- Keep the graph simple — complex graph models reduce performance.
- Prefer fewer node types and fewer edge types.
- Deterministic logic only — avoid heuristics that could change results between runs.
- Avoid framework-specific assumptions — do not hardcode patterns for React, Angular, NestJS.
- The graph should be framework-agnostic.
- Prefer readability over cleverness — Arch should be easy to maintain and extend.

## MVP Success Criteria

The MVP is successful if Arch can correctly handle:

- `arch build`
- `arch query AuthService`
- `arch deps AuthService`
- `arch context authentication`

on a typical TypeScript backend repository.

## Long Term Vision

Arch becomes the architecture engine for AI coding tools.

Possible integrations:

- local AI assistants
- IDE plugins
- automated code analysis
- architectural visualization

But the core should remain:

- fast
- local
- deterministic

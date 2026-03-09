export interface ContextSnippet {
  file: string
  symbol: string
  startLine: number
  endLine: number
}

export interface ContextBundle {
  query: string
  entrypoints: string[]
  files: string[]
  paths: string[][]
  snippets: ContextSnippet[]
}

export interface CompileContextOptions {
  query: string
}

export interface RankedNode {
  nodeId: string
  score: number
}

export interface ContextLimits {
  maxSnippets: number
  maxFiles: number
  maxLines: number
  maxDepth: number
  maxEntrypoints: number
  maxPaths: number
}

import type { ContextBundle } from '@arch/context'
import type { ArchNode, GraphMeta, NodeType } from '@arch/core'
import type { DepsResult } from '@arch/graph'

export interface BuildCommandResult {
  repoPath: string
  meta: GraphMeta
}

export interface StatsCommandResult {
  repoPath: string
  meta: GraphMeta
}

export interface QueryCommandMatch {
  nodeId: string
  type: NodeType
  name: string
  file: string
}

export interface QueryCommandResult {
  term: string
  matches: QueryCommandMatch[]
}

export interface ShowCommandResult {
  input: string
  node: ArchNode
  snippet: string
}

export type DepsCommandResult = DepsResult
export type ContextCommandResult = ContextBundle

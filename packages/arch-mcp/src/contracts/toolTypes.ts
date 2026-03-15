import type { QueryType, RetrievalMode } from '@archkit/graph'

export interface ArchContextInput {
  query: string
  limit?: number
  mode?: RetrievalMode
  include_next_actions?: boolean
}

export interface ArchQueryInput {
  query: string
  limit?: number
  mode?: RetrievalMode
  include_next_actions?: boolean
}

export interface ArchShowInput {
  target: string
}

export type DepsDirection = 'both' | 'inbound' | 'outbound'

export interface ArchDepsInput {
  target: string
  direction?: DepsDirection
  depth?: number
}

export type ArchFeaturesAction = 'upsert' | 'get' | 'list_targets' | 'list'

export interface ArchFeaturesInput {
  action: ArchFeaturesAction
  feature?: string
  aliases?: string[]
  targets?: string[]
}

export type ArchKnowledgeAction = 'add' | 'search' | 'recent' | 'get'

export interface ArchKnowledgeLinks {
  files?: string[]
  features?: string[]
  symbols?: string[]
}

export interface ArchKnowledgeInput {
  action: ArchKnowledgeAction
  id?: string
  title?: string
  content?: string
  query?: string
  limit?: number
  tags?: string[]
  links?: ArchKnowledgeLinks
  type?: 'decision' | 'workaround' | 'caveat' | 'note' | 'migration'
}

export interface RetrievalMetadataOutput {
  mode: RetrievalMode
  query_type: QueryType
  deterministic_confidence: number
  lexical_used: boolean
  semantic_used: boolean
  reason: string[]
}

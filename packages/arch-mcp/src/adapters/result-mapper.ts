import type { ArchNode } from '@archkit/core'
import type {
  DepsResult,
  HybridRetrievalResult,
  KnowledgeEntry,
  KnowledgeEntrySummary,
} from '@archkit/graph'
import type { ContextBundle } from '@archkit/context'
import type { RetrievalMetadataOutput } from '../contracts/toolTypes'

function toRetrievalMetadata(
  retrievalMetadata: HybridRetrievalResult['retrievalMetadata'] | ContextBundle['retrievalMetadata'],
): RetrievalMetadataOutput | undefined {
  if (!retrievalMetadata) {
    return undefined
  }

  return {
    mode: retrievalMetadata.mode,
    query_type: retrievalMetadata.queryType,
    deterministic_confidence: retrievalMetadata.deterministicConfidence,
    lexical_used: retrievalMetadata.lexicalUsed,
    semantic_used: retrievalMetadata.semanticUsed,
    reason: retrievalMetadata.reason,
  }
}

export function mapContextResult(
  result: ContextBundle,
  limit: number,
  includeNextActions: boolean,
): Record<string, unknown> {
  return {
    query: result.query,
    query_type: result.retrievalMetadata?.queryType ?? 'conceptual',
    mode: result.mode ?? result.retrievalMetadata?.mode ?? 'hybrid',
    retrieval_metadata: toRetrievalMetadata(result.retrievalMetadata),
    resolution: result.resolution,
    entrypoints: result.entrypoints,
    files: result.files,
    paths: result.paths,
    snippets: result.snippets.slice(0, limit),
    results: (result.retrievalResults ?? []).slice(0, limit),
    ambiguities: result.ambiguities ?? [],
    next_actions: includeNextActions ? (result.nextActions ?? []) : [],
  }
}

export function mapQueryResult(
  result: HybridRetrievalResult,
  limit: number,
  includeNextActions: boolean,
): Record<string, unknown> {
  return {
    query: result.query,
    query_type: result.retrievalMetadata.queryType,
    mode: result.mode,
    retrieval_metadata: toRetrievalMetadata(result.retrievalMetadata),
    results: result.results.slice(0, limit),
    ambiguities: result.ambiguities ?? [],
    next_actions: includeNextActions ? (result.nextActions ?? []) : [],
  }
}

export function mapShowSymbolResult(
  target: string,
  node: ArchNode,
  snippet: string,
  nextActions: unknown[],
): Record<string, unknown> {
  return {
    target,
    kind: 'symbol',
    result: {
      node,
      snippet,
    },
    next_actions: nextActions,
  }
}

export function mapShowFileResult(
  target: string,
  symbols: ArchNode[],
): Record<string, unknown> {
  return {
    target,
    kind: 'file',
    result: {
      file: target,
      symbol_count: symbols.length,
      symbols: symbols.map((symbol) => ({
        id: symbol.id,
        type: symbol.type,
        name: symbol.name,
        loc: symbol.loc,
      })),
    },
    next_actions: [
      {
        tool: 'arch_deps',
        priority: 1,
        args: { target },
        reason: 'Inspect structural dependencies around this file path.',
      },
    ],
  }
}

export function mapDepsResult(
  result: DepsResult,
  direction: 'both' | 'inbound' | 'outbound',
  depth: number,
): Record<string, unknown> {
  return {
    target: result.input,
    direction,
    depth,
    resolved_node_ids: result.resolvedNodeIds,
    imports: direction === 'inbound' ? [] : result.imports,
    calls: direction === 'inbound' ? [] : result.calls,
    callers: direction === 'outbound' ? [] : result.callers,
    next_actions: result.nextActions ?? [],
    ambiguities: result.ambiguities ?? [],
  }
}

export function mapKnowledgeEntry(entry: KnowledgeEntry): Record<string, unknown> {
  return {
    id: entry.id,
    title: entry.title,
    content: entry.body,
    type: entry.type,
    feature: entry.feature,
    tags: entry.tags,
    file: entry.file,
    created_at: entry.createdAt,
  }
}

export function mapKnowledgeSummaries(entries: KnowledgeEntrySummary[]): Record<string, unknown>[] {
  return entries.map((entry) => ({
    id: entry.id,
    title: entry.title,
    type: entry.type,
    feature: entry.feature,
    tags: entry.tags,
    file: entry.file,
    created_at: entry.createdAt,
  }))
}

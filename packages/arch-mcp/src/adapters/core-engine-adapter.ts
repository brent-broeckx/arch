import { ContextCompiler } from '@archkit/context'
import {
  assignFeaturePattern,
  executeHybridRetrieval,
  extractSnippetForNode,
  getFeatureDetails,
  getKnowledgeEntry,
  listFeatureSummaries,
  listKnowledgeEntries,
  queryDependencies,
  readPersistedFilesIndex,
  readPersistedNodes,
  resolveSymbolInput,
  searchKnowledgeEntries,
  addKnowledgeEntry,
  type RetrievalMode,
} from '@archkit/graph'
import type { ArchNode } from '@archkit/core'
import type { KnowledgeEntry } from '@archkit/graph'
import { ArchMcpError } from '../utils/errors'

export interface CoreEngineAdapter {
  context(query: string, mode: RetrievalMode, limitsEnabled: boolean): Promise<Awaited<ReturnType<ContextCompiler['compile']>>>
  query(query: string, mode: RetrievalMode): Promise<Awaited<ReturnType<typeof executeHybridRetrieval>>>
  show(target: string): Promise<{ kind: 'symbol'; node: ArchNode; snippet: string } | { kind: 'file'; file: string; symbols: ArchNode[] }>
  deps(target: string): Promise<Awaited<ReturnType<typeof queryDependencies>>>
  featuresList(): Promise<Awaited<ReturnType<typeof listFeatureSummaries>>>
  featuresGet(feature: string): Promise<Awaited<ReturnType<typeof getFeatureDetails>>>
  featuresUpsert(feature: string, aliases: string[], targets: string[]): Promise<{ patterns: string[]; aliases: string[]; status: 'created' | 'updated' }>
  knowledgeAdd(input: {
    title: string
    content: string
    tags: string[]
    type: 'decision' | 'workaround' | 'caveat' | 'note' | 'migration'
    links?: {
      files?: string[]
      features?: string[]
      symbols?: string[]
    }
  }): Promise<Awaited<ReturnType<typeof addKnowledgeEntry>>>
  knowledgeSearch(query: string): Promise<KnowledgeEntry[]>
  knowledgeRecent(limit: number): Promise<Awaited<ReturnType<typeof listKnowledgeEntries>>>
  knowledgeGet(id: string): Promise<Awaited<ReturnType<typeof getKnowledgeEntry>>>
}

export function createCoreEngineAdapter(rootDir: string): CoreEngineAdapter {
  const compiler = new ContextCompiler()

  return {
    async context(query: string, mode: RetrievalMode, limitsEnabled: boolean) {
      return compiler.compile(rootDir, {
        query,
        mode,
        limits: limitsEnabled,
      })
    },

    async query(query: string, mode: RetrievalMode) {
      return executeHybridRetrieval(rootDir, query, { mode })
    },

    async show(target: string) {
      const normalizedTarget = normalizePathLike(target)
      const nodes = await readPersistedNodes(rootDir)
      const fileSymbols = nodes
        .filter((node) => node.filePath === normalizedTarget && node.type !== 'file')
        .sort((left, right) => left.id.localeCompare(right.id))

      if (fileSymbols.length > 0) {
        return {
          kind: 'file' as const,
          file: normalizedTarget,
          symbols: fileSymbols,
        }
      }

      const resolved = await resolveSymbolInput(rootDir, target)
      if (resolved.nodes.length === 0) {
        throw new ArchMcpError('SYMBOL_NOT_FOUND', `No symbol found for: ${target}`)
      }

      if (resolved.nodes.length > 1) {
        throw new ArchMcpError('SYMBOL_AMBIGUOUS', `Ambiguous symbol: ${target}`, {
          candidates: resolved.nodes.map((node) => node.id).sort((left, right) => left.localeCompare(right)),
        })
      }

      const selected = resolved.nodes[0]
      const snippet = await extractSnippetForNode(rootDir, selected)
      return {
        kind: 'symbol' as const,
        node: selected,
        snippet,
      }
    },

    async deps(target: string) {
      const normalizedTarget = normalizePathLike(target)
      const nodes = await readPersistedNodes(rootDir)
      const scopedNodes = nodes.filter((node) => node.filePath === normalizedTarget && node.type !== 'file')

      if (scopedNodes.length > 0) {
        return queryDependencies(rootDir, normalizedTarget, scopedNodes)
      }

      const resolved = await resolveSymbolInput(rootDir, target)
      if (resolved.nodes.length === 0) {
        throw new ArchMcpError('SYMBOL_NOT_FOUND', `No symbol found for: ${target}`)
      }

      if (resolved.nodes.length > 1) {
        throw new ArchMcpError('SYMBOL_AMBIGUOUS', `Ambiguous symbol: ${target}`, {
          candidates: resolved.nodes.map((node) => node.id).sort((left, right) => left.localeCompare(right)),
        })
      }

      return queryDependencies(rootDir, target, resolved.nodes)
    },

    async featuresList() {
      return listFeatureSummaries(rootDir)
    },

    async featuresGet(feature: string) {
      return getFeatureDetails(rootDir, feature)
    },

    async featuresUpsert(feature: string, aliases: string[], targets: string[]) {
      const normalizedFeature = feature.trim()
      if (!normalizedFeature) {
        throw new ArchMcpError('INVALID_INPUT', 'Feature is required for action upsert.')
      }

      if (targets.length === 0) {
        throw new ArchMcpError('INVALID_INPUT', 'At least one target is required for action upsert.')
      }

      const filesIndex = await readPersistedFilesIndex(rootDir)
      const normalizedFiles = new Set(filesIndex.map((filePath) => normalizePathLike(filePath)))

      let created = false
      for (const rawTarget of targets) {
        const normalizedTarget = normalizePathLike(rawTarget)
        if (!containsGlob(normalizedTarget) && !normalizedFiles.has(normalizedTarget)) {
          throw new ArchMcpError(
            'INVALID_TARGET',
            `Target is not indexed in the current graph: ${normalizedTarget}`,
          )
        }

        const assignment = await assignFeaturePattern(rootDir, normalizedFeature, normalizedTarget)
        created = created || assignment.created
      }

      const details = await getFeatureDetails(rootDir, normalizedFeature)
      return {
        patterns: details?.patterns ?? targets.map((target) => normalizePathLike(target)),
        aliases,
        status: created ? 'created' : 'updated',
      }
    },

    async knowledgeAdd(input) {
      const normalizedTitle = input.title.trim()
      const normalizedContent = input.content.trim()
      if (!normalizedTitle || !normalizedContent) {
        throw new ArchMcpError('INVALID_INPUT', 'Knowledge add requires non-empty title and content.')
      }

      const feature = input.links?.features?.[0]
      const body = appendKnowledgeLinks(normalizedContent, input.links)

      return addKnowledgeEntry(rootDir, {
        type: input.type,
        title: normalizedTitle,
        body,
        feature,
        tags: input.tags,
      })
    },

    async knowledgeSearch(query: string) {
      const summaries = await searchKnowledgeEntries(rootDir, query)
      const entries = await Promise.all(summaries.map((summary) => getKnowledgeEntry(rootDir, summary.id)))
      return entries.filter((entry): entry is NonNullable<typeof entry> => entry !== undefined)
    },

    async knowledgeRecent(limit: number) {
      const summaries = await listKnowledgeEntries(rootDir)
      return summaries
        .slice()
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, limit)
    },

    async knowledgeGet(id: string) {
      return getKnowledgeEntry(rootDir, id)
    },
  }
}

function appendKnowledgeLinks(
  content: string,
  links:
    | {
      files?: string[]
      features?: string[]
      symbols?: string[]
    }
    | undefined,
): string {
  if (!links) {
    return content
  }

  const sections: string[] = []
  if (links.files && links.files.length > 0) {
    sections.push(`files: ${links.files.map((file) => normalizePathLike(file)).join(', ')}`)
  }

  if (links.features && links.features.length > 0) {
    sections.push(`features: ${links.features.join(', ')}`)
  }

  if (links.symbols && links.symbols.length > 0) {
    sections.push(`symbols: ${links.symbols.join(', ')}`)
  }

  if (sections.length === 0) {
    return content
  }

  return `${content}\n\nLinked context\n${sections.map((section) => `- ${section}`).join('\n')}`
}

function containsGlob(value: string): boolean {
  return value.includes('*') || value.includes('?') || value.includes('[') || value.includes('{')
}

function normalizePathLike(value: string): string {
  const trimmed = value.trim().replaceAll('\\\\', '/').replaceAll('\\', '/')
  if (trimmed.startsWith('./')) {
    return trimmed.slice(2)
  }

  return trimmed.replace(/\/+/g, '/')
}

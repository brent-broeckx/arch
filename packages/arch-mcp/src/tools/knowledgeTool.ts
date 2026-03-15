import type { McpToolHandler, McpToolResult } from '../models/mcp-types'
import type { ArchKnowledgeInput } from '../contracts/toolTypes'
import { ArchMcpError } from '../utils/errors'
import { mapKnowledgeEntry, mapKnowledgeSummaries } from '../adapters/result-mapper'
import { createCoreEngineAdapter } from '../adapters/core-engine-adapter'

export const archKnowledgeToolHandler: McpToolHandler = async (
  args,
  context,
): Promise<McpToolResult> => {
  const input = args as unknown as ArchKnowledgeInput
  const action = input.action
  if (!action) {
    throw new ArchMcpError('INVALID_INPUT', 'arch_knowledge requires an action.')
  }

  const adapter = createCoreEngineAdapter(context.rootDir)

  if (action === 'add') {
    const title = input.title?.trim()
    const content = input.content?.trim()

    if (!title || !content) {
      throw new ArchMcpError('INVALID_INPUT', 'arch_knowledge add requires title and content.')
    }

    const entry = await adapter.knowledgeAdd({
      title,
      content,
      tags: normalizeStringArray(input.tags),
      type: input.type ?? 'note',
      links: input.links,
    })

    return {
      structuredContent: {
        action,
        entry: mapKnowledgeEntry(entry),
      },
    }
  }

  if (action === 'search') {
    const query = input.query?.trim()
    if (!query) {
      throw new ArchMcpError('INVALID_INPUT', 'arch_knowledge search requires query.')
    }

    const entries = await adapter.knowledgeSearch(query)
    return {
      structuredContent: {
        action,
        query,
        results: entries.map((entry) => mapKnowledgeEntry(entry)),
      },
    }
  }

  if (action === 'recent') {
    const limit = clampLimit(input.limit)
    const summaries = await adapter.knowledgeRecent(limit)

    return {
      structuredContent: {
        action,
        limit,
        results: mapKnowledgeSummaries(summaries),
      },
    }
  }

  if (action === 'get') {
    const id = input.id?.trim()
    if (!id) {
      throw new ArchMcpError('INVALID_INPUT', 'arch_knowledge get requires id.')
    }

    const entry = await adapter.knowledgeGet(id)
    if (!entry) {
      throw new ArchMcpError('KNOWLEDGE_NOT_FOUND', `No knowledge entry found for id: ${id}`)
    }

    return {
      structuredContent: {
        action,
        entry: mapKnowledgeEntry(entry),
      },
    }
  }

  throw new ArchMcpError('INVALID_INPUT', `Unknown arch_knowledge action: ${action}`)
}

function normalizeStringArray(values: string[] | undefined): string[] {
  if (!values) {
    return []
  }

  return values.map((value) => value.trim()).filter((value) => value.length > 0)
}

function clampLimit(value: number | undefined): number {
  if (value === undefined) {
    return 10
  }

  return Math.max(1, Math.min(100, Math.floor(value)))
}

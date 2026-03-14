import type { McpToolHandler, McpToolResult } from '../models/mcp-types'
import type { ArchQueryInput } from '../contracts/toolTypes'
import { ArchMcpError } from '../utils/errors'
import { mapQueryResult } from '../adapters/result-mapper'
import { createCoreEngineAdapter } from '../adapters/core-engine-adapter'

export const archQueryToolHandler: McpToolHandler = async (
  args,
  context,
): Promise<McpToolResult> => {
  const input = args as unknown as ArchQueryInput
  const query = input.query?.trim()
  if (!query) {
    throw new ArchMcpError('INVALID_INPUT', 'arch_query requires a non-empty query.')
  }

  const limit = clampLimit(input.limit)
  const includeNextActions = input.include_next_actions ?? true
  const mode = input.mode ?? 'hybrid'

  const adapter = createCoreEngineAdapter(context.rootDir)
  const result = await adapter.query(query, mode)

  return {
    structuredContent: mapQueryResult(result, limit, includeNextActions),
  }
}

function clampLimit(value: number | undefined): number {
  if (value === undefined) {
    return 10
  }

  return Math.max(1, Math.min(40, Math.floor(value)))
}

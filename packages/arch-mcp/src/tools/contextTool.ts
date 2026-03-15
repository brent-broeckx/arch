import type { McpToolHandler, McpToolResult } from '../models/mcp-types'
import type { ArchContextInput } from '../contracts/toolTypes'
import { ArchMcpError } from '../utils/errors'
import { mapContextResult } from '../adapters/result-mapper'
import { createCoreEngineAdapter } from '../adapters/core-engine-adapter'

export const archContextToolHandler: McpToolHandler = async (
  args,
  context,
): Promise<McpToolResult> => {
  const input = args as unknown as ArchContextInput
  const query = input.query?.trim()
  if (!query) {
    throw new ArchMcpError('INVALID_INPUT', 'arch_context requires a non-empty query.')
  }

  const limit = clampLimit(input.limit)
  const includeNextActions = input.include_next_actions ?? true
  const mode = input.mode ?? 'hybrid'

  const adapter = createCoreEngineAdapter(context.rootDir)
  const result = await adapter.context(query, mode, true)

  return {
    structuredContent: mapContextResult(result, limit, includeNextActions),
  }
}

function clampLimit(value: number | undefined): number {
  if (value === undefined) {
    return 10
  }

  return Math.max(1, Math.min(40, Math.floor(value)))
}

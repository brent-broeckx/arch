import type { McpToolHandler, McpToolResult } from '../models/mcp-types'
import type { ArchDepsInput } from '../contracts/toolTypes'
import { ArchMcpError } from '../utils/errors'
import { mapDepsResult } from '../adapters/result-mapper'
import { createCoreEngineAdapter } from '../adapters/core-engine-adapter'

export const archDepsToolHandler: McpToolHandler = async (
  args,
  context,
): Promise<McpToolResult> => {
  const input = args as unknown as ArchDepsInput
  const target = input.target?.trim()
  if (!target) {
    throw new ArchMcpError('INVALID_INPUT', 'arch_deps requires a non-empty target.')
  }

  const depth = input.depth ?? 1
  if (depth !== 1) {
    throw new ArchMcpError('INVALID_INPUT', 'arch_deps currently supports depth=1 only.')
  }

  const direction = input.direction ?? 'both'
  const adapter = createCoreEngineAdapter(context.rootDir)
  const result = await adapter.deps(target)

  return {
    structuredContent: mapDepsResult(result, direction, depth),
  }
}

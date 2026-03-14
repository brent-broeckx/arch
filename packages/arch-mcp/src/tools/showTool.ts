import type { McpToolHandler, McpToolResult } from '../models/mcp-types'
import type { ArchShowInput } from '../contracts/toolTypes'
import { ArchMcpError } from '../utils/errors'
import { mapShowFileResult, mapShowSymbolResult } from '../adapters/result-mapper'
import { createCoreEngineAdapter } from '../adapters/core-engine-adapter'

export const archShowToolHandler: McpToolHandler = async (
  args,
  context,
): Promise<McpToolResult> => {
  const input = args as unknown as ArchShowInput
  const target = input.target?.trim()
  if (!target) {
    throw new ArchMcpError('INVALID_INPUT', 'arch_show requires a non-empty target.')
  }

  const adapter = createCoreEngineAdapter(context.rootDir)
  const result = await adapter.show(target)

  if (result.kind === 'file') {
    return {
      structuredContent: mapShowFileResult(result.file, result.symbols),
    }
  }

  return {
    structuredContent: mapShowSymbolResult(target, result.node, result.snippet, [
      {
        tool: 'arch_deps',
        priority: 1,
        args: { target: result.node.id },
        reason: 'Inspect exact dependencies for this symbol.',
      },
    ]),
  }
}

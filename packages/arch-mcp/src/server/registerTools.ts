import { MCP_TOOL_DEFINITIONS } from '../contracts/toolSchemas'
import type { McpToolHandler } from '../models/mcp-types'
import { archContextToolHandler } from '../tools/contextTool'
import { archDepsToolHandler } from '../tools/depsTool'
import { archFeaturesToolHandler } from '../tools/featuresTool'
import { archKnowledgeToolHandler } from '../tools/knowledgeTool'
import { archQueryToolHandler } from '../tools/queryTool'
import { archShowToolHandler } from '../tools/showTool'

export function registerTools(): {
  definitions: typeof MCP_TOOL_DEFINITIONS
  handlers: Record<string, McpToolHandler>
} {
  return {
    definitions: MCP_TOOL_DEFINITIONS,
    handlers: {
      arch_context: archContextToolHandler,
      arch_query: archQueryToolHandler,
      arch_show: archShowToolHandler,
      arch_deps: archDepsToolHandler,
      arch_features: archFeaturesToolHandler,
      arch_knowledge: archKnowledgeToolHandler,
    },
  }
}

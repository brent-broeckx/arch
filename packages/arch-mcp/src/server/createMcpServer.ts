import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import * as z from 'zod/v4'
import { registerTools } from './registerTools'
import type { CreateMcpServerOptions, McpServerInstance } from '../models/mcp-types'
import { toErrorPayload, toArchMcpError } from '../utils/errors'

export function createMcpServer(options: CreateMcpServerOptions = {}): McpServerInstance {
  const rootDir = options.rootDir ?? process.cwd()
  const server = new McpServer(
    {
      name: 'archkit-mcp',
      version: '0.1.0',
    },
  )

  const registry = registerTools()

  registry.definitions.forEach((definition) => {
    const handler = registry.handlers[definition.name]

    server.registerTool(definition.name, {
      description: definition.description,
      inputSchema: getToolInputSchema(definition.name),
    }, async (args): Promise<CallToolResult> => {
      if (!handler) {
        const payload = toErrorPayload({
          code: 'UNKNOWN_TOOL',
          message: `Unknown tool: ${definition.name}`,
        })

        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(payload),
            },
          ],
          structuredContent: payload,
        }
      }

      try {
        const result = await handler(args as Record<string, unknown>, { rootDir })
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result.structuredContent),
            },
          ],
          structuredContent: result.structuredContent,
        }
      } catch (error) {
        const payload = toErrorPayload(error)
        const normalized = toArchMcpError(error)
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(payload),
            },
          ],
          structuredContent: {
            ...payload,
            code: normalized.code,
          },
        }
      }
    })
  })

  return {
    async start() {
      const transport = new StdioServerTransport()
      await server.connect(transport)
    },
  }
}

function getToolInputSchema(toolName: string): z.ZodTypeAny {
  if (toolName === 'arch_context') {
    return z.object({
      query: z.string().min(1),
      limit: z.number().int().min(1).max(40).optional(),
      mode: z.enum(['exact', 'lexical', 'hybrid', 'semantic']).optional(),
      include_next_actions: z.boolean().optional(),
    })
  }

  if (toolName === 'arch_query') {
    return z.object({
      query: z.string().min(1),
      limit: z.number().int().min(1).max(40).optional(),
      mode: z.enum(['exact', 'lexical', 'hybrid', 'semantic']).optional(),
      include_next_actions: z.boolean().optional(),
    })
  }

  if (toolName === 'arch_show') {
    return z.object({
      target: z.string().min(1),
    })
  }

  if (toolName === 'arch_deps') {
    return z.object({
      target: z.string().min(1),
      direction: z.enum(['both', 'inbound', 'outbound']).optional(),
      depth: z.literal(1).optional(),
    })
  }

  if (toolName === 'arch_features') {
    return z.object({
      action: z.enum(['upsert', 'get', 'list_targets', 'list']),
      feature: z.string().min(1).optional(),
      aliases: z.array(z.string()).optional(),
      targets: z.array(z.string()).optional(),
    })
  }

  if (toolName === 'arch_knowledge') {
    return z.object({
      action: z.enum(['add', 'search', 'recent', 'get']),
      id: z.string().optional(),
      title: z.string().optional(),
      content: z.string().optional(),
      query: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional(),
      tags: z.array(z.string()).optional(),
      links: z.object({
        files: z.array(z.string()).optional(),
        features: z.array(z.string()).optional(),
        symbols: z.array(z.string()).optional(),
      }).optional(),
      type: z.enum(['decision', 'workaround', 'caveat', 'note', 'migration']).optional(),
    })
  }

  return z.object({}).loose()
}

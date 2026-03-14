import type { JsonSchema, McpToolDefinition } from '../models/mcp-types'

const retrievalModeSchema: JsonSchema = {
  type: 'string',
  enum: ['exact', 'lexical', 'hybrid', 'semantic'],
}

export const ARCH_CONTEXT_TOOL: McpToolDefinition = {
  name: 'arch_context',
  description:
    'Use for broad topic exploration when the agent wants repository context for a concept or area.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', minLength: 1 },
      limit: { type: 'number', minimum: 1, maximum: 40, default: 10 },
      mode: retrievalModeSchema,
      include_next_actions: { type: 'boolean', default: true },
    },
    required: ['query'],
    additionalProperties: false,
  },
}

export const ARCH_QUERY_TOOL: McpToolDefinition = {
  name: 'arch_query',
  description:
    'Use for natural-language repository lookup when the agent wants to find where something is implemented.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', minLength: 1 },
      limit: { type: 'number', minimum: 1, maximum: 40, default: 10 },
      mode: retrievalModeSchema,
      include_next_actions: { type: 'boolean', default: true },
    },
    required: ['query'],
    additionalProperties: false,
  },
}

export const ARCH_SHOW_TOOL: McpToolDefinition = {
  name: 'arch_show',
  description:
    'Use for exact inspection of a known file, symbol, or module. Prefer after arch_context or arch_query returns a strong candidate.',
  inputSchema: {
    type: 'object',
    properties: {
      target: { type: 'string', minLength: 1 },
    },
    required: ['target'],
    additionalProperties: false,
  },
}

export const ARCH_DEPS_TOOL: McpToolDefinition = {
  name: 'arch_deps',
  description:
    'Use for exact structural relationships around a known symbol/module/file. Prefer when analyzing dependencies or graph relationships.',
  inputSchema: {
    type: 'object',
    properties: {
      target: { type: 'string', minLength: 1 },
      direction: {
        type: 'string',
        enum: ['both', 'inbound', 'outbound'],
        default: 'both',
      },
      depth: { type: 'number', minimum: 1, maximum: 1, default: 1 },
    },
    required: ['target'],
    additionalProperties: false,
  },
}

export const ARCH_FEATURES_TOOL: McpToolDefinition = {
  name: 'arch_features',
  description:
    'Use to add, update, or retrieve project feature mappings so Arch can later search feature-related code more accurately.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['upsert', 'get', 'list_targets', 'list'],
      },
      feature: { type: 'string', minLength: 1 },
      aliases: {
        type: 'array',
        items: { type: 'string' },
      },
      targets: {
        type: 'array',
        items: { type: 'string' },
      },
    },
    required: ['action'],
    additionalProperties: false,
  },
}

export const ARCH_KNOWLEDGE_TOOL: McpToolDefinition = {
  name: 'arch_knowledge',
  description:
    'Use to store and retrieve persistent project knowledge that should remain available to developers and future AI sessions.',
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['add', 'search', 'recent', 'get'],
      },
      id: { type: 'string' },
      title: { type: 'string' },
      content: { type: 'string' },
      query: { type: 'string' },
      limit: { type: 'number', minimum: 1, maximum: 100, default: 10 },
      tags: {
        type: 'array',
        items: { type: 'string' },
      },
      links: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: { type: 'string' },
          },
          features: {
            type: 'array',
            items: { type: 'string' },
          },
          symbols: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        additionalProperties: false,
      },
      type: {
        type: 'string',
        enum: ['decision', 'workaround', 'caveat', 'note', 'migration'],
        default: 'note',
      },
    },
    required: ['action'],
    additionalProperties: false,
  },
}

export const MCP_TOOL_DEFINITIONS: McpToolDefinition[] = [
  ARCH_CONTEXT_TOOL,
  ARCH_QUERY_TOOL,
  ARCH_SHOW_TOOL,
  ARCH_DEPS_TOOL,
  ARCH_FEATURES_TOOL,
  ARCH_KNOWLEDGE_TOOL,
]

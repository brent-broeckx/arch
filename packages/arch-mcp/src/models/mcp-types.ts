export type JsonSchema = {
  type: string
  description?: string
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  required?: string[]
  enum?: string[]
  additionalProperties?: boolean
  default?: unknown
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
}

export interface McpToolDefinition {
  name: string
  description: string
  inputSchema: JsonSchema
}

export interface McpToolContext {
  rootDir: string
}

export interface McpToolResult {
  structuredContent: Record<string, unknown>
}

export type McpToolHandler = (
  args: Record<string, unknown>,
  context: McpToolContext,
) => Promise<McpToolResult>

export interface McpServerInstance {
  start(): Promise<void>
}

export interface CreateMcpServerOptions {
  rootDir?: string
}

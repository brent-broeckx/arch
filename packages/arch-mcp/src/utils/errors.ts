export class ArchMcpError extends Error {
  public readonly code: string
  public readonly details?: unknown

  public constructor(code: string, message: string, details?: unknown) {
    super(message)
    this.code = code
    this.details = details
  }
}

export function toArchMcpError(error: unknown): ArchMcpError {
  if (error instanceof ArchMcpError) {
    return error
  }

  if (error instanceof Error) {
    return new ArchMcpError('MCP_TOOL_ERROR', error.message)
  }

  return new ArchMcpError('MCP_TOOL_ERROR', 'Tool execution failed.')
}

export function toErrorPayload(error: unknown): Record<string, unknown> {
  const normalized = toArchMcpError(error)
  return {
    error: {
      code: normalized.code,
      message: normalized.message,
      details: normalized.details,
    },
  }
}

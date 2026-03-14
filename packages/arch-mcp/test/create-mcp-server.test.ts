import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMcpServer } from '../src/server/createMcpServer'

const {
  mockRegisterTool,
  mockConnect,
  mockMcpServer,
  mockTransport,
} = vi.hoisted(() => {
  const registerTool = vi.fn()
  const connect = vi.fn()

  return {
    mockRegisterTool: registerTool,
    mockConnect: connect,
    mockMcpServer: vi.fn().mockImplementation(() => ({
      registerTool,
      connect,
    })),
    mockTransport: vi.fn().mockImplementation(() => ({})),
  }
})

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: mockMcpServer,
}))

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: mockTransport,
}))

describe('createMcpServer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers tools and starts with stdio transport', async () => {
    const server = createMcpServer({ rootDir: '/repo' })
    await server.start()

    expect(mockMcpServer).toHaveBeenCalledTimes(1)
    expect(mockRegisterTool).toHaveBeenCalledTimes(6)
    expect(mockTransport).toHaveBeenCalledTimes(1)
    expect(mockConnect).toHaveBeenCalledTimes(1)
  })
})

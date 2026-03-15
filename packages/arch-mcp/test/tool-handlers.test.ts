import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockContext,
  mockQuery,
  mockShow,
  mockDeps,
  mockMapContextResult,
  mockMapQueryResult,
  mockMapShowFileResult,
  mockMapShowSymbolResult,
  mockMapDepsResult,
} = vi.hoisted(() => ({
  mockContext: vi.fn(),
  mockQuery: vi.fn(),
  mockShow: vi.fn(),
  mockDeps: vi.fn(),
  mockMapContextResult: vi.fn(),
  mockMapQueryResult: vi.fn(),
  mockMapShowFileResult: vi.fn(),
  mockMapShowSymbolResult: vi.fn(),
  mockMapDepsResult: vi.fn(),
}))

vi.mock('../src/adapters/core-engine-adapter', () => ({
  createCoreEngineAdapter: vi.fn().mockImplementation(() => ({
    context: mockContext,
    query: mockQuery,
    show: mockShow,
    deps: mockDeps,
  })),
}))

vi.mock('../src/adapters/result-mapper', () => ({
  mapContextResult: mockMapContextResult,
  mapQueryResult: mockMapQueryResult,
  mapShowFileResult: mockMapShowFileResult,
  mapShowSymbolResult: mockMapShowSymbolResult,
  mapDepsResult: mockMapDepsResult,
}))

import { archContextToolHandler } from '../src/tools/contextTool'
import { archQueryToolHandler } from '../src/tools/queryTool'
import { archShowToolHandler } from '../src/tools/showTool'
import { archDepsToolHandler } from '../src/tools/depsTool'

describe('mcp tool handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates required context query', async () => {
    await expect(archContextToolHandler({}, { rootDir: '/repo' })).rejects.toThrow(
      'arch_context requires a non-empty query.',
    )
  })

  it('maps context result with defaults', async () => {
    mockContext.mockResolvedValue({ nodes: [] })
    mockMapContextResult.mockReturnValue({ kind: 'context' })

    const result = await archContextToolHandler(
      { query: 'auth flow' },
      { rootDir: '/repo' },
    )

    expect(mockContext).toHaveBeenCalledWith('auth flow', 'hybrid', true)
    expect(mockMapContextResult).toHaveBeenCalledWith({ nodes: [] }, 10, true)
    expect(result).toEqual({ structuredContent: { kind: 'context' } })
  })

  it('clamps context limit to minimum', async () => {
    mockContext.mockResolvedValue({ nodes: [] })
    mockMapContextResult.mockReturnValue({ kind: 'context' })

    await archContextToolHandler(
      { query: 'auth flow', limit: 0, include_next_actions: false },
      { rootDir: '/repo' },
    )

    expect(mockMapContextResult).toHaveBeenCalledWith({ nodes: [] }, 1, false)
  })

  it('validates required query input', async () => {
    await expect(archQueryToolHandler({}, { rootDir: '/repo' })).rejects.toThrow(
      'arch_query requires a non-empty query.',
    )
  })

  it('maps query result with clamped limit', async () => {
    mockQuery.mockResolvedValue({ nodes: [] })
    mockMapQueryResult.mockReturnValue({ kind: 'query' })

    const result = await archQueryToolHandler(
      { query: 'parse', limit: 99, include_next_actions: false, mode: 'exact' },
      { rootDir: '/repo' },
    )

    expect(mockQuery).toHaveBeenCalledWith('parse', 'exact')
    expect(mockMapQueryResult).toHaveBeenCalledWith({ nodes: [] }, 40, false)
    expect(result).toEqual({ structuredContent: { kind: 'query' } })
  })

  it('maps query result with default options', async () => {
    mockQuery.mockResolvedValue({ nodes: [] })
    mockMapQueryResult.mockReturnValue({ kind: 'query' })

    await archQueryToolHandler(
      { query: 'parse' },
      { rootDir: '/repo' },
    )

    expect(mockQuery).toHaveBeenCalledWith('parse', 'hybrid')
    expect(mockMapQueryResult).toHaveBeenCalledWith({ nodes: [] }, 10, true)
  })

  it('validates required show target', async () => {
    await expect(archShowToolHandler({}, { rootDir: '/repo' })).rejects.toThrow(
      'arch_show requires a non-empty target.',
    )
  })

  it('returns file result for show file branch', async () => {
    const fileResult = {
      kind: 'file',
      file: { path: 'src/a.ts' },
      symbols: [{ id: 'x' }],
    }
    mockShow.mockResolvedValue(fileResult)
    mockMapShowFileResult.mockReturnValue({ kind: 'show-file' })

    const result = await archShowToolHandler(
      { target: 'src/a.ts' },
      { rootDir: '/repo' },
    )

    expect(mockMapShowFileResult).toHaveBeenCalledWith(fileResult.file, fileResult.symbols)
    expect(result).toEqual({ structuredContent: { kind: 'show-file' } })
  })

  it('returns symbol result for show symbol branch', async () => {
    const symbolResult = {
      kind: 'symbol',
      node: { id: 'function:src/a.ts#run' },
      snippet: 'function run() {}',
    }
    mockShow.mockResolvedValue(symbolResult)
    mockMapShowSymbolResult.mockReturnValue({ kind: 'show-symbol' })

    const result = await archShowToolHandler(
      { target: 'run' },
      { rootDir: '/repo' },
    )

    expect(mockMapShowSymbolResult).toHaveBeenCalled()
    expect(result).toEqual({ structuredContent: { kind: 'show-symbol' } })
  })

  it('validates deps target and depth', async () => {
    await expect(archDepsToolHandler({}, { rootDir: '/repo' })).rejects.toThrow(
      'arch_deps requires a non-empty target.',
    )

    await expect(
      archDepsToolHandler({ target: 'A.run', depth: 2 }, { rootDir: '/repo' }),
    ).rejects.toThrow('arch_deps currently supports depth=1 only.')
  })

  it('maps deps result with default direction and depth', async () => {
    mockDeps.mockResolvedValue({ callers: [], imports: [] })
    mockMapDepsResult.mockReturnValue({ kind: 'deps' })

    const result = await archDepsToolHandler(
      { target: 'A.run' },
      { rootDir: '/repo' },
    )

    expect(mockDeps).toHaveBeenCalledWith('A.run')
    expect(mockMapDepsResult).toHaveBeenCalledWith({ callers: [], imports: [] }, 'both', 1)
    expect(result).toEqual({ structuredContent: { kind: 'deps' } })
  })
})

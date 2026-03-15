import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCoreEngineAdapter } from '../src/adapters/core-engine-adapter'

const {
  mockCompile,
  mockExecuteHybridRetrieval,
  mockResolveSymbolInput,
  mockExtractSnippetForNode,
  mockReadPersistedNodes,
  mockQueryDependencies,
  mockReadPersistedFilesIndex,
  mockAssignFeaturePattern,
  mockGetFeatureDetails,
} = vi.hoisted(() => ({
  mockCompile: vi.fn(),
  mockExecuteHybridRetrieval: vi.fn(),
  mockResolveSymbolInput: vi.fn(),
  mockExtractSnippetForNode: vi.fn(),
  mockReadPersistedNodes: vi.fn(),
  mockQueryDependencies: vi.fn(),
  mockReadPersistedFilesIndex: vi.fn(),
  mockAssignFeaturePattern: vi.fn(),
  mockGetFeatureDetails: vi.fn(),
}))

vi.mock('@archkit/context', () => ({
  ContextCompiler: vi.fn().mockImplementation(() => ({ compile: mockCompile })),
}))

vi.mock('@archkit/graph', () => ({
  executeHybridRetrieval: mockExecuteHybridRetrieval,
  resolveSymbolInput: mockResolveSymbolInput,
  extractSnippetForNode: mockExtractSnippetForNode,
  readPersistedNodes: mockReadPersistedNodes,
  queryDependencies: mockQueryDependencies,
  readPersistedFilesIndex: mockReadPersistedFilesIndex,
  assignFeaturePattern: mockAssignFeaturePattern,
  getFeatureDetails: mockGetFeatureDetails,
  listFeatureSummaries: vi.fn(),
  listKnowledgeEntries: vi.fn(),
  searchKnowledgeEntries: vi.fn(),
  getKnowledgeEntry: vi.fn(),
  addKnowledgeEntry: vi.fn(),
}))

describe('core-engine-adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls context compiler and hybrid retrieval directly', async () => {
    mockCompile.mockResolvedValue({ query: 'auth', resolution: { kind: 'query' }, entrypoints: [], files: [], paths: [], snippets: [] })
    mockExecuteHybridRetrieval.mockResolvedValue({
      query: 'auth',
      mode: 'exact',
      retrievalMetadata: {
        query: 'auth',
        mode: 'exact',
        queryType: 'symbol',
        deterministicConfidence: 1,
        lexicalUsed: false,
        semanticUsed: false,
        reason: [],
      },
      results: [],
    })

    const adapter = createCoreEngineAdapter('/repo')
    await adapter.context('auth', 'exact', true)
    await adapter.query('auth', 'exact')

    expect(mockCompile).toHaveBeenCalledWith('/repo', {
      query: 'auth',
      mode: 'exact',
      limits: true,
    })
    expect(mockExecuteHybridRetrieval).toHaveBeenCalledWith('/repo', 'auth', { mode: 'exact' })
  })

  it('keeps show and deps deterministic', async () => {
    mockReadPersistedNodes.mockResolvedValue([])
    mockResolveSymbolInput.mockResolvedValue({
      input: 'AuthGuard',
      nodes: [
        {
          id: 'class:src/auth/AuthGuard.ts#AuthGuard',
          type: 'class',
          name: 'AuthGuard',
          filePath: 'src/auth/AuthGuard.ts',
          loc: { startLine: 1, endLine: 10 },
        },
      ],
    })
    mockExtractSnippetForNode.mockResolvedValue('class AuthGuard {}')
    mockQueryDependencies.mockResolvedValue({
      input: 'AuthGuard',
      resolvedNodeIds: ['class:src/auth/AuthGuard.ts#AuthGuard'],
      imports: [],
      calls: [],
      callers: [],
    })

    const adapter = createCoreEngineAdapter('/repo')
    const show = await adapter.show('AuthGuard')
    const deps = await adapter.deps('AuthGuard')

    expect(show).toMatchObject({ kind: 'symbol' })
    expect(deps).toMatchObject({ input: 'AuthGuard' })
    expect(mockResolveSymbolInput).toHaveBeenCalledTimes(2)
    expect(mockQueryDependencies).toHaveBeenCalledWith(
      '/repo',
      'AuthGuard',
      expect.any(Array),
    )
  })

  it('validates feature targets against persisted files index', async () => {
    mockReadPersistedFilesIndex.mockResolvedValue(['src/auth/AuthGuard.ts'])
    mockAssignFeaturePattern.mockResolvedValue({ created: false })
    mockGetFeatureDetails.mockResolvedValue({
      feature: 'authentication',
      patterns: ['src/auth/AuthGuard.ts'],
      files: ['src/auth/AuthGuard.ts'],
    })

    const adapter = createCoreEngineAdapter('/repo')
    const result = await adapter.featuresUpsert('authentication', [], ['src/auth/AuthGuard.ts'])

    expect(result).toMatchObject({ status: 'updated', patterns: ['src/auth/AuthGuard.ts'] })
  })
})

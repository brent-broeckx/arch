import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { executeMcpCommand } from '../src/commands/mcp'

const {
  mockCreateMcpServer,
  mockStart,
} = vi.hoisted(() => {
  const start = vi.fn()

  return {
    mockCreateMcpServer: vi.fn().mockImplementation(() => ({ start })),
    mockStart: start,
  }
})

vi.mock('@archkit/mcp', () => ({
  createMcpServer: mockCreateMcpServer,
}))

describe('executeMcpCommand', () => {
  const tempDirs: string[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.INIT_CWD
  })

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map(async (dir) => rm(dir, { recursive: true, force: true })))
  })

  it('starts mcp server using resolved repo path', async () => {
    await executeMcpCommand('.', '/repo')

    expect(mockCreateMcpServer).toHaveBeenCalledWith({ rootDir: '/repo' })
    expect(mockStart).toHaveBeenCalledTimes(1)
  })

  it('auto-detects workspace root when launched from package subdirectory', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'arch-mcp-root-'))
    tempDirs.push(rootDir)

    const packageDir = path.join(rootDir, 'packages', 'arch-cli')
    await mkdir(packageDir, { recursive: true })
    await writeFile(path.join(rootDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n', 'utf-8')

    await executeMcpCommand('.', packageDir)

    expect(mockCreateMcpServer).toHaveBeenCalledWith({ rootDir })
  })

  it('prefers INIT_CWD when available', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'arch-mcp-initcwd-root-'))
    tempDirs.push(rootDir)

    const packageDir = path.join(rootDir, 'packages', 'arch-cli')
    await mkdir(packageDir, { recursive: true })
    await writeFile(path.join(rootDir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n', 'utf-8')

    process.env.INIT_CWD = rootDir

    await executeMcpCommand('.', packageDir)

    expect(mockCreateMcpServer).toHaveBeenCalledWith({ rootDir })
  })
})

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
  })

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map(async (dir) => rm(dir, { recursive: true, force: true })))
  })

  it('starts mcp server using resolved repo path', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'arch-mcp-root-'))
    tempDirs.push(rootDir)

    await mkdir(path.join(rootDir, '.arch'), { recursive: true })

    await executeMcpCommand('.', rootDir)

    expect(mockCreateMcpServer).toHaveBeenCalledWith({ rootDir })
    expect(mockStart).toHaveBeenCalledTimes(1)
  })

  it('throws when repo path does not exist', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'arch-mcp-root-'))
    tempDirs.push(rootDir)

    await expect(executeMcpCommand('./missing', rootDir)).rejects.toThrow(/Repository path not found/)
  })

  it('throws when repo path is empty', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'arch-mcp-root-'))
    tempDirs.push(rootDir)

    await expect(executeMcpCommand('  ', rootDir)).rejects.toThrow(/Repository path is required/)
  })

  it('warns when .arch directory is missing', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'arch-mcp-initcwd-root-'))
    tempDirs.push(rootDir)

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await writeFile(path.join(rootDir, 'package.json'), '{}', 'utf-8')
    await executeMcpCommand('.', rootDir)

    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createTempDir, removeTempDir } from '../../test-utils/temp-dir'
import { archFeaturesToolHandler } from '../src/tools/featuresTool'
import { archKnowledgeToolHandler } from '../src/tools/knowledgeTool'

describe('mcp tools persistence', () => {
  const tempDirs: string[] = []

  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => removeTempDir(dir)))
  })

  it('upserts and retrieves feature mappings', async () => {
    const rootDir = await createTempDir('mcp-features')
    tempDirs.push(rootDir)

    await mkdir(path.join(rootDir, '.arch', 'index'), { recursive: true })
    await writeFile(
      path.join(rootDir, '.arch', 'index', 'files.json'),
      `${JSON.stringify(['src/auth/AuthGuard.ts', 'src/auth/LoginController.ts'], null, 2)}\n`,
      'utf-8',
    )

    const upsert = await archFeaturesToolHandler(
      {
        action: 'upsert',
        feature: 'authentication',
        targets: ['src/auth/AuthGuard.ts', 'src/auth/LoginController.ts'],
      },
      { rootDir },
    )

    expect(upsert.structuredContent).toMatchObject({
      action: 'upsert',
      feature: 'authentication',
      status: 'created',
    })

    const get = await archFeaturesToolHandler(
      {
        action: 'get',
        feature: 'authentication',
      },
      { rootDir },
    )

    expect(get.structuredContent).toMatchObject({
      action: 'get',
      feature: 'authentication',
      targets: ['src/auth/AuthGuard.ts', 'src/auth/LoginController.ts'],
    })

    const config = await readFile(path.join(rootDir, '.arch', 'features.json'), 'utf-8')
    expect(config).toContain('authentication')
  })

  it('adds and retrieves project knowledge entries', async () => {
    const rootDir = await createTempDir('mcp-knowledge')
    tempDirs.push(rootDir)

    const added = await archKnowledgeToolHandler(
      {
        action: 'add',
        title: 'Authentication validation moved to AuthGuard',
        content: 'Moved token validation out of LoginController into AuthGuard.',
        tags: ['authentication', 'refactor'],
        links: {
          files: ['src/auth/AuthGuard.ts', 'src/auth/LoginController.ts'],
          features: ['authentication'],
        },
      },
      { rootDir },
    )

    const entry = added.structuredContent.entry as { id: string }

    const fetched = await archKnowledgeToolHandler(
      {
        action: 'get',
        id: entry.id,
      },
      { rootDir },
    )

    expect(fetched.structuredContent).toMatchObject({
      action: 'get',
      entry: {
        id: entry.id,
      },
    })

    const searched = await archKnowledgeToolHandler(
      {
        action: 'search',
        query: 'validation',
      },
      { rootDir },
    )

    expect((searched.structuredContent.results as unknown[]).length).toBeGreaterThan(0)

    const recent = await archKnowledgeToolHandler(
      {
        action: 'recent',
        limit: 5,
      },
      { rootDir },
    )

    expect((recent.structuredContent.results as unknown[]).length).toBeGreaterThan(0)
  })
})

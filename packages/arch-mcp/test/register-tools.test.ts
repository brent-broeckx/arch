import { describe, expect, it } from 'vitest'
import { registerTools } from '../src/server/registerTools'

describe('registerTools', () => {
  it('registers required MCP tools', () => {
    const registry = registerTools()

    expect(registry.definitions.map((tool) => tool.name)).toEqual([
      'arch_context',
      'arch_query',
      'arch_show',
      'arch_deps',
      'arch_features',
      'arch_knowledge',
    ])

    expect(Object.keys(registry.handlers).sort((left, right) => left.localeCompare(right))).toEqual([
      'arch_context',
      'arch_deps',
      'arch_features',
      'arch_knowledge',
      'arch_query',
      'arch_show',
    ])
  })
})

import type { McpToolHandler, McpToolResult } from '../models/mcp-types'
import type { ArchFeaturesInput } from '../contracts/toolTypes'
import { ArchMcpError } from '../utils/errors'
import { createCoreEngineAdapter } from '../adapters/core-engine-adapter'

export const archFeaturesToolHandler: McpToolHandler = async (
  args,
  context,
): Promise<McpToolResult> => {
  const input = args as unknown as ArchFeaturesInput
  const action = input.action
  const adapter = createCoreEngineAdapter(context.rootDir)

  if (!action) {
    throw new ArchMcpError('INVALID_INPUT', 'arch_features requires an action.')
  }

  if (action === 'list') {
    const features = await adapter.featuresList()
    return {
      structuredContent: {
        action,
        features,
      },
    }
  }

  const feature = input.feature?.trim()
  if (!feature) {
    throw new ArchMcpError('INVALID_INPUT', `arch_features action ${action} requires a feature.`)
  }

  if (action === 'get') {
    const result = await adapter.featuresGet(feature)
    if (!result) {
      throw new ArchMcpError('FEATURE_NOT_FOUND', `No configured feature found for: ${feature}`)
    }

    return {
      structuredContent: {
        action,
        feature: result.feature,
        patterns: result.patterns,
        targets: result.files,
      },
    }
  }

  if (action === 'list_targets') {
    const result = await adapter.featuresGet(feature)
    if (!result) {
      throw new ArchMcpError('FEATURE_NOT_FOUND', `No configured feature found for: ${feature}`)
    }

    return {
      structuredContent: {
        action,
        feature: result.feature,
        targets: result.files,
      },
    }
  }

  if (action === 'upsert') {
    const aliases = normalizeStringArray(input.aliases)
    const targets = normalizeStringArray(input.targets)
    const result = await adapter.featuresUpsert(feature, aliases, targets)

    return {
      structuredContent: {
        action,
        feature,
        aliases: result.aliases,
        targets: result.patterns,
        status: result.status,
        warnings:
          aliases.length > 0
            ? ['aliases are accepted but not persisted in current feature mapping storage model']
            : [],
      },
    }
  }

  throw new ArchMcpError('INVALID_INPUT', `Unknown arch_features action: ${action}`)
}

function normalizeStringArray(values: string[] | undefined): string[] {
  if (!values) {
    return []
  }

  return values.map((value) => value.trim()).filter((value) => value.length > 0)
}

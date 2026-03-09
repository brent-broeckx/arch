import type { StatsCommandResult } from '../models/command-results'
import type { OutputMode } from '../models/output-mode'

export function formatStatsResult(result: StatsCommandResult, mode: OutputMode): string {
  if (mode === 'json') {
    return JSON.stringify(
      {
        files: result.meta.files,
        symbols: result.meta.symbols,
        edges: result.meta.edges,
        nodeTypeCounts: result.meta.nodeTypeCounts,
      },
      null,
      2,
    )
  }

  return [
    'Repository Architecture',
    '',
    `Files: ${result.meta.files}`,
    `Symbols: ${result.meta.symbols}`,
    `Edges: ${result.meta.edges}`,
    '',
    'Symbol Types',
    `  classes: ${result.meta.nodeTypeCounts.class}`,
    `  methods: ${result.meta.nodeTypeCounts.method}`,
    `  functions: ${result.meta.nodeTypeCounts.function}`,
    `  interfaces: ${result.meta.nodeTypeCounts.interface}`,
    `  types: ${result.meta.nodeTypeCounts.type}`,
    `  routes: ${result.meta.nodeTypeCounts.route}`,
  ].join('\n')
}

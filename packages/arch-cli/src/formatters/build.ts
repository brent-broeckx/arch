import type { BuildCommandResult } from '../models/command-results'
import type { OutputMode } from '../models/output-mode'

export function formatBuildResult(result: BuildCommandResult, mode: OutputMode): string {
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
    'Scanning repository...',
    '',
    `Files scanned: ${result.meta.files}`,
    `Symbols extracted: ${result.meta.symbols}`,
    `Edges created: ${result.meta.edges}`,
    '',
    'Graph saved to .arch/graph',
  ].join('\n')
}

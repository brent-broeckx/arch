import type { DepsCommandResult } from '../models/command-results'
import type { OutputMode } from '../models/output-mode'

export function formatDepsResult(result: DepsCommandResult, mode: OutputMode): string {
  if (mode === 'json') {
    return JSON.stringify(result, null, 2)
  }

  if (mode === 'llm') {
    return [
      `# Dependencies: ${result.input}`,
      '',
      '## Imports',
      ...toBulleted(result.imports),
      '',
      '## Calls',
      ...toBulleted(result.calls),
      '',
      '## Callers',
      ...toBulleted(result.callers),
    ].join('\n')
  }

  return [
    `arch deps ${result.input}`,
    '',
    'Imports',
    ...toIndented(result.imports),
    '',
    'Calls',
    ...toIndented(result.calls),
    '',
    'Callers',
    ...toIndented(result.callers),
  ].join('\n')
}

function toIndented(values: string[]): string[] {
  if (values.length === 0) {
    return ['  (none)']
  }

  return values.map((value) => `  ${value}`)
}

function toBulleted(values: string[]): string[] {
  if (values.length === 0) {
    return ['- none']
  }

  return values.map((value) => `- ${value}`)
}

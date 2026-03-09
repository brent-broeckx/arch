import type { QueryCommandResult } from '../models/command-results'
import type { OutputMode } from '../models/output-mode'

export function formatQueryResult(result: QueryCommandResult, mode: OutputMode): string {
  if (mode === 'json') {
    return JSON.stringify(result, null, 2)
  }

  if (mode === 'llm') {
    const lines = [`# Query: ${result.term}`, '', '## Matches']

    if (result.matches.length === 0) {
      lines.push('- none')
      return lines.join('\n')
    }

    result.matches.forEach((match) => {
      lines.push(`- ${match.type}: ${match.name} (${match.file})`)
    })

    return lines.join('\n')
  }

  const groups = new Map<string, Array<{ name: string; file: string; nodeId: string }>>()
  result.matches.forEach((match) => {
    const existing = groups.get(match.type)
    if (existing) {
      existing.push({ name: match.name, file: match.file, nodeId: match.nodeId })
    } else {
      groups.set(match.type, [{ name: match.name, file: match.file, nodeId: match.nodeId }])
    }
  })

  const lines = [`arch query ${result.term}`, '']
  if (result.matches.length === 0) {
    lines.push('No matches found.')
    return lines.join('\n')
  }

  lines.push('Matches', '')
  ;['class', 'method', 'function', 'interface', 'type', 'route', 'file'].forEach((typeName) => {
    const group = groups.get(typeName)
    if (!group || group.length === 0) {
      return
    }

    lines.push(typeName)
    group
      .slice()
      .sort((left, right) => left.nodeId.localeCompare(right.nodeId))
      .forEach((item) => {
        lines.push(`  ${item.name} (${item.file})`)
      })
    lines.push('')
  })

  return lines.join('\n').trimEnd()
}

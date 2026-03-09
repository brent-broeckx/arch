import { queryDependencies, resolveSymbolInput } from '@arch/graph'
import { printDepsOutput, printShowAmbiguousOutput, printShowNoMatchOutput } from '../utils/output'

export async function runDepsCommand(symbol: string | undefined): Promise<void> {
  const symbolInput = symbol?.trim()

  if (!symbolInput) {
    console.error('Provide a symbol. Usage: `arch deps <symbol>`.')
    process.exitCode = 1
    return
  }

  try {
    const resolved = await resolveSymbolInput(process.cwd(), symbolInput)

    if (resolved.nodes.length === 0) {
      printShowNoMatchOutput(symbolInput)
      process.exitCode = 1
      return
    }

    if (resolved.nodes.length > 1) {
      printShowAmbiguousOutput(symbolInput, resolved.nodes)
      process.exitCode = 1
      return
    }

    const depsResult = await queryDependencies(process.cwd(), symbolInput, resolved.nodes)
    printDepsOutput(depsResult)
  } catch {
    console.error('No graph data found. Run `arch build` first.')
    process.exitCode = 1
  }
}

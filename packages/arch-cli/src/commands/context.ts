import { ContextCompiler } from '@arch/context'
import { printContextOutput } from '../utils/output'

export async function runContextCommand(query: string | undefined): Promise<void> {
  const queryInput = query?.trim()

  if (!queryInput) {
    console.error('Provide a query. Usage: `arch context <query>`.')
    process.exitCode = 1
    return
  }

  try {
    const compiler = new ContextCompiler()
    const bundle = await compiler.compile(process.cwd(), { query: queryInput })
    printContextOutput(bundle)
  } catch {
    console.error('No graph data found. Run `arch build` first.')
    process.exitCode = 1
  }
}

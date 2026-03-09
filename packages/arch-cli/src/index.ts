#!/usr/bin/env node
import { Command } from 'commander'

const program = new Command()

program
  .name('arch')
  .description('Arch CLI')
  .version('0.1.0')
  .action(() => {
    console.log('Arch CLI')
    console.log('')
    console.log('Commands available:')
    console.log('* build')
    console.log('* stats')
    console.log('* query')
    console.log('* deps')
    console.log('* show')
    console.log('* context')
  })

program
  .command('build')
  .description('Build the architecture graph')
  .action(() => {
    console.log('arch build (scaffold)')
  })

program
  .command('stats')
  .description('Display architecture statistics')
  .action(() => {
    console.log('arch stats (scaffold)')
  })

program
  .command('query')
  .description('Search for symbols')
  .argument('[term]', 'Symbol query term')
  .action((term: string | undefined) => {
    console.log(`arch query (scaffold): ${term ?? ''}`.trim())
  })

program
  .command('deps')
  .description('Show dependencies for a symbol')
  .argument('[symbol]', 'Symbol name')
  .action((symbol: string | undefined) => {
    console.log(`arch deps (scaffold): ${symbol ?? ''}`.trim())
  })

program
  .command('show')
  .description('Display a symbol snippet')
  .argument('[symbol]', 'Symbol name')
  .action((symbol: string | undefined) => {
    console.log(`arch show (scaffold): ${symbol ?? ''}`.trim())
  })

program
  .command('context')
  .description('Compile context for a feature or symbol')
  .argument('[query]', 'Context query')
  .action((query: string | undefined) => {
    console.log(`arch context (scaffold): ${query ?? ''}`.trim())
  })

program.parseAsync(process.argv)

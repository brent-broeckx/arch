export interface ContextSnippet {
  file: string
  symbol: string
  startLine: number
  endLine: number
}

export interface ContextBundle {
  query: string
  entrypoints: string[]
  files: string[]
  paths: string[][]
  snippets: ContextSnippet[]
}

export interface CompileContextOptions {
  query: string
}

export class ContextCompiler {
  public compile(options: CompileContextOptions): ContextBundle {
    return {
      query: options.query,
      entrypoints: [],
      files: [],
      paths: [],
      snippets: [],
    }
  }
}

export type OutputMode = 'human' | 'json' | 'llm'

export interface OutputOptions {
  json?: boolean
  format?: string
}

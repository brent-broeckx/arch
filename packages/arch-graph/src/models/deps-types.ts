export interface DepsResult {
  input: string
  resolvedNodeIds: string[]
  imports: string[]
  calls: string[]
  callers: string[]
}

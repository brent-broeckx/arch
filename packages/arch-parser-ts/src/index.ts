import { Project } from 'ts-morph'
import type { GraphData } from '@arch/core'

export interface ParseRepositoryOptions {
  rootDir: string
  tsConfigFilePath?: string
}

export class TypeScriptParser {
  private readonly project: Project

  public constructor(tsConfigFilePath?: string) {
    this.project = tsConfigFilePath
      ? new Project({ tsConfigFilePath })
      : new Project({
          skipAddingFilesFromTsConfig: true,
        })
  }

  public parseRepository(_options: ParseRepositoryOptions): GraphData {
    return {
      nodes: [],
      edges: [],
    }
  }

  public getProject(): Project {
    return this.project
  }
}

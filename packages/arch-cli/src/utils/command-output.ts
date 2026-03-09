import type { OutputMode, OutputOptions } from '../models/output-mode'

export class CliCommandError extends Error {
  public readonly code: string
  public readonly details?: unknown

  public constructor(code: string, message: string, details?: unknown) {
    super(message)
    this.code = code
    this.details = details
  }
}

export function resolveOutputMode(
  options: OutputOptions,
  supportsLlm: boolean,
): OutputMode {
  if (options.json) {
    return 'json'
  }

  const requestedFormat = (options.format ?? 'human').toLocaleLowerCase()
  if (requestedFormat === 'human') {
    return 'human'
  }

  if (requestedFormat === 'llm') {
    if (!supportsLlm) {
      throw new CliCommandError(
        'FORMAT_NOT_SUPPORTED',
        'LLM format is not supported for this command.',
      )
    }

    return 'llm'
  }

  throw new CliCommandError(
    'INVALID_FORMAT',
    'Invalid format. Supported values: human, llm.',
  )
}

export function writeFormattedOutput(output: string): void {
  console.log(output)
}

export function handleCommandError(error: unknown, options: OutputOptions): void {
  const cliError = toCliCommandError(error)

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          error: {
            code: cliError.code,
            message: cliError.message,
          },
        },
        null,
        2,
      ),
    )
  } else {
    console.error(cliError.message)
  }

  process.exitCode = 1
}

function toCliCommandError(error: unknown): CliCommandError {
  if (error instanceof CliCommandError) {
    return error
  }

  if (error instanceof Error) {
    return new CliCommandError('COMMAND_FAILED', error.message)
  }

  return new CliCommandError('COMMAND_FAILED', 'Command failed.')
}

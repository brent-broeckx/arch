import { spawn } from 'node:child_process'

const child = spawn('pnpm -r --filter ./packages/* build', {
  stdio: 'inherit',
  shell: true,
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})

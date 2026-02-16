import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
copyFileSync(path.join(root, 'README.md'), path.join(root, 'dist', 'README.md'))

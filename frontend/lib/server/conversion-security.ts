import { readdir, stat, unlink } from 'fs/promises'
import { basename, extname, isAbsolute, join, relative, resolve } from 'path'

const DEFAULT_MAX_FILES = 20
const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const DEFAULT_MAX_TOTAL_SIZE_BYTES = 50 * 1024 * 1024
const DEFAULT_GENERATED_PDF_TTL_HOURS = 24

const MARKDOWN_EXTENSIONS = new Set(['.md', '.markdown', '.mdown'])

export class RequestValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RequestValidationError'
  }
}

export type PreparedUpload = {
  fileName: string
  buffer: Buffer
}

export function parseJsonObject(value: FormDataEntryValue | null, label: string): Record<string, unknown> {
  if (typeof value !== 'string') {
    throw new RequestValidationError(`${label} must be provided`)
  }

  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new RequestValidationError(`${label} must be a JSON object`)
    }
    return parsed as Record<string, unknown>
  } catch (error) {
    if (error instanceof RequestValidationError) {
      throw error
    }
    throw new RequestValidationError(`${label} contains invalid JSON`)
  }
}

export async function prepareUploadedMarkdownFiles(entries: FormDataEntryValue[]): Promise<PreparedUpload[]> {
  const files = entries.filter((entry): entry is File => entry instanceof File)
  if (files.length !== entries.length) {
    throw new RequestValidationError('Only file uploads are accepted')
  }
  if (files.length === 0) {
    throw new RequestValidationError('No files provided')
  }

  const maxFiles = positiveIntegerFromEnv('MAX_CONVERSION_FILES', DEFAULT_MAX_FILES)
  if (files.length > maxFiles) {
    throw new RequestValidationError(`A maximum of ${maxFiles} files can be converted at once`)
  }

  const maxFileSize = positiveIntegerFromEnv('MAX_CONVERSION_FILE_BYTES', DEFAULT_MAX_FILE_SIZE_BYTES)
  const maxTotalSize = positiveIntegerFromEnv('MAX_CONVERSION_TOTAL_BYTES', DEFAULT_MAX_TOTAL_SIZE_BYTES)
  const seenNames = new Set<string>()
  let totalSize = 0

  const prepared: PreparedUpload[] = []
  for (const [index, file] of files.entries()) {
    if (file.size > maxFileSize) {
      throw new RequestValidationError(`${file.name || `File ${index + 1}`} exceeds the ${formatBytes(maxFileSize)} limit`)
    }

    totalSize += file.size
    if (totalSize > maxTotalSize) {
      throw new RequestValidationError(`Uploads exceed the ${formatBytes(maxTotalSize)} total limit`)
    }

    const fileName = uniqueFileName(sanitizeMarkdownFileName(file.name, index), seenNames)
    const buffer = Buffer.from(await file.arrayBuffer())
    prepared.push({ fileName, buffer })
  }

  return prepared
}

export function sanitizePdfFileName(value: unknown, fallback = 'output.pdf'): string {
  const safeName = sanitizeBaseName(value, fallback)
  const stem = safeName.replace(/\.pdf$/i, '').replace(/\.[^.]+$/, '') || 'output'
  return `${stem.slice(0, 112)}.pdf`
}

export function contentDispositionAttachment(fileName: string): string {
  const safeName = sanitizePdfFileName(fileName)
  const quotedName = safeName.replace(/["\\\r\n]/g, '_')
  return `attachment; filename="${quotedName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`
}

export function safeResolve(baseDir: string, childPath: string): string {
  const base = resolve(baseDir)
  const target = resolve(base, childPath)
  const relativePath = relative(base, target)

  if (relativePath && (relativePath.startsWith('..') || isAbsolute(relativePath))) {
    throw new RequestValidationError('Requested file path is outside the conversion workspace')
  }

  return target
}

export function stringValue(value: unknown, fallback: string, maxLength = 200): string {
  if (typeof value !== 'string') {
    return fallback
  }

  const normalized = value.replace(/\0/g, '').trim()
  return normalized ? normalized.slice(0, maxLength) : fallback
}

export function optionalStringValue(value: unknown, maxLength = 200): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.replace(/\0/g, '').trim()
  return normalized ? normalized.slice(0, maxLength) : undefined
}

export function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export function integerValue(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    return fallback
  }

  return Math.min(Math.max(value, min), max)
}

export function stringArrayValue(value: unknown, maxItems = 20, maxLength = 80): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.replace(/\0/g, '').trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export async function cleanupStoredPdfs(storagePath: string): Promise<void> {
  const ttlHours = positiveIntegerFromEnv('GENERATED_PDF_TTL_HOURS', DEFAULT_GENERATED_PDF_TTL_HOURS)
  const cutoff = Date.now() - ttlHours * 60 * 60 * 1000

  try {
    const entries = await readdir(storagePath)
    await Promise.all(entries.map(async (entry) => {
      if (!entry.endsWith('.pdf')) {
        return
      }

      try {
        const pdfPath = join(storagePath, entry)
        const fileStat = await stat(pdfPath)
        if (fileStat.mtimeMs < cutoff) {
          await unlink(pdfPath)
        }
      } catch (error) {
        if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) {
          throw error
        }
      }
    }))
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return
    }

    throw error
  }
}

function sanitizeMarkdownFileName(value: unknown, index: number): string {
  const safeName = sanitizeBaseName(value, `document-${index + 1}.md`)
  const extension = extname(safeName).toLowerCase()

  if (!MARKDOWN_EXTENSIONS.has(extension)) {
    throw new RequestValidationError(`${safeName} is not a supported Markdown file`)
  }

  return safeName
}

function sanitizeBaseName(value: unknown, fallback: string): string {
  const raw = stringValue(value, fallback, 180)
  const safeName = basename(raw)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^\.+$/, '')
    .slice(0, 120)

  return safeName || fallback
}

function uniqueFileName(fileName: string, seenNames: Set<string>): string {
  if (!seenNames.has(fileName)) {
    seenNames.add(fileName)
    return fileName
  }

  const extension = extname(fileName)
  const stem = extension ? fileName.slice(0, -extension.length) : fileName
  let counter = 2
  let candidate = `${stem}-${counter}${extension}`

  while (seenNames.has(candidate)) {
    counter += 1
    candidate = `${stem}-${counter}${extension}`
  }

  seenNames.add(candidate)
  return candidate
}

function positiveIntegerFromEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] || '', 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function formatBytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`
}

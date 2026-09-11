import { createHash } from 'node:crypto';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function nowIso() {
  return new Date().toISOString();
}

export function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function safeFilename(value) {
  return String(value)
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180) || 'record';
}

export async function atomicWriteJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temp = `${filePath}.tmp-${process.pid}`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temp, filePath);
}

export async function persistRaw(runDir, relativePath, body) {
  const absolute = path.join(runDir, relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, body, 'utf8');
  return {
    path: relativePath.replaceAll('\\', '/'),
    sha256: sha256(body),
    bytes: Buffer.byteLength(body),
  };
}

export function sanitizeSnapshot(value, depth = 0) {
  if (depth > 20 || value == null) return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeSnapshot(item, depth + 1));
  if (typeof value !== 'object') return value;
  const denied = /(token|secret|password|authorization|cookie|api[_-]?key|access[_-]?token)/i;
  return Object.fromEntries(Object.entries(value).map(([key, child]) => [
    key,
    denied.test(key) ? '[REDACTED]' : sanitizeSnapshot(child, depth + 1),
  ]));
}

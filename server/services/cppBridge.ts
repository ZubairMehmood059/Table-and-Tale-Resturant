import { execFileSync, spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { executeNodeEngine } from './nodeEngine.ts';

const ROOT_DIR = process.cwd();
const CPP_DIR = path.join(ROOT_DIR, 'cpp');
const IS_WIN = process.platform === 'win32';
const ENGINE_BIN = path.join(
  CPP_DIR,
  'bin',
  IS_WIN ? 'table_tale_engine.exe' : 'table_tale_engine'
);
const ENGINE_SRC = path.join(CPP_DIR, 'src', 'engine.cpp');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DEFAULT_DATA_FILE = path.join(DATA_DIR, 'tabletale_data.txt');

export function resolveDataFilePath(requestedFile?: string): string {
  if (requestedFile) return requestedFile;
  if (process.env.TABLETALE_DATA_FILE) return process.env.TABLETALE_DATA_FILE;

  const localFile = DEFAULT_DATA_FILE;
  const localBak = path.join(DATA_DIR, 'tabletale_data.txt.bak');

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.accessSync(DATA_DIR, fs.constants.W_OK);
    if (!fs.existsSync(localFile) && fs.existsSync(localBak)) {
      try {
        fs.copyFileSync(localBak, localFile);
      } catch {
        // ignore
      }
    }
    return localFile;
  } catch {
    const tmpDir = path.join(os.tmpdir(), 'tabletale_data');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      const tmpFile = path.join(tmpDir, 'tabletale_data.txt');
      if (!fs.existsSync(tmpFile)) {
        if (fs.existsSync(localFile)) {
          fs.copyFileSync(localFile, tmpFile);
        } else if (fs.existsSync(localBak)) {
          fs.copyFileSync(localBak, tmpFile);
        }
      }
      return tmpFile;
    } catch {
      return localFile;
    }
  }
}

let buildChecked = false;
let nativeAvailable = false;
let queue: Promise<unknown> = Promise.resolve();

export function ensureDataDirectory(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Read-only filesystem (e.g. AWS Lambda / Netlify)
  }
}

export function ensureCppEngineBuilt(): void {
  if (buildChecked) {
    return;
  }

  ensureDataDirectory();

  try {
    const binDir = path.dirname(ENGINE_BIN);
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    execFileSync('g++', ['--version'], { stdio: 'ignore' });
    const needsBuild =
      !fs.existsSync(ENGINE_BIN) ||
      (fs.existsSync(ENGINE_SRC) &&
        fs.statSync(ENGINE_SRC).mtimeMs > fs.statSync(ENGINE_BIN).mtimeMs);

    if (needsBuild) {
      execFileSync(
        'g++',
        ['-std=c++17', '-O2', '-Wall', '-Wextra', ENGINE_SRC, '-o', ENGINE_BIN],
        { cwd: CPP_DIR, stdio: 'pipe' }
      );
    }
    nativeAvailable = fs.existsSync(ENGINE_BIN);
  } catch {
    // g++ compiler unavailable on host (e.g. Windows without MinGW or Netlify/cloud build).
    // Gracefully active built-in Node.js engine fallback.
    nativeAvailable = false;
  }

  buildChecked = true;
}

export interface CppPayload {
  action: string;
  dataFile?: string;
  [key: string]: unknown;
}

export function invokeCppEngine<T = Record<string, unknown>>(payload: CppPayload): Promise<T> {
  const run = async (): Promise<T> => {
    ensureCppEngineBuilt();

    const dataFile = resolveDataFilePath(payload.dataFile);
    const resolvedPayload = {
      ...payload,
      dataFile,
    };
    const requestBody = JSON.stringify(resolvedPayload);

    if (nativeAvailable && fs.existsSync(ENGINE_BIN)) {
      try {
        return await new Promise<T>((resolve, reject) => {
          const child = spawn(ENGINE_BIN, [], {
            cwd: ROOT_DIR,
            stdio: ['pipe', 'pipe', 'pipe'],
          });

          let stdout = '';
          let stderr = '';

          child.stdout.on('data', (chunk: Buffer) => {
            stdout += chunk.toString('utf8');
          });

          child.stderr.on('data', (chunk: Buffer) => {
            stderr += chunk.toString('utf8');
          });

          child.on('error', (err) => {
            reject(new Error(`Failed to start C++ engine: ${err.message}`));
          });

          child.on('close', () => {
            const trimmed = stdout.trim();
            if (!trimmed) {
              reject(new Error(`Empty output from C++ engine. ${stderr}`.trim()));
              return;
            }
            try {
              const parsed = JSON.parse(trimmed) as T;
              resolve(parsed);
            } catch (parseErr) {
              reject(
                new Error(
                  `Invalid JSON from C++ engine: ${(parseErr as Error).message}. Raw: ${trimmed}`
                )
              );
            }
          });

          child.stdin.write(requestBody);
          child.stdin.end();
        });
      } catch {
        // In case of execution mismatch (e.g. ELF binary on Windows), fallback to nodeEngine
        return executeNodeEngine(resolvedPayload) as T;
      }
    }

    return executeNodeEngine(resolvedPayload) as T;
  };

  const task = queue.then(run, run);
  queue = task.then(
    () => undefined,
    () => undefined
  );
  return task;
}

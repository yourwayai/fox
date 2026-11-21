import { isTauri, convertFileSrc } from '@tauri-apps/api/core';

export function isTauriApp(): boolean {
  try {
    return isTauri();
  } catch {
    return false;
  }
}

export const FOX_KEYCHAIN_SERVICE = 'ai.yourway.fox';
export const KEYCHAIN_PLACEHOLDER = '[KEYCHAIN_SECURED]';

/**
 * Check if OS Keychain / Credential Manager is available in current environment
 */
export async function isKeychainSupported(): Promise<boolean> {
  if (!isTauriApp()) return false;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<boolean>('is_keychain_available');
  } catch (err) {
    console.warn('[tauriBridge] isKeychainSupported check failed:', err);
    return false;
  }
}

/**
 * Save secret credential into OS Keychain / Credential Manager
 */
export async function saveSecureCredential(key: string, value: string): Promise<boolean> {
  if (!isTauriApp() || !key) return false;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('save_credential', {
      service: FOX_KEYCHAIN_SERVICE,
      key,
      value,
    });
    return true;
  } catch (err) {
    console.error(`[tauriBridge] Failed to save credential for key "${key}":`, err);
    return false;
  }
}

/**
 * Get secret credential from OS Keychain / Credential Manager
 */
export async function getSecureCredential(key: string): Promise<string | null> {
  if (!isTauriApp() || !key) return null;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const cred = await invoke<string | null>('get_credential', {
      service: FOX_KEYCHAIN_SERVICE,
      key,
    });
    return cred;
  } catch (err) {
    console.error(`[tauriBridge] Failed to get credential for key "${key}":`, err);
    return null;
  }
}

/**
 * Delete secret credential from OS Keychain / Credential Manager
 */
export async function deleteSecureCredential(key: string): Promise<boolean> {
  if (!isTauriApp() || !key) return false;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('delete_credential', {
      service: FOX_KEYCHAIN_SERVICE,
      key,
    });
    return true;
  } catch (err) {
    console.error(`[tauriBridge] Failed to delete credential for key "${key}":`, err);
    return false;
  }
}


/**
 * Open native system file picker to select a Markdown file
 */
export async function openMarkdownFileNative(): Promise<{ path: string; name: string; content: string } | null> {
  if (!isTauriApp()) return null;

  try {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const { readTextFile } = await import('@tauri-apps/plugin-fs');

    const selected = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: 'Markdown',
          extensions: ['md', 'markdown', 'mdown', 'mkdn', 'txt'],
        },
      ],
    });

    if (!selected || typeof selected !== 'string') {
      return null;
    }

    const content = await readTextFile(selected);
    const fileName = selected.split(/[/\\]/).pop() || 'Untitled.md';

    return {
      path: selected,
      name: fileName,
      content,
    };
  } catch (err) {
    console.error('[tauriBridge] Failed to open native markdown file:', err);
    return null;
  }
}

/**
 * Read markdown file from an absolute disk path directly (e.g. drag & drop or recent list)
 */
export async function readMarkdownFileFromPath(filePath: string): Promise<{ path: string; name: string; content: string } | null> {
  if (!isTauriApp()) return null;

  try {
    const { readTextFile } = await import('@tauri-apps/plugin-fs');
    const content = await readTextFile(filePath);
    const fileName = filePath.split(/[/\\]/).pop() || 'Untitled.md';

    return {
      path: filePath,
      name: fileName,
      content,
    };
  } catch (err) {
    console.error(`[tauriBridge] Failed to read file from path "${filePath}":`, err);
    return null;
  }
}

/**
 * Open external URL safely in default system browser
 */
export async function openExternal(url: string): Promise<void> {
  if (isTauriApp()) {
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(url);
      return;
    } catch (err) {
      console.warn('[tauriBridge] plugin-opener failed, falling back to window.open:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

/**
 * Resolve relative markdown image links to Tauri asset protocol URL or pass through web URLs.
 * Resolves paths like './images/pic.png' or '../assets/pic.png' against the doc's disk folder.
 */
export function resolveMarkdownImageSrc(src: string, docPath?: string): string {
  if (!src) return '';

  // Remote, data, or blob URLs are left intact
  if (/^(https?:\/\/|data:|blob:)/i.test(src)) {
    return src;
  }

  if (isTauriApp() && docPath) {
    try {
      // Find the folder of the document
      const lastSlash = Math.max(docPath.lastIndexOf('/'), docPath.lastIndexOf('\\'));
      const docDir = lastSlash >= 0 ? docPath.substring(0, lastSlash) : '';

      if (docDir) {
        // Resolve relative path segments
        const fullPath = normalizePath(`${docDir}/${src}`);
        return convertFileSrc(fullPath);
      }
    } catch (err) {
      console.warn('[tauriBridge] Failed to convert local file image:', err);
    }
  }

  return src;
}

function normalizePath(rawPath: string): string {
  const isWindows = rawPath.includes(':\\');
  const separator = isWindows ? '\\' : '/';
  const parts = rawPath.replace(/\\/g, '/').split('/');
  const stack: string[] = [];

  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0 && stack[stack.length - 1] !== '..') {
        stack.pop();
      } else {
        stack.push('..');
      }
    } else {
      stack.push(part);
    }
  }

  const prefix = rawPath.startsWith('/') ? '/' : '';
  return prefix + stack.join(separator);
}

/**
 * Native HTTP fetch bypassing browser CORS limitations in Tauri desktop mode.
 */
export async function nativeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (isTauriApp()) {
    try {
      const { fetch: tauriHttpFetch } = await import('@tauri-apps/plugin-http');
      return await tauriHttpFetch(input, init);
    } catch (err) {
      console.warn('[tauriBridge] tauri plugin-http fetch failed, falling back to window.fetch:', err);
    }
  }

  return window.fetch(input, init);
}

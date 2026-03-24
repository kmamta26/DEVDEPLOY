const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Dangerous file extensions that should never appear in an upload
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.msi',
  '.dll', '.so', '.dylib', '.bin', '.com', '.vbs',
  '.wsf', '.jar', '.py', '.rb', '.pl'
];

// Maximum allowed extracted size (200 MB)
const MAX_EXTRACTED_SIZE = 200 * 1024 * 1024;
// Maximum allowed file count
const MAX_FILE_COUNT = 500;

/**
 * Validates a ZIP file for safety before extraction.
 * Returns { valid: boolean, error?: string }
 */
function validateZip(zipPath) {
  try {
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    if (entries.length === 0) {
      return { valid: false, error: 'ZIP file is empty' };
    }

    if (entries.length > MAX_FILE_COUNT) {
      return { valid: false, error: `Too many files (${entries.length}). Max is ${MAX_FILE_COUNT}.` };
    }

    let totalSize = 0;

    for (const entry of entries) {
      const name = entry.entryName;

      // Block path traversal attempts (e.g., ../../etc/passwd)
      if (name.includes('..')) {
        return { valid: false, error: `Path traversal detected in entry: ${name}` };
      }

      // Block dangerous file types
      const ext = path.extname(name).toLowerCase();
      if (BLOCKED_EXTENSIONS.includes(ext)) {
        return { valid: false, error: `Blocked file type detected: ${ext} (${name})` };
      }

      totalSize += entry.header.size;
      if (totalSize > MAX_EXTRACTED_SIZE) {
        return { valid: false, error: `Extracted size exceeds ${MAX_EXTRACTED_SIZE / (1024 * 1024)}MB limit (zip bomb protection)` };
      }
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Invalid ZIP file: ${err.message}` };
  }
}

module.exports = { validateZip };

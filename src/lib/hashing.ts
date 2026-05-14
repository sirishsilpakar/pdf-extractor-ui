/**
 * SHA-256 of first 32 KB + last 32 KB — same as the server side compute_pdf_hash.
 * - file ≤ 64 KB  -> hash entire file
 * - file >  64 KB -> SHA-256(head[0..32KB] || tail[last 32KB])
 */

const HASH_HEAD = 32 * 1024; // 32 KB
const HASH_TAIL = 32 * 1024; // 32 KB
const HASH_BYTES = HASH_HEAD + HASH_TAIL;

export async function hashFile(file: File): Promise<string> {
  let buf: ArrayBuffer;
  
  if (file.size <= HASH_BYTES) {
    // Small file: hash the entire content
    buf = await file.arrayBuffer();
  } else {
    // Large file: concatenate head + tail slices into one 64 KB buffer
    const headBuf = await file.slice(0, HASH_HEAD).arrayBuffer();
    const tailBuf = await file.slice(file.size - HASH_TAIL).arrayBuffer();
    
    const combined = new Uint8Array(HASH_HEAD + HASH_TAIL);
    combined.set(new Uint8Array(headBuf), 0);
    combined.set(new Uint8Array(tailBuf), HASH_HEAD);
    buf = combined.buffer;
  }

  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

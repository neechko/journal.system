export const MAX_MANUSCRIPT_BYTES = 10 * 1024 * 1024;

export function isPdfPayload(content: Uint8Array): boolean {
  return (
    content.length >= 5 &&
    content[0] === 0x25 &&
    content[1] === 0x50 &&
    content[2] === 0x44 &&
    content[3] === 0x46 &&
    content[4] === 0x2d
  );
}

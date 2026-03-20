export interface TextDelta {
  prefix: number;
  deleteCount: number;
  insertText: string;
}

export const getTextDelta = (current: string, next: string): TextDelta => {
  let prefix = 0;
  while (
    prefix < current.length &&
    prefix < next.length &&
    current.charCodeAt(prefix) === next.charCodeAt(prefix)
  ) {
    prefix++;
  }

  let suffix = 0;
  while (
    suffix < current.length - prefix &&
    suffix < next.length - prefix &&
    current.charCodeAt(current.length - 1 - suffix) ===
      next.charCodeAt(next.length - 1 - suffix)
  ) {
    suffix++;
  }

  const deleteCount = current.length - prefix - suffix;
  const insertText = next.slice(prefix, next.length - suffix);
  return { prefix, deleteCount, insertText };
};

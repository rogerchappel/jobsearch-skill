export function normalizeLineEndings(text) {
  return text.replace(/\r\n?|\n/g, '\n');
}

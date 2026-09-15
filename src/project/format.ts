/** "0:04.2". Tenths, so scrubbing reads as movement. */
export function formatTimecode(seconds: number): string {
  'worklet';
  const safe = Math.max(0, seconds);
  const tenthsTotal = Math.floor(safe * 10);
  const minutes = Math.floor(tenthsTotal / 600);
  const secs = Math.floor((tenthsTotal % 600) / 10);
  const tenths = tenthsTotal % 10;
  return `${minutes}:${secs < 10 ? '0' : ''}${secs}.${tenths}`;
}

/** "4.2s", for a clip or text length. */
export function formatLength(seconds: number): string {
  'worklet';
  return `${(Math.round(seconds * 10) / 10).toFixed(1)}s`;
}

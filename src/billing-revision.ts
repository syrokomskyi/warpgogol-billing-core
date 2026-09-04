/*
<MODULE_CONTRACT>
<purpose>Pure monotonic revision allocation logic for billing read model. DNA-41 compliant — no side effects, no I/O.</purpose>
<non-goals><item>Do not persist revisions or interact with storage — that is the adapter's responsibility.</item></non-goals>
</MODULE_CONTRACT>
<CHANGE_SUMMARY><item>RFC-1012: initial pure revision allocation functions.</item></CHANGE_SUMMARY>
*/

export function nextRevision(current: number): number {
  return current + 1;
}

export function isMonotonic(sequence: number[]): boolean {
  if (sequence.length === 0) return true;
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i] <= sequence[i - 1]) return false;
  }
  return true;
}

export function isGapTolerant(sequence: number[]): boolean {
  if (sequence.length === 0) return true;
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i] < sequence[i - 1]) return false;
  }
  return true;
}

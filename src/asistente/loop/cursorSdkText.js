/**
 * Extrae texto assistant del Run / RunResult del Cursor SDK.
 */
export function extraerTextoRunResult(runResult, runHandle) {
  if (runResult?.result?.trim()) {
    return runResult.result.trim();
  }
  if (runHandle?.result?.trim()) {
    return runHandle.result.trim();
  }
  return null;
}

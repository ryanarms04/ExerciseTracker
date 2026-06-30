export function useHaptic() {
  return {
    tick: () => navigator.vibrate?.(10),
    success: () => navigator.vibrate?.([10, 50, 10]),
    error: () => navigator.vibrate?.([50, 30, 50]),
  }
}

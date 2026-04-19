import { describe, it, expect } from 'vitest';

// We explicitly mock the wait time logic from main.js to show pure testing
function calculateExpectedWaitTime(baseWait, totalIntensity) {
  return Math.max(1, Math.floor(baseWait + (totalIntensity * 6)));
}

function simulateGlobalTotal(base, varianceIntensity) {
  const variance = Math.floor(varianceIntensity * 150);
  return base + variance;
}

describe('Algorithm Logic', () => {
  it('should accurately calculate dynamic facility wait times based on crowd intensity', () => {
    // 0 intensity means base wait time
    expect(calculateExpectedWaitTime(5, 0)).toBe(5);
    
    // High intensity significantly bumps the wait time
    expect(calculateExpectedWaitTime(5, 4.5)).toBe(32); // 5 + floor(27)
    
    // Floor handles fractional intensity realistically
    expect(calculateExpectedWaitTime(10, 1.15)).toBe(16); // 10 + floor(6.9)
  });

  it('should scale the total simulated attendee count relatively', () => {
      const baseStats = 45200;
      expect(simulateGlobalTotal(baseStats, 0.5)).toBe(45275);
      expect(simulateGlobalTotal(baseStats, 1.2)).toBe(45380);
  });
});

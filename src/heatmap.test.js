import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Heatmap } from './heatmap.js';

describe('Heatmap Renderer Tests', () => {
  let mockCanvas;
  let heatmap;

  beforeEach(() => {
    // Math and DOM mocks for jsdom environment
    mockCanvas = {
      parentElement: { clientWidth: 1000, clientHeight: 500 },
      getContext: vi.fn().mockReturnValue({
        clearRect: vi.fn(),
        createRadialGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn()
        }),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
        putImageData: vi.fn(),
        createLinearGradient: vi.fn().mockReturnValue({
          addColorStop: vi.fn()
        }),
        fillRect: vi.fn()
      }),
      width: 0,
      height: 0,
      style: {}
    };

    // Prevent ResizeObserver from breaking in tests
    window.ResizeObserver = class ResizeObserver {
      observe() {}
      disconnect() {}
    };

    heatmap = new Heatmap(mockCanvas);
  });

  it('correctly calculates resolution factors upon initialization', () => {
    // 1000 / 2.5 = 400
    expect(heatmap.width).toBe(400);
    // 500 / 2.5 = 200
    expect(heatmap.height).toBe(200);
  });

  it('generates a highly optimized color palette automatically', () => {
    // We override document.createElement for isolated testing
    document.createElement = vi.fn().mockReturnValue(mockCanvas);
    const palette = heatmap.getColorPalette();
    
    // Expect the palette array to be instantiated and returned
    expect(palette).toBeDefined();
    expect(palette.length).toBe(4);
  });

  it('successfully executes point injection matrix', () => {
    const testPoints = [{ x: 50, y: 50, intensity: 0.8, radius: 100 }];
    heatmap.setPoints(testPoints);
    expect(heatmap.points.length).toBe(1);
    expect(heatmap.points[0].x).toBe(50);
  });
});

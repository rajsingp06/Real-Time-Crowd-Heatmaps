import { describe, it, expect, vi } from 'vitest';
import { Heatmap } from '../heatmap.js';

describe('Heatmap Component', () => {
  it('should initialize with an empty point array and a mock canvas', () => {
    // Mock HTMLCanvasElement
    const mockCanvas = {
      getContext: vi.fn(() => ({
        createRadialGradient: vi.fn(() => ({
          addColorStop: vi.fn()
        })),
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
        putImageData: vi.fn(),
        createLinearGradient: vi.fn(() => ({
          addColorStop: vi.fn()
        })),
        fillRect: vi.fn()
      })),
      parentElement: {
        clientWidth: 800,
        clientHeight: 600
      },
      style: {}
    };

    // Attach resize listener mock globally
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener').mockImplementation(() => {});

    const heatmap = new Heatmap(mockCanvas);
    
    expect(heatmap.points).toEqual([]);
    expect(heatmap.resolutionFactor).toBe(2.5);
    expect(heatmap.width).toBe(Math.floor(800 / 2.5));
    expect(heatmap.height).toBe(Math.floor(600 / 2.5));

    addEventListenerSpy.mockRestore();
  });

  it('should correctly store points when setPoints is called', () => {
    const mockCanvas = {
      getContext: vi.fn(() => ({
         clearRect: vi.fn(),
         getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
         putImageData: vi.fn(),
         createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
         fillRect: vi.fn()
      })),
      parentElement: { clientWidth: 100, clientHeight: 100 },
      style: {}
    };
    
    const heatmap = new Heatmap(mockCanvas);
    // Mock the draw function so we don't need highly detailed canvas context stubs
    heatmap.draw = vi.fn();

    const dummyPoints = [{ x: 50, y: 50, intensity: 0.8 }];
    heatmap.setPoints(dummyPoints);

    expect(heatmap.points).toBe(dummyPoints);
    expect(heatmap.draw).toHaveBeenCalled();
  });
});

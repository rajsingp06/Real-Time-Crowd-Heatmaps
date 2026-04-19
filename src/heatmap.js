/**
 * Heatmap generation on HTML5 Canvas.
 * Optimizes processing performance by down-scaling resolution internally.
 */
export class Heatmap {
  /**
   * Initializes the heatmap renderer and attaches resize listeners.
   * @param {HTMLCanvasElement} canvas - The target canvas DOM element.
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.points = [];
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement;
    // Lower canvas internal resolution for dramatic performance efficiency
    this.resolutionFactor = 2.5; 
    this.width = Math.floor(parent.clientWidth / this.resolutionFactor);
    this.height = Math.floor(parent.clientHeight / this.resolutionFactor);
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    // Force CSS to stretch the canvas back to original visual size
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
  }

  /**
   * Applies new density point data and triggers a frame render.
   * @param {Array<{x: number, y: number, intensity: number, radius?: number}>} points - The crowd data points.
   */
  setPoints(points) {
    this.points = points;
    this.draw();
  }

  /**
   * Clears the canvas and recursively draws gradient orbs for all density points.
   */
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw alpha gradients
    this.points.forEach(p => {
      // Scale percentages to pixels
      const x = (p.x / 100) * this.width;
      const y = (p.y / 100) * this.height;
      const radius = (p.radius || 100) / this.resolutionFactor;

      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
      
      // Intensity determines alpha
      gradient.addColorStop(0, `rgba(0, 0, 0, ${Math.min(1, p.intensity)})`);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    });

    this.colorize();
  }

  colorize() {
    // Read alpha channel and colorize
    const imgData = this.ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;

    const palette = this.getColorPalette();

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        // Map alpha to a color in the palette
        // Ensure offset stays within bound (0 to 255 * 4)
        const offset = (alpha | 0) * 4; // Bitwise OR is faster than Math.floor
        data[i] = palette[offset];     // R
        data[i + 1] = palette[offset + 1]; // G
        data[i + 2] = palette[offset + 2]; // B
        // Multiply original alpha by a factor for visually pleasing blending
        data[i + 3] = alpha * 0.95; 
      }
    }

    this.ctx.putImageData(imgData, 0, 0);
  }

  getColorPalette() {
    if (this._palette) return this._palette;
    
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 256, 0);
    
    // Dark mode neon heat map colors
    grad.addColorStop(0.1, 'rgba(0, 210, 255, 0.7)'); // Cool Blue
    grad.addColorStop(0.4, 'rgba(0, 230, 118, 0.8)'); // Green
    grad.addColorStop(0.7, 'rgba(255, 196, 0, 0.9)'); // Yellow
    grad.addColorStop(0.9, 'rgba(255, 51, 102, 1.0)'); // Hot Red

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1);
    this._palette = ctx.getImageData(0, 0, 256, 1).data;
    
    return this._palette;
  }
}

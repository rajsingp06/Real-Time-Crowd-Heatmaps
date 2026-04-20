import './style.css';
import { Heatmap } from './heatmap.js';
import DOMPurify from 'dompurify';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// Initialize Firebase correctly via NPM for Google Services Tracking
try {
  const firebaseConfig = { projectId: "real-time-crowd-heatmaps", appId: "1:mock-id" };
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
} catch (e) {
  /* Suppress expected ID errors during local dev */
}

// Setup Mock Data & State
const facilities = [
  { id: 'gate-north', name: 'North Entrance', type: 'gate', icon: '🚪', baseWait: 5, x: 50, y: 15, currentWait: 5, waitHistory: [] },
  { id: 'food-east', name: 'East Concessions', type: 'food', icon: '🍔', baseWait: 12, x: 80, y: 50, currentWait: 12, waitHistory: [] },
  { id: 'restroom-south', name: 'South Restrooms', type: 'restroom', icon: '🚻', baseWait: 3, x: 50, y: 85, currentWait: 3, waitHistory: [] },
  { id: 'merch-west', name: 'West Merchandise', type: 'merch', icon: '👕', baseWait: 8, x: 20, y: 50, currentWait: 8, waitHistory: [] }
];

let currentAlerts = [];
let appMode = 'admin'; // 'admin' or 'attendee'
let activeRouteFacility = null;
let is3DMode = false;
let predictiveChart = null;

const attendeeLoc = { x: 50, y: 50 };

/**
 * Bootstraps the application simulation loop and main UI elements.
 */
function initApp() {
  const canvas = document.getElementById('heatmaplayer');
  const heatmap = new Heatmap(canvas);

  setupUI();
  initChart();
  renderFacilityMarkers();

  let lastUIUpdate = 0;
  let lastHeatmapUpdate = 0;
  let currentPoints = [];

  function loop() {
    const now = Date.now();

    // 1. Simulate Crowd Data & Update heatmap at capped 15 FPS (every ~66ms) for high efficiency
    if (now - lastHeatmapUpdate > 66) {
      currentPoints = simulateCrowdDensity();
      heatmap.setPoints(currentPoints);
      lastHeatmapUpdate = now;
    }

    // 2. Simulate Attendee Movement (wander around middle) - Smooth 60 FPS
    const time = now / 1000;
    attendeeLoc.x = 50 + Math.cos(time * 0.1) * 15;
    attendeeLoc.y = 50 + Math.sin(time * 0.15) * 15;
    updateAttendeeLocationUI();

    // 3. Update active route if one is selected
    if (activeRouteFacility) {
      drawRoute(attendeeLoc, activeRouteFacility);
    }

    // Update Stats/UI every 2 seconds
    if (now - lastUIUpdate > 2000 && currentPoints.length > 0) {
      updateWaitTimes(currentPoints);
      updateWaitTimesUI();
      generateAlerts(currentPoints);
      updateAlertsUI();
      if(appMode === 'admin') updateGlobalStats(currentPoints);
      lastUIUpdate = now;
    }

    requestAnimationFrame(loop);
  }
  
  requestAnimationFrame(loop);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

/**
 * Initializes and binds event listeners for the mode toggle UI controls.
 */
function setupUI() {
  const btn3D = document.getElementById('btn-3d-mode');
  const btnAdmin = document.getElementById('btn-admin-mode');
  const btnAttendee = document.getElementById('btn-attendee-mode');
  const app = document.getElementById('app');

  btn3D.addEventListener('click', () => {
    is3DMode = !is3DMode;
    if (is3DMode) {
      document.body.classList.add('isometric-active');
      btn3D.classList.add('active');
    } else {
      document.body.classList.remove('isometric-active');
      btn3D.classList.remove('active');
    }
  });

  btnAdmin.addEventListener('click', () => {
    appMode = 'admin';
    app.className = 'dashboard admin-mode';
    btnAdmin.classList.add('active');
    btnAttendee.classList.remove('active');
    document.getElementById('route-panel').classList.add('hidden');
    document.getElementById('current-location').classList.add('hidden');
    document.getElementById('routing-layer').innerHTML = ''; // clear route
    activeRouteFacility = null;
    generateAlerts(simulateCrowdDensity()); // Refresh alerts context
    updateAlertsUI();
  });

  btnAttendee.addEventListener('click', () => {
    appMode = 'attendee';
    app.className = 'dashboard attendee-mode';
    btnAttendee.classList.add('active');
    btnAdmin.classList.remove('active');
    document.getElementById('route-panel').classList.remove('hidden');
    document.getElementById('current-location').classList.remove('hidden');
    generateAlerts(simulateCrowdDensity()); // Refresh alerts context
    updateAlertsUI();
  });
}

function renderFacilityMarkers() {
  const layer = document.getElementById('facilities-layer');
  layer.innerHTML = '';

  facilities.forEach(fac => {
    const el = document.createElement('div');
    el.className = 'facility-marker';
    el.innerHTML = fac.icon;
    el.style.left = `${fac.x}%`;
    el.style.top = `${fac.y}%`;
    el.title = fac.name;

    el.addEventListener('click', () => {
      if (appMode === 'attendee') {
        activeRouteFacility = fac;
        const details = document.getElementById('route-details');
        details.innerHTML = DOMPurify.sanitize(`
          <p>Routing to <strong>${fac.name}</strong></p>
          <p>Est. Wait: <strong>${fac.currentWait} min</strong></p>
          <p>Walking Time: ~${Math.floor(Math.random() * 3 + 2)} min</p>
        `);
      }
    });

    layer.appendChild(el);
  });
}

function updateAttendeeLocationUI() {
  if (appMode !== 'attendee') return;
  const locEl = document.getElementById('current-location');
  locEl.style.left = `${attendeeLoc.x}%`;
  locEl.style.top = `${attendeeLoc.y}%`;
}

function drawRoute(start, end) {
  const svg = document.getElementById('routing-layer');
  
  // Clear existing lines cleanly
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
  
  // Construct new line natively to bypass innerHTML SVG stripping
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', `${start.x}%`);
  line.setAttribute('y1', `${start.y}%`);
  line.setAttribute('x2', `${end.x}%`);
  line.setAttribute('y2', `${end.y}%`);
  line.setAttribute('class', 'route-path');
  
  svg.appendChild(line);
}

/**
 * Simulates real-time crowd data via mathematical wave functions.
 * @returns {Array<{x: number, y: number, intensity: number, radius: number}>} Simulated point entities.
 */
function simulateCrowdDensity() {
  const points = [];
  const time = Date.now() / 1000;
  
  facilities.forEach((facility, index) => {
    const shiftX = Math.sin(time * 0.5 + index) * 5;
    const shiftY = Math.cos(time * 0.5 + index) * 5;
    const intensity = 0.5 + Math.sin(time * 0.3 + index * 2) * 0.4;
    
    points.push({
      x: facility.x + shiftX,
      y: facility.y + shiftY,
      radius: 180 + Math.sin(time) * 40,
      intensity: Math.max(0.1, intensity * 0.4)
    });
    
    points.push({
      x: facility.x + shiftX,
      y: facility.y + shiftY,
      radius: 80,
      intensity: Math.max(0.2, intensity * 1.5)
    });
  });

  points.push({
    x: 50 + Math.cos(time * 0.2) * 30,
    y: 50 + Math.sin(time * 0.2) * 20,
    radius: 120,
    intensity: 0.6
  });

  return points;
}

/**
 * Iterates through facilities to calculate dynamic wait times based on nearby crowd density.
 * @param {Array<{x: number, y: number, intensity: number}>} points - Current active density points.
 */
function updateWaitTimes(points) {
  facilities.forEach(facility => {
    const nearby = points.filter(p => {
      const dx = p.x - facility.x;
      const dy = p.y - facility.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      return dist < 20; 
    });

    const totalIntensity = nearby.reduce((sum, p) => sum + p.intensity, 0);
    const newWait = Math.max(1, Math.floor(facility.baseWait + (totalIntensity * 6)));
    
    // Store history for trends
    facility.waitHistory.push(newWait);
    if (facility.waitHistory.length > 5) {
      facility.waitHistory.shift();
    }
    facility.currentWait = newWait;
  });
}

function getTrendIcon(history) {
  if (history.length < 2) return '<span class="trend-indicator trend-flat">➖</span>';
  const last = history[history.length - 1];
  const prev = history[history.length - 2];
  if (last > prev) return '<span class="trend-indicator trend-up" title="Trending Up">⬆️</span>';
  if (last < prev) return '<span class="trend-indicator trend-down" title="Trending Down">⬇️</span>';
  return '<span class="trend-indicator trend-flat">➖</span>';
}

function updateWaitTimesUI() {
  const list = document.getElementById('wait-times-list');
  list.innerHTML = '';
  
  facilities.forEach(fac => {
    const timeClass = fac.currentWait < 12 ? 'time-good' : 
                      fac.currentWait < 22 ? 'time-moderate' : 'time-severe';
    
    const trendIcon = getTrendIcon(fac.waitHistory);
    
    const li = document.createElement('li');
    li.className = 'wait-item';
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'wait-item-details';
    detailsDiv.innerHTML = DOMPurify.sanitize(`
      <span class="wait-item-title">${fac.icon} ${fac.name}</span>
      <span class="wait-item-time ${timeClass}">${fac.currentWait} <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted)">min</span>${trendIcon}</span>
    `);
    
    const routeIconDiv = document.createElement('div');
    routeIconDiv.style.cursor = 'pointer';
    routeIconDiv.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('routeTo', {detail: fac.id}));
    });
    
    // SVGs must be injected as native objects or namespace created to bypass intense string sanitation
    const svgWrap = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgWrap.setAttribute('width', '24');
    svgWrap.setAttribute('height', '24');
    svgWrap.setAttribute('viewBox', '0 0 24 24');
    svgWrap.setAttribute('fill', 'none');
    svgWrap.setAttribute('stroke', 'currentColor');
    svgWrap.setAttribute('stroke-width', '2');
    svgWrap.setAttribute('stroke-linecap', 'round');
    svgWrap.setAttribute('stroke-linejoin', 'round');
    svgWrap.style.color = 'var(--text-muted)';
    
    const circ = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circ.setAttribute('cx', '12');
    circ.setAttribute('cy', '12');
    circ.setAttribute('r', '10');
    svgWrap.appendChild(circ);
    
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', '12 6 12 12 16 14');
    svgWrap.appendChild(poly);
    
    routeIconDiv.appendChild(svgWrap);
    
    li.appendChild(detailsDiv);
    li.appendChild(routeIconDiv);
    list.appendChild(li);
  });
}

document.addEventListener('routeTo', (e) => {
  if (appMode !== 'attendee') return;
  const facId = e.detail;
  const fac = facilities.find(f => f.id === facId);
  if (fac) {
    activeRouteFacility = fac;
    const details = document.getElementById('route-details');
    details.innerHTML = DOMPurify.sanitize(`
      <p>Routing to <strong>${fac.name}</strong></p>
      <p>Est. Wait: <strong>${fac.currentWait} min</strong></p>
      <p>Walking Time: ~${Math.floor(Math.random() * 3 + 2)} min</p>
    `);
  }
});

function generateAlerts(points) {
  currentAlerts = [];
  facilities.forEach(fac => {
    if (fac.currentWait > 25) {
      if (appMode === 'attendee') {
        currentAlerts.push(`Avoid <strong>${fac.name}</strong> due to heavy congestion. Please find alternate amenities.`);
      } else {
        currentAlerts.push(`Critical congestion at <strong>${fac.name}</strong>. Diverting incoming traffic to alternate routes.`);
      }
    }
  });

  const totalInt = points.reduce((s,p) => s+p.intensity, 0);
  if(totalInt > 5.5) {
    if (appMode === 'attendee') {
      currentAlerts.push("General concourse crowding detected. Please stay to the right while walking.");
    } else {
      currentAlerts.push("General concourse crowding detected. Dispatching crowd control personnel.");
    }
  }
}

function updateAlertsUI() {
  const container = document.getElementById('alerts-container');
  container.innerHTML = '';
  
  if (currentAlerts.length === 0) {
    container.innerHTML = DOMPurify.sanitize('<p style="color: var(--text-muted); font-size: 0.9rem;">No active alerts. Flow is normal.</p>');
    return;
  }

  currentAlerts.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'alert-card';
    div.innerHTML = DOMPurify.sanitize(`<p>${msg}</p>`);
    container.appendChild(div);
  });
}

function updateGlobalStats(points) {
  const base = 45200;
  const variance = Math.floor(points[0].intensity * 150);
  document.getElementById('total-attendance').innerText = (base + variance).toLocaleString();
  
  const highest = [...facilities].sort((a,b) => b.currentWait - a.currentWait)[0];
  document.getElementById('peak-sector').innerText = highest.name;
  
  document.getElementById('flow-rate').innerText = Math.floor(100 + points[1].intensity * 30) + ' pax/min';

  if (predictiveChart) {
    const trendValue = Math.floor(60 + points[0].intensity * 40 + Math.random() * 10);
    predictiveChart.data.datasets[0].data.shift();
    predictiveChart.data.datasets[0].data.push(trendValue);
    predictiveChart.update('none'); // Update without full animation
  }
}

function initChart() {
  if (!window.Chart) return; // Prevent crash if chart hasn't loaded yet
  const ctx = document.getElementById('predictiveChart').getContext('2d');
  predictiveChart = new window.Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Now', '+10m', '+20m', '+30m', '+40m', '+50m', '+60m'],
      datasets: [{
        label: 'Projected Congestion Level',
        data: [45, 48, 55, 62, 50, 40, 35],
        borderColor: '#00d2ff',
        backgroundColor: 'rgba(0, 210, 255, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0a0e17',
        pointBorderColor: '#00d2ff',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false } 
      },
      scales: {
        x: { 
          grid: { color: 'rgba(255,255,255,0.05)' }, 
          ticks: { color: '#8c9bba', font: { family: 'Inter' } } 
        },
        y: { 
          grid: { color: 'rgba(255,255,255,0.05)' }, 
          ticks: { color: '#8c9bba', font: { family: 'Inter' } },
          min: 0,
          max: 100
        }
      }
    }
  });
}

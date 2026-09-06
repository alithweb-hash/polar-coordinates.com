/**
 * Interactive Polar and Cartesian Coordinates Visualizer
 * Built for University & High School Mathematics Curriculum
 */

// --- Global Application State ---
const state = {
  r: 2.0,
  thetaDeg: 30.0, // in degrees
  zoom: 1.0,
  panX: 0,
  panY: 0,
  isDragging: false,
  isPanning: false,
  dragTarget: null,
  lastMouseX: 0,
  lastMouseY: 0,
  
  // Angle unit mode for manual input: 'deg' | 'rad'
  manualAngleUnit: 'deg',
  
  // Toggles
  showPolarGrid: true,
  showCartesianGrid: true,
  showTriangle: true,
  showAngleArc: true,
  showOppositeRay: true,
  
  // Animation
  isAnimating: false,
  animSpeed: 0.8,
  animId: null,
  
  // Extra Points List
  pointsList: [],
  
  // Selected Curve
  currentCurve: 'none',
  
  // Theme
  theme: 'light'
};

// Canvas and DOM Elements
let canvas, ctx;
let canvasContainer;

// --- Initialize App ---
window.addEventListener('DOMContentLoaded', () => {
  initDOM();
  initCanvas();
  initEvents();
  initManualInputs();
  updateCalculations();
  render();
});

function initDOM() {
  canvas = document.getElementById('polarCanvas');
  ctx = canvas.getContext('2d');
  canvasContainer = document.getElementById('canvasContainer');
}

function initCanvas() {
  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    render();
  });
}

function resizeCanvas() {
  const rect = canvasContainer.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
}

// Convert model coordinates to screen pixel coordinates
function getScale() {
  const minDim = Math.min(canvas.clientWidth, canvas.clientHeight);
  const baseScale = (minDim / 2) / 4.5;
  return baseScale * state.zoom;
}

function toScreenX(x) {
  const centerX = canvas.clientWidth / 2 + state.panX;
  return centerX + x * getScale();
}

function toScreenY(y) {
  const centerY = canvas.clientHeight / 2 + state.panY;
  return centerY - y * getScale();
}

function toModelX(px) {
  const centerX = canvas.clientWidth / 2 + state.panX;
  return (px - centerX) / getScale();
}

function toModelY(py) {
  const centerY = canvas.clientHeight / 2 + state.panY;
  return (centerY - py) / getScale();
}

// --- Coordinate Calculations ---
function getCartesian(r, thetaDeg) {
  const rad = (thetaDeg * Math.PI) / 180;
  return {
    x: r * Math.cos(rad),
    y: r * Math.sin(rad)
  };
}

function getRadianStr(deg) {
  let d = Math.round(deg);
  const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
  const sign = d < 0 ? "-" : "";
  d = Math.abs(d);
  
  if (d === 0) return "0";
  if (d === 180) return `${sign}π`;
  
  const g = gcd(d, 180);
  const num = d / g;
  const den = 180 / g;
  
  if (den === 1) return `${sign}${num}π`;
  if (num === 1) return `${sign}π/${den}`;
  return `${sign}${num}π/${den}`;
}

// Parse angle text (supports "30", "pi/6", "3*pi/4", "1.5pi", "-pi", etc.)
function parseAngleInput(str, unitMode) {
  if (!str) return 0;
  let s = str.trim().toLowerCase();
  
  if (s.includes('pi') || s.includes('π')) {
    s = s.replace(/π/g, 'pi');
    s = s.replace(/pi/g, `(${Math.PI})`);
    try {
      // Safe math evaluator for fractions like 3*(Math.PI)/4
      const sanitized = s.replace(/[^0-9\.\+\-\*\/\(\)]/g, '');
      const radVal = Function(`'use strict'; return (${sanitized})`)();
      return (radVal * 180) / Math.PI; // convert rad to deg
    } catch (e) {
      return 0;
    }
  }
  
  const num = parseFloat(s);
  if (isNaN(num)) return 0;
  
  if (unitMode === 'rad') {
    return (num * 180) / Math.PI;
  }
  return num;
}

// Update all Math displays and badges
function updateCalculations() {
  const r = state.r;
  const thetaDeg = state.thetaDeg;
  const cart = getCartesian(r, thetaDeg);
  const x = cart.x;
  const y = cart.y;
  
  // Update Sliders and Basic Inputs
  document.getElementById('radiusSlider').value = r;
  document.getElementById('radiusInput').value = r.toFixed(1);
  document.getElementById('radiusValDisplay').textContent = r.toFixed(2);
  
  document.getElementById('angleSlider').value = thetaDeg;
  document.getElementById('angleInput').value = thetaDeg;
  document.getElementById('angleValDisplay').textContent = `${thetaDeg.toFixed(1)}° (${getRadianStr(thetaDeg)})`;
  
  // Sync Manual Input Fields
  const manualR = document.getElementById('manualR');
  if (document.activeElement !== manualR) {
    manualR.value = r;
  }
  
  const manualTheta = document.getElementById('manualTheta');
  if (document.activeElement !== manualTheta) {
    if (state.manualAngleUnit === 'rad') {
      const rad = (thetaDeg * Math.PI) / 180;
      manualTheta.value = rad.toFixed(3);
    } else {
      manualTheta.value = thetaDeg.toFixed(1);
    }
  }
  
  const manualX = document.getElementById('manualX');
  const manualY = document.getElementById('manualY');
  if (document.activeElement !== manualX) manualX.value = x.toFixed(3);
  if (document.activeElement !== manualY) manualY.value = y.toFixed(3);
  
  // Point badge
  document.getElementById('currentPointBadge').textContent = `P(${r.toFixed(2)}, ${thetaDeg.toFixed(1)}°)`;
  
  // Stats on canvas
  document.getElementById('canvasCartesianVal').textContent = `(x: ${x.toFixed(2)}, y: ${y.toFixed(2)})`;
  document.getElementById('canvasPolarVal').textContent = `(r: ${r.toFixed(2)}, θ: ${thetaDeg.toFixed(1)}°)`;
  
  // Direction Widget
  const dirIndicator = document.getElementById('directionIndicator');
  const dirTitle = document.getElementById('dirTitle');
  const dirDesc = document.getElementById('dirDesc');
  
  if (thetaDeg > 0) {
    dirIndicator.className = 'direction-indicator';
    dirTitle.textContent = 'زاوية موجبة θ > 0';
    dirDesc.textContent = 'الدوران بعكس اتجاه عقارب الساعة (الاتجاه الموجب القياسي)';
    dirIndicator.querySelector('.dir-icon').textContent = '🔄';
  } else if (thetaDeg < 0) {
    dirIndicator.className = 'direction-indicator negative';
    dirTitle.textContent = 'زاوية سالبة θ < 0';
    dirDesc.textContent = 'الدوران باتجاه حركة عقارب الساعة (الاتجاه السالب)';
    dirIndicator.querySelector('.dir-icon').textContent = '🔁';
  } else {
    dirIndicator.className = 'direction-indicator';
    dirTitle.textContent = 'زاوية صفرية θ = 0°';
    dirDesc.textContent = 'منطبقة تماماً على الاتجاه الموجب لمحور السينات X';
    dirIndicator.querySelector('.dir-icon').textContent = '➡️';
  }
  
  // Math expressions live update
  const rad = (thetaDeg * Math.PI) / 180;
  const cosVal = Math.cos(rad).toFixed(3);
  const sinVal = Math.sin(rad).toFixed(3);
  
  document.getElementById('exprX').textContent = 
    `x = r · cos(θ) = ${r.toFixed(2)} × cos(${thetaDeg.toFixed(1)}°) = ${r.toFixed(2)} × ${cosVal} = ${x.toFixed(3)}`;
  
  document.getElementById('exprY').textContent = 
    `y = r · sin(θ) = ${r.toFixed(2)} × sin(${thetaDeg.toFixed(1)}°) = ${r.toFixed(2)} × ${sinVal} = ${y.toFixed(3)}`;
  
  const calcR = Math.sqrt(x*x + y*y);
  document.getElementById('exprR').textContent = 
    `r = √(x² + y²) = √(${x.toFixed(2)}² + ${y.toFixed(2)}²) = ${calcR.toFixed(3)}`;
  
  let atanDeg = (Math.atan2(y, x) * 180 / Math.PI);
  if (atanDeg < 0) atanDeg += 360;
  document.getElementById('exprTheta').textContent = 
    `θ = tan⁻¹(y / x) = tan⁻¹(${y.toFixed(2)} / ${x.toFixed(2)}) = ${atanDeg.toFixed(1)}° (${getRadianStr(atanDeg)})`;

  // Quadrant detection
  let quadText = "";
  if (Math.abs(x) < 0.001 && Math.abs(y) < 0.001) quadText = "نقطة الأصل (Origin O)";
  else if (Math.abs(x) < 0.001) quadText = y > 0 ? "محور الصادات الموجب (+Y)" : "محور الصادات السالب (-Y)";
  else if (Math.abs(y) < 0.001) quadText = x > 0 ? "محور السينات الموجب (+X)" : "محور السينات السالب (-X)";
  else if (x > 0 && y > 0) quadText = "الربع الأول (Quadrant I)";
  else if (x < 0 && y > 0) quadText = "الربع الثاني (Quadrant II)";
  else if (x < 0 && y < 0) quadText = "الربع الثالث (Quadrant III)";
  else quadText = "الربع الرابع (Quadrant IV)";

  // Equivalent coordinates
  const normTheta = ((thetaDeg % 360) + 360) % 360;
  const eq1_r = r;
  const eq1_t = normTheta;
  const eq2_r = -r;
  const eq2_t = (normTheta + 180) % 360;
  const eq3_r = r;
  const eq3_t = normTheta - 360;
  const eq4_r = -r;
  const eq4_t = normTheta - 180;

  document.getElementById('quadrantInfo').innerHTML = `
    📍 تقع النقطة الحقيقية في: <strong>${quadText}</strong>.
    <br>
    الصيغ القطبية المكافئة لنفس الموقع الهندسي:
    <span class="tag">(${eq1_r.toFixed(1)}, ${eq1_t.toFixed(0)}°)</span>
    <span class="tag">(${eq2_r.toFixed(1)}, ${eq2_t.toFixed(0)}°)</span>
    <span class="tag">(${eq3_r.toFixed(1)}, ${eq3_t.toFixed(0)}°)</span>
    <span class="tag">(${eq4_r.toFixed(1)}, ${eq4_t.toFixed(0)}°)</span>
  `;
}

// --- Main Canvas Render Loop ---
function render() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  
  ctx.clearRect(0, 0, w, h);
  
  const isLight = document.body.getAttribute('data-theme') === 'light';
  
  if (state.showCartesianGrid) drawCartesianGrid(isLight);
  if (state.showPolarGrid) drawPolarGrid(isLight);
  if (state.currentCurve !== 'none') drawPolarCurve();
  drawSavedPoints();
  drawActivePointSystem(isLight);
  drawAxes(isLight);
}

function drawCartesianGrid(isLight) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const scale = getScale();
  const step = 1;
  
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = isLight ? 'rgba(100, 116, 139, 0.12)' : 'rgba(148, 163, 184, 0.08)';
  
  const minX = Math.floor(toModelX(0));
  const maxX = Math.ceil(toModelX(w));
  const minY = Math.floor(toModelY(h));
  const maxY = Math.ceil(toModelY(0));
  
  ctx.beginPath();
  for (let x = minX; x <= maxX; x += step) {
    const sx = toScreenX(x);
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, h);
  }
  for (let y = minY; y <= maxY; y += step) {
    const sy = toScreenY(y);
    ctx.moveTo(0, sy);
    ctx.lineTo(w, sy);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPolarGrid(isLight) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const ox = toScreenX(0);
  const oy = toScreenY(0);
  const scale = getScale();
  
  ctx.save();
  
  const maxR = Math.ceil(Math.hypot(w, h) / scale);
  for (let r = 1; r <= maxR; r++) {
    const radiusPx = r * scale;
    ctx.beginPath();
    ctx.arc(ox, oy, radiusPx, 0, Math.PI * 2);
    ctx.strokeStyle = (r % 5 === 0)
      ? (isLight ? 'rgba(2, 132, 199, 0.4)' : 'rgba(56, 189, 248, 0.35)')
      : (isLight ? 'rgba(2, 132, 199, 0.18)' : 'rgba(56, 189, 248, 0.15)');
    ctx.lineWidth = (r % 5 === 0) ? 1.5 : 1;
    ctx.setLineDash(r % 2 === 0 ? [] : [3, 4]);
    ctx.stroke();
    
    if (r <= 10) {
      ctx.fillStyle = isLight ? '#0284c7' : '#38bdf8';
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillText(`r=${r}`, ox + radiusPx + 4, oy - 4);
    }
  }
  
  const angles = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
  ctx.setLineDash([2, 3]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = isLight ? 'rgba(2, 132, 199, 0.22)' : 'rgba(56, 189, 248, 0.18)';
  
  const rayLen = Math.max(w, h) * 1.5;
  angles.forEach(deg => {
    const rad = (deg * Math.PI) / 180;
    const ex = ox + Math.cos(rad) * rayLen;
    const ey = oy - Math.sin(rad) * rayLen;
    
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
    
    const labelDist = Math.min(w, h) * 0.44;
    const lx = ox + Math.cos(rad) * labelDist;
    const ly = oy - Math.sin(rad) * labelDist;
    
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '11px "Cairo", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const radText = getRadianStr(deg);
    ctx.fillText(`${deg}° (${radText})`, lx, ly);
  });
  
  ctx.restore();
}

function drawAxes(isLight) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const ox = toScreenX(0);
  const oy = toScreenY(0);
  
  ctx.save();
  ctx.strokeStyle = isLight ? '#1e293b' : '#f8fafc';
  ctx.lineWidth = 2;
  ctx.fillStyle = isLight ? '#1e293b' : '#f8fafc';
  
  // X-axis
  ctx.beginPath();
  ctx.moveTo(0, oy);
  ctx.lineTo(w, oy);
  ctx.stroke();
  
  // Y-axis
  ctx.beginPath();
  ctx.moveTo(ox, 0);
  ctx.lineTo(ox, h);
  ctx.stroke();
  
  drawArrowHead(w - 12, oy, 0, ctx);
  drawArrowHead(ox, 12, -Math.PI / 2, ctx);
  
  ctx.font = 'bold 14px "Cairo", sans-serif';
  ctx.fillText('x', w - 24, oy + 20);
  ctx.fillText('y', ox + 15, 24);
  ctx.fillText('O (0,0)', ox - 28, oy + 20);
  
  ctx.restore();
}

function drawArrowHead(x, y, angle, context) {
  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(-10, -5);
  context.lineTo(-10, 5);
  context.closePath();
  context.fill();
  context.restore();
}

function drawActivePointSystem(isLight) {
  const r = state.r;
  const thetaDeg = state.thetaDeg;
  const thetaRad = (thetaDeg * Math.PI) / 180;
  
  const ox = toScreenX(0);
  const oy = toScreenY(0);
  
  const cart = getCartesian(r, thetaDeg);
  const px = toScreenX(cart.x);
  const py = toScreenY(cart.y);
  
  const projXx = toScreenX(cart.x);
  const projXy = toScreenY(0);
  const projYx = toScreenX(0);
  const projYy = toScreenY(cart.y);
  
  ctx.save();
  
  // 1. Reference Triangle
  if (state.showTriangle) {
    ctx.fillStyle = isLight ? 'rgba(225, 29, 72, 0.12)' : 'rgba(244, 63, 94, 0.15)';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(projXx, projXy);
    ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fill();
    
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isLight ? '#0284c7' : '#38bdf8';
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(projXx, projXy);
    ctx.lineTo(px, py);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(projYx, projYy);
    ctx.lineTo(px, py);
    ctx.stroke();
    
    ctx.setLineDash([]);
    ctx.font = 'bold 13px "Cairo", sans-serif';
    ctx.fillStyle = isLight ? '#0369a1' : '#38bdf8';
    
    ctx.fillText(`x = ${(cart.x).toFixed(2)}`, (ox + projXx) / 2, oy + (cart.y >= 0 ? 18 : -8));
    ctx.fillText(`y = ${(cart.y).toFixed(2)}`, projXx + (cart.x >= 0 ? 10 : -55), (projXy + py) / 2);
  }
  
  // 2. Opposite Ray if r < 0
  if (state.showOppositeRay && r < 0) {
    const posRayDist = Math.abs(r) * getScale();
    const origRayX = ox + Math.cos(thetaRad) * posRayDist;
    const origRayY = oy - Math.sin(thetaRad) * posRayDist;
    
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(origRayX, origRayY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(origRayX, origRayY, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.fill();
    ctx.stroke();
    
    ctx.font = '11px "Cairo", sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`اتجاه الزاوية θ=${thetaDeg.toFixed(0)}°`, origRayX + 8, origRayY - 8);
    ctx.fillText(`(نتحرك بالاتجاه المعاكس لأن r سالب)`, px + 10, py + 25);
  }
  
  // 3. Directed Angle Arc
  if (state.showAngleArc && Math.abs(thetaDeg) > 0.5) {
    const arcRadius = Math.min(45, Math.abs(r) * getScale() * 0.45 + 20);
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = thetaDeg >= 0 ? '#10b981' : '#f43f5e';
    
    ctx.beginPath();
    const canvasStart = 0;
    const canvasEnd = -thetaRad;
    const counterClockwise = thetaDeg >= 0;
    
    ctx.arc(ox, oy, arcRadius, canvasStart, canvasEnd, counterClockwise);
    ctx.stroke();
    
    const endX = ox + Math.cos(canvasEnd) * arcRadius;
    const endY = oy + Math.sin(canvasEnd) * arcRadius;
    const tangentAngle = canvasEnd + (counterClockwise ? -Math.PI / 2 : Math.PI / 2);
    
    ctx.fillStyle = ctx.strokeStyle;
    drawArrowHead(endX, endY, tangentAngle, ctx);
    
    const midAngle = -thetaRad / 2;
    const labelX = ox + Math.cos(midAngle) * (arcRadius + 18);
    const labelY = oy + Math.sin(midAngle) * (arcRadius + 18);
    ctx.font = 'bold 12px "Cairo", sans-serif';
    ctx.fillText(`θ = ${thetaDeg.toFixed(0)}°`, labelX, labelY);
  }
  
  // 4. Vector Line
  ctx.setLineDash([]);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f43f5e';
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(px, py);
  ctx.stroke();
  
  ctx.font = 'bold 14px "Cairo", sans-serif';
  ctx.fillStyle = '#f43f5e';
  const midVx = (ox + px) / 2;
  const midVy = (oy + py) / 2;
  ctx.fillText(`r = ${r.toFixed(2)}`, midVx - 15, midVy - 12);
  
  // 5. Point Circle Handle
  ctx.beginPath();
  ctx.arc(px, py, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#f43f5e';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(px, py, 15, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  ctx.font = 'bold 14px "Cairo", sans-serif';
  ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
  ctx.fillText(`P(${r.toFixed(1)}, ${thetaDeg.toFixed(0)}°)`, px + 12, py - 12);
  
  ctx.restore();
}

function drawSavedPoints() {
  state.pointsList.forEach((pt) => {
    const cart = getCartesian(pt.r, pt.thetaDeg);
    const px = toScreenX(cart.x);
    const py = toScreenY(cart.y);
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fillStyle = pt.color || '#a855f7';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    
    ctx.font = 'bold 12px "Cairo", sans-serif';
    ctx.fillStyle = pt.color || '#a855f7';
    ctx.fillText(`${pt.name}: (${pt.r}, ${pt.thetaDeg}°)`, px + 10, py - 6);
    ctx.restore();
  });
}

function drawPolarCurve() {
  const curve = state.currentCurve;
  if (curve === 'none') return;
  
  ctx.save();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#10b981';
  ctx.beginPath();
  
  const step = 0.02;
  const maxRad = (curve === 'spiral') ? 6 * Math.PI : 2 * Math.PI;
  let first = true;
  
  for (let t = 0; t <= maxRad; t += step) {
    let rVal = 0;
    if (curve === 'circle') rVal = 2.5;
    else if (curve === 'cardioid') rVal = 1.8 * (1 + Math.cos(t));
    else if (curve === 'rose4') rVal = 3 * Math.cos(2 * t);
    else if (curve === 'rose3') rVal = 3 * Math.sin(3 * t);
    else if (curve === 'spiral') rVal = 0.25 * t;
    else if (curve === 'lemniscate') {
      const val = 8 * Math.cos(2 * t);
      if (val >= 0) rVal = Math.sqrt(val);
      else continue;
    }
    
    const cx = toScreenX(rVal * Math.cos(t));
    const cy = toScreenY(rVal * Math.sin(t));
    
    if (first) {
      ctx.moveTo(cx, cy);
      first = false;
    } else {
      ctx.lineTo(cx, cy);
    }
  }
  
  if (curve !== 'spiral') ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// --- Manual Input Hub Initialization ---
function initManualInputs() {
  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Unit toggles (deg vs rad)
  const degBtn = document.getElementById('unitDegBtn');
  const radBtn = document.getElementById('unitRadBtn');
  
  degBtn.addEventListener('click', () => {
    state.manualAngleUnit = 'deg';
    degBtn.classList.add('active');
    radBtn.classList.remove('active');
    document.getElementById('manualTheta').placeholder = "مثال: 30 أو -150";
    updateCalculations();
  });
  
  radBtn.addEventListener('click', () => {
    state.manualAngleUnit = 'rad';
    radBtn.classList.add('active');
    degBtn.classList.remove('active');
    document.getElementById('manualTheta').placeholder = "مثال: pi/6 أو 0.524";
    updateCalculations();
  });

  // Radian chips
  document.querySelectorAll('.rad-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = parseFloat(chip.getAttribute('data-val'));
      state.thetaDeg = val;
      updateCalculations();
      render();
    });
  });

  // Form 1: Polar Submit
  const polarForm = document.getElementById('polarManualForm');
  polarForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const rVal = parseFloat(document.getElementById('manualR').value);
    const thetaStr = document.getElementById('manualTheta').value;
    const thetaVal = parseAngleInput(thetaStr, state.manualAngleUnit);
    
    if (!isNaN(rVal)) state.r = rVal;
    state.thetaDeg = thetaVal;
    
    updateCalculations();
    render();
  });

  // Add to list from manual
  document.getElementById('manualAddToListBtn').addEventListener('click', () => {
    const rVal = parseFloat(document.getElementById('manualR').value) || state.r;
    const thetaStr = document.getElementById('manualTheta').value;
    const thetaVal = parseAngleInput(thetaStr, state.manualAngleUnit);
    
    const ptIndex = state.pointsList.length + 1;
    const colors = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
    const chosenColor = colors[state.pointsList.length % colors.length];
    
    state.pointsList.push({
      id: Date.now(),
      name: `P${ptIndex}`,
      r: rVal,
      thetaDeg: thetaVal,
      color: chosenColor
    });
    updatePointsTable();
    render();
  });

  // Form 2: Cartesian Submit
  const cartForm = document.getElementById('cartesianManualForm');
  cartForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const xVal = parseFloat(document.getElementById('manualX').value) || 0;
    const yVal = parseFloat(document.getElementById('manualY').value) || 0;
    
    const newR = Math.hypot(xVal, yVal);
    let newTheta = (Math.atan2(yVal, xVal) * 180) / Math.PI;
    
    state.r = parseFloat(newR.toFixed(3));
    state.thetaDeg = parseFloat(newTheta.toFixed(2));
    
    updateCalculations();
    render();
  });

  // Form 3: Quick Text parser (e.g. "(1, 30)", "(-1, 210)", "(2, pi/3)")
  const textForm = document.getElementById('textManualForm');
  textForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const str = document.getElementById('quickTextInput').value.trim();
    
    // Clean string: remove brackets
    const clean = str.replace(/[\(\)\[\]\{\}]/g, '');
    const parts = clean.split(/[,;\s]+/).filter(p => p.length > 0);
    
    if (parts.length >= 2) {
      const rVal = parseFloat(parts[0]);
      const thetaVal = parseAngleInput(parts[1], 'deg');
      
      if (!isNaN(rVal)) state.r = rVal;
      state.thetaDeg = thetaVal;
      
      updateCalculations();
      render();
    }
  });

  // Export and download buttons
  document.getElementById('downloadPdfBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = 'الاحداثيات_القطبية_والديكارتية.pdf';
    link.download = 'الاحداثيات_القطبية_والديكارتية.pdf';
    link.target = '_blank';
    link.click();
  });

  document.getElementById('downloadWordBtn').addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = 'الاحداثيات_القطبية_والديكارتية.docx';
    link.download = 'الاحداثيات_القطبية_والديكارتية.docx';
    link.click();
  });

  document.getElementById('exportImageBtn').addEventListener('click', () => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const exportCtx = exportCanvas.getContext('2d');
    
    // Fill white background so exported PNG is crystal clear
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    exportCtx.drawImage(canvas, 0, 0);
    
    const link = document.createElement('a');
    link.download = `polar_plot_r${state.r}_theta${state.thetaDeg}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  });
}

// --- Events & Sliders ---
function initEvents() {
  const rSlider = document.getElementById('radiusSlider');
  const rInput = document.getElementById('radiusInput');
  const thetaSlider = document.getElementById('angleSlider');
  const thetaInput = document.getElementById('angleInput');
  
  rSlider.addEventListener('input', (e) => {
    state.r = parseFloat(e.target.value);
    updateCalculations();
    render();
  });
  
  rInput.addEventListener('change', (e) => {
    state.r = parseFloat(e.target.value) || 0;
    updateCalculations();
    render();
  });
  
  thetaSlider.addEventListener('input', (e) => {
    state.thetaDeg = parseFloat(e.target.value);
    updateCalculations();
    render();
  });
  
  thetaInput.addEventListener('change', (e) => {
    state.thetaDeg = parseFloat(e.target.value) || 0;
    updateCalculations();
    render();
  });
  
  // Lesson Presets Buttons (Ex 1)
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const pr = parseFloat(btn.getAttribute('data-r'));
      const pt = parseFloat(btn.getAttribute('data-theta'));
      
      state.r = pr;
      state.thetaDeg = pt;
      updateCalculations();
      render();
    });
  });
  
  // Toolbar Toggles
  document.getElementById('togglePolarGrid').addEventListener('change', (e) => {
    state.showPolarGrid = e.target.checked;
    render();
  });
  
  document.getElementById('toggleCartesianGrid').addEventListener('change', (e) => {
    state.showCartesianGrid = e.target.checked;
    render();
  });
  
  document.getElementById('toggleTriangle').addEventListener('change', (e) => {
    state.showTriangle = e.target.checked;
    render();
  });
  
  document.getElementById('toggleAngleArc').addEventListener('change', (e) => {
    state.showAngleArc = e.target.checked;
    render();
  });
  
  document.getElementById('toggleOppositeRay').addEventListener('change', (e) => {
    state.showOppositeRay = e.target.checked;
    render();
  });
  
  // Zoom Controls
  document.getElementById('zoomInBtn').addEventListener('click', () => {
    state.zoom = Math.min(3.0, state.zoom * 1.2);
    document.getElementById('zoomLevel').textContent = `${Math.round(state.zoom * 100)}%`;
    render();
  });
  
  document.getElementById('zoomOutBtn').addEventListener('click', () => {
    state.zoom = Math.max(0.4, state.zoom / 1.2);
    document.getElementById('zoomLevel').textContent = `${Math.round(state.zoom * 100)}%`;
    render();
  });
  
  document.getElementById('resetViewBtn').addEventListener('click', () => {
    state.zoom = 1.0;
    state.panX = 0;
    state.panY = 0;
    document.getElementById('zoomLevel').textContent = `100%`;
    render();
  });
  
  // Print Page
  const printBtn = document.getElementById('printPageBtn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
  
  // Animation Toggle
  const playBtn = document.getElementById('playAnimationBtn');
  playBtn.addEventListener('click', () => {
    state.isAnimating = !state.isAnimating;
    if (state.isAnimating) {
      document.getElementById('playIcon').textContent = '⏸️';
      document.getElementById('playText').textContent = 'إيقاف التحريك';
      runAnimation();
    } else {
      document.getElementById('playIcon').textContent = '▶️';
      document.getElementById('playText').textContent = 'تحريك الزاوية تلقائياً';
      cancelAnimationFrame(state.animId);
    }
  });
  
  // Points Management
  document.getElementById('addToListBtn').addEventListener('click', () => {
    const ptIndex = state.pointsList.length + 1;
    const colors = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
    const chosenColor = colors[state.pointsList.length % colors.length];
    
    state.pointsList.push({
      id: Date.now(),
      name: `P${ptIndex}`,
      r: state.r,
      thetaDeg: state.thetaDeg,
      color: chosenColor
    });
    updatePointsTable();
    render();
  });
  
  document.getElementById('plotAllEx1Btn').addEventListener('click', () => {
    state.pointsList = [
      { id: 1, name: 'P₁(1, 30°)', r: 1, thetaDeg: 30, color: '#38bdf8' },
      { id: 2, name: 'P₂(2, 30°)', r: 2, thetaDeg: 30, color: '#10b981' },
      { id: 3, name: 'P₃(-1, 30°)', r: -1, thetaDeg: 30, color: '#f59e0b' },
      { id: 4, name: 'P₄(1, 210°)', r: 1, thetaDeg: 210, color: '#ec4899' },
      { id: 5, name: 'P₅(-1, -150°)', r: -1, thetaDeg: -150, color: '#a855f7' }
    ];
    updatePointsTable();
    render();
  });
  
  document.getElementById('clearPointsBtn').addEventListener('click', () => {
    state.pointsList = [];
    updatePointsTable();
    render();
  });
  
  // Polar Curves Select
  document.getElementById('drawCurveBtn').addEventListener('click', () => {
    state.currentCurve = document.getElementById('polarCurveSelect').value;
    render();
  });
  
  document.getElementById('clearCurveBtn').addEventListener('click', () => {
    state.currentCurve = 'none';
    document.getElementById('polarCurveSelect').value = 'none';
    render();
  });

  setupCanvasDragInteractions();
}

function runAnimation() {
  if (!state.isAnimating) return;
  state.thetaDeg = (state.thetaDeg + state.animSpeed);
  if (state.thetaDeg > 360) state.thetaDeg -= 360;
  
  updateCalculations();
  render();
  state.animId = requestAnimationFrame(runAnimation);
}

function setupCanvasDragInteractions() {
  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const isNearPoint = (px, py) => {
    const cart = getCartesian(state.r, state.thetaDeg);
    const spx = toScreenX(cart.x);
    const spy = toScreenY(cart.y);
    return Math.hypot(px - spx, py - spy) < 25;
  };

  const onStart = (e) => {
    const pos = getPos(e);
    if (isNearPoint(pos.x, pos.y)) {
      state.isDragging = true;
      state.dragTarget = 'point';
      canvas.style.cursor = 'grabbing';
    } else {
      state.isPanning = true;
      state.lastMouseX = pos.x;
      state.lastMouseY = pos.y;
      canvas.style.cursor = 'move';
    }
  };

  const onMove = (e) => {
    const pos = getPos(e);
    
    if (state.isDragging && state.dragTarget === 'point') {
      const mx = toModelX(pos.x);
      const my = toModelY(pos.y);
      
      const newR = Math.hypot(mx, my);
      let newTheta = (Math.atan2(my, mx) * 180) / Math.PI;
      
      state.r = parseFloat(newR.toFixed(2));
      state.thetaDeg = parseFloat(newTheta.toFixed(1));
      
      updateCalculations();
      render();
    } else if (state.isPanning) {
      state.panX += pos.x - state.lastMouseX;
      state.panY += pos.y - state.lastMouseY;
      state.lastMouseX = pos.x;
      state.lastMouseY = pos.y;
      render();
    } else {
      if (isNearPoint(pos.x, pos.y)) {
        canvas.style.cursor = 'grab';
      } else {
        canvas.style.cursor = 'crosshair';
      }
    }
  };

  const onEnd = () => {
    state.isDragging = false;
    state.isPanning = false;
    state.dragTarget = null;
    canvas.style.cursor = 'crosshair';
  };

  canvas.addEventListener('mousedown', onStart);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onEnd);

  canvas.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onEnd);
}

function updatePointsTable() {
  const tbody = document.getElementById('pointsTableBody');
  tbody.innerHTML = '';
  
  if (state.pointsList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--text-muted); padding: 1.5rem;">لا توجد نقاط محفوظة. اضغط "➕ حفظ النقطة" أو زر "رسم جميع نقاط (Ex 1) معاً" للبدء.</td></tr>`;
    return;
  }
  
  state.pointsList.forEach((pt) => {
    const cart = getCartesian(pt.r, pt.thetaDeg);
    const radStr = getRadianStr(pt.thetaDeg);
    
    const isEx1Equiv = (Math.abs(cart.x - (-0.866)) < 0.05 && Math.abs(cart.y - (-0.5)) < 0.05);
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:${pt.color};"></span></td>
      <td><strong>${pt.name}</strong></td>
      <td><code>(${pt.r}, ${pt.thetaDeg}°)</code></td>
      <td><code>${radStr}</code></td>
      <td><code>(x: ${cart.x.toFixed(2)}, y: ${cart.y.toFixed(2)})</code></td>
      <td>${isEx1Equiv ? '<span class="badge-equiv">متطابقة مع P₃, P₄, P₅ في الربع III</span>' : '<span style="color:var(--text-muted);">عادية</span>'}</td>
      <td>
        <button class="mini-btn select-pt-btn" data-r="${pt.r}" data-theta="${pt.thetaDeg}">تحديد</button>
        <button class="mini-btn remove-pt-btn" data-id="${pt.id}" style="color:var(--accent-rose);">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  
  tbody.querySelectorAll('.select-pt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.r = parseFloat(btn.getAttribute('data-r'));
      state.thetaDeg = parseFloat(btn.getAttribute('data-theta'));
      updateCalculations();
      render();
    });
  });
  
  tbody.querySelectorAll('.remove-pt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-id'));
      state.pointsList = state.pointsList.filter(p => p.id !== id);
      updatePointsTable();
      render();
    });
  });
}

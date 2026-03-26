/* ============================================================
   NETWORK PACKET TRANSMISSION SIMULATOR — script.js
   Mirrors logic from NetworkSimulator.java:
   - Segmentation by 3 chars
   - CRC = data.length % 2
   - 8-bit binary conversion
   - 20% packet loss, 30% CRC error with retransmit
============================================================ */

'use strict';

// ── STATE ──────────────────────────────────────────────────
let message    = '';
let segments   = [];
let simActive  = false;
let packetCount = 0;

// ── UTILITY: sleep ─────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── UTILITY: random int [0, max) ──────────────────────────
const rand = max => Math.floor(Math.random() * max);

// ── UTILITY: to 8-bit binary string ──────────────────────
const toBinary = ch => ch.charCodeAt(0).toString(2).padStart(8, '0');

// ── UTILITY: scroll element into view smoothly ────────────
const scrollTo = id => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ── UTILITY: show section with fade-in + slide-up + brief glow
const showSection = (id, glowColor) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display   = '';
  el.style.opacity   = '0';
  el.style.transform = 'translateY(26px)';
  el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
  void el.offsetHeight; // reflow
  el.style.opacity   = '1';
  el.style.transform = 'translateY(0)';
  if (glowColor) {
    el.style.boxShadow = `0 0 0 1px rgba(0,212,255,0.05), 0 6px 50px 0 ${glowColor}`;
    setTimeout(() => { if (el) el.style.boxShadow = ''; }, 900);
  }
};

// ── UTILITY: add log line to transmission log ─────────────
const addLog = (text, cls = 'log-normal') => {
  const log  = document.getElementById('transmission-log');
  const span = document.createElement('span');
  span.className = `log-line ${cls}`;
  span.textContent = text;
  log.appendChild(span);
  log.scrollTop = log.scrollHeight;
};

// ── UTILITY: update top progress bar + layer label + pkt badge
function updateSimProgress(layerIndex) {
  const simBar    = document.getElementById('sim-progress-bar');
  const layerLbl  = document.getElementById('layer-counter-label');
  const pktBadge  = document.getElementById('packet-badge');
  if (!simBar) return;
  const pct = Math.min(Math.round(((layerIndex - 1) / 6) * 100), 100);
  simBar.style.width = pct + '%';
  if (layerLbl) layerLbl.textContent = `Layer ${Math.min(layerIndex, 7)} of 7`;
  if (pktBadge) pktBadge.textContent = `Packets: ${packetCount}`;
}

// ══════════════════════════════════════════════════════════
//  PROGRESS TRACKER (side nav)
// ══════════════════════════════════════════════════════════
const TOTAL_STEPS = 9;

function setStepActive(n) {
  document.querySelectorAll('#layer-steps .step').forEach((el, i) => {
    el.classList.remove('active');
    if (i < n - 1) el.classList.add('done');
    if (i === n - 1) el.classList.add('active');
  });
  const pct = ((n - 1) / (TOTAL_STEPS - 1)) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
}

// ── Highlight corresponding OSI diagram layer ─────────────
function highlightOSI(layerNum) {
  document.querySelectorAll('.osi-layer').forEach(el => el.classList.remove('highlighted'));
  const target = document.querySelector(`.osi-layer[data-layer="${layerNum}"]`);
  if (target) target.classList.add('highlighted');
}

// ══════════════════════════════════════════════════════════
//  MAIN SIMULATION ENTRY
// ══════════════════════════════════════════════════════════
async function startSimulation() {
  const input = document.getElementById('message-input');
  message = input.value.trim();

  if (!message) {
    const err = document.getElementById('error-msg');
    err.style.display = 'block';
    input.focus();
    return;
  }
  document.getElementById('error-msg').style.display = 'none';

  // pre-calculate packet count from message length / 3
  packetCount = Math.ceil(message.length / 3);

  simActive = true;

  // Show progress UI
  const progressWrap = document.getElementById('sim-progress-wrap');
  if (progressWrap) {
    progressWrap.style.display = 'block';
    progressWrap.style.opacity = '0';
    progressWrap.style.transition = 'opacity 0.4s ease';
    void progressWrap.offsetHeight;
    progressWrap.style.opacity = '1';
  }
  updateSimProgress(1);

  // Lock input, swap buttons
  input.disabled = true;
  document.getElementById('simulate-btn').style.display = 'none';
  document.getElementById('reset-btn').style.display    = 'inline-flex';
  document.getElementById('scroll-hint').style.display  = 'block';

  // Run each layer in sequence — 800ms delay between each reveal
  await showOSISection();
  await sleep(800);
  await simulateApplication();
  await sleep(800);
  await simulateTransport();
  await sleep(800);
  await simulateNetwork();
  await sleep(800);
  await simulateDataLink();
  await sleep(800);
  await simulatePhysical();
  await sleep(800);
  await simulateTransmission();
  await sleep(800);
  await simulateReceiver();
}

// ══════════════════════════════════════════════════════════
//  OSI MODEL OVERVIEW
// ══════════════════════════════════════════════════════════
async function showOSISection() {
  showSection('osi-model', 'rgba(0,212,255,0.18)');
  await sleep(400);
  scrollTo('osi-model');
  await sleep(600);
}

// ══════════════════════════════════════════════════════════
//  LAYER 1 — APPLICATION
// ══════════════════════════════════════════════════════════
async function simulateApplication() {
  setStepActive(1);
  updateSimProgress(1);
  highlightOSI(7);

  showSection('section-application', 'rgba(0,212,255,0.28)');
  await sleep(400);
  scrollTo('section-application');
  await sleep(500);

  const el   = document.getElementById('app-message');
  const curs = document.querySelector('.cursor');
  el.textContent = '';
  for (const ch of message) {
    el.textContent += ch;
    await sleep(55);
  }
  await sleep(800);
  curs.style.display = 'none';
  await sleep(600);
}

// ══════════════════════════════════════════════════════════
//  LAYER 2 — TRANSPORT (Segmentation + Encapsulation)
// ══════════════════════════════════════════════════════════
async function simulateTransport() {
  setStepActive(4);
  updateSimProgress(4);
  highlightOSI(4);

  segments = [];
  for (let i = 0; i < message.length; i += 3) {
    segments.push(message.substring(i, Math.min(i + 3, message.length)));
  }

  showSection('section-transport', 'rgba(255,204,0,0.22)');
  await sleep(400);
  scrollTo('section-transport');
  await sleep(500);

  const container = document.getElementById('segments-container');
  container.innerHTML = '';

  for (let i = 0; i < segments.length; i++) {
    const box = document.createElement('div');
    box.className = 'segment-box';
    box.innerHTML = `<span class="seg-label">SEG ${i + 1}</span>${segments[i]}`;
    container.appendChild(box);
    await sleep(180);
    box.classList.add('visible');
    // Glow burst on first appear
    box.style.boxShadow = '0 0 20px rgba(255,204,0,0.8), 0 0 40px rgba(255,204,0,0.3)';
    setTimeout(() => { box.style.boxShadow = ''; }, 550);
    await sleep(220);
  }
  await sleep(600);

  // Animate Encapsulation Diagram
  await animateEncapsulation();
}

// ── Encapsulation diagram animation ──────────────────────
async function animateEncapsulation() {
  const diagram = document.getElementById('encap-diagram');
  if (!diagram) return;

  diagram.style.display = 'block';
  diagram.style.opacity = '0';
  diagram.style.transition = 'opacity 0.5s ease';
  void diagram.offsetHeight;
  diagram.style.opacity = '1';

  await sleep(500);

  // Reveal each layer wrapper with a slide animation
  const wrappers = [
    { id: 'encap-tcp'    },
    { id: 'encap-ip'     },
    { id: 'encap-frame'  },
    { id: 'encap-binary' },
  ];

  for (const w of wrappers) {
    const el = document.getElementById(w.id);
    if (!el) continue;
    el.style.display = 'block';
    void el.offsetHeight; // reflow to trigger CSS transition
    el.style.opacity   = '1';
    el.style.transform = 'scaleX(1)';
    await sleep(600);
  }

  await sleep(800);
}

// ══════════════════════════════════════════════════════════
//  LAYER 3 — NETWORK (Packet Creation)
// ══════════════════════════════════════════════════════════
async function simulateNetwork() {
  setStepActive(5);
  updateSimProgress(5);
  highlightOSI(3);

  showSection('section-network', 'rgba(0,212,255,0.22)');
  await sleep(400);
  scrollTo('section-network');
  await sleep(500);

  const container = document.getElementById('packets-container');
  container.innerHTML = '';

  for (let i = 0; i < segments.length; i++) {
    const card = document.createElement('div');
    card.className = 'packet-card';
    card.innerHTML = `
      <div style="width:100%">
        <div class="packet-hdr">PACKET ${i + 1}</div>
        <div class="packet-field">
          <div class="pfield">
            <span class="pf-label">SOURCE</span>
            <span class="pf-val">Node A</span>
          </div>
          <div class="pfield">
            <span class="pf-label">DESTINATION</span>
            <span class="pf-val">Node B</span>
          </div>
          <div class="pfield">
            <span class="pf-label">SEQ</span>
            <span class="pf-val">${i + 1}/${segments.length}</span>
          </div>
          <div class="pfield">
            <span class="pf-label">DATA</span>
            <span class="pf-data">${escHtml(segments[i])}</span>
          </div>
        </div>
      </div>
    `;
    container.appendChild(card);
    await sleep(200);
    card.classList.add('visible');
    card.style.boxShadow = '0 0 22px rgba(0,212,255,0.55)';
    setTimeout(() => { card.style.boxShadow = ''; }, 550);
    await sleep(350);
  }
  await sleep(600);
}

// ══════════════════════════════════════════════════════════
//  LAYER 4 — DATA LINK (Frame Creation + CRC)
// ══════════════════════════════════════════════════════════
async function simulateDataLink() {
  setStepActive(6);
  updateSimProgress(6);
  highlightOSI(2);

  showSection('section-datalink', 'rgba(57,255,20,0.18)');
  await sleep(400);
  scrollTo('section-datalink');
  await sleep(500);

  const container = document.getElementById('frames-container');
  container.innerHTML = '';

  for (let i = 0; i < segments.length; i++) {
    const data = segments[i];
    const crc  = data.length % 2;

    const card = document.createElement('div');
    card.className = 'frame-card';
    card.innerHTML = `
      <div class="frame-part frame-header-part">
        <span class="fp-label">HEADER</span>
        <span class="fp-val">101010</span>
      </div>
      <div class="frame-part frame-data-part">
        <span class="fp-label">DATA (Frame ${i + 1})</span>
        <span class="fp-val">${escHtml(data)}</span>
      </div>
      <div class="frame-part frame-crc-part">
        <span class="fp-label">CRC</span>
        <span class="fp-val">${crc}</span>
      </div>
    `;
    container.appendChild(card);
    await sleep(200);
    card.classList.add('visible');
    card.style.boxShadow = '0 0 18px rgba(57,255,20,0.45)';
    setTimeout(() => { card.style.boxShadow = ''; }, 550);
    await sleep(380);
  }
  await sleep(600);
}

// ══════════════════════════════════════════════════════════
//  LAYER 5 — PHYSICAL (Binary Conversion)
// ══════════════════════════════════════════════════════════
async function simulatePhysical() {
  setStepActive(7);
  updateSimProgress(7);
  highlightOSI(1);

  showSection('section-physical', 'rgba(180,0,255,0.18)');
  await sleep(400);
  scrollTo('section-physical');
  await sleep(500);

  const binaryStream = document.getElementById('binary-stream');
  const charMap      = document.getElementById('char-binary-map');
  binaryStream.innerHTML = '';
  charMap.innerHTML      = '';

  for (const ch of message) {
    const binary = toBinary(ch);

    for (const bit of binary) {
      const span = document.createElement('span');
      span.className = 'bit-char';
      span.style.color = bit === '1' ? 'var(--accent-green)' : '#2a7a4a';
      span.textContent = bit;
      binaryStream.appendChild(span);
      await sleep(30);
    }
    const spacer = document.createElement('span');
    spacer.className = 'bit-space';
    binaryStream.appendChild(spacer);

    const block = document.createElement('div');
    block.className = 'char-bit-block';
    block.innerHTML = `
      <span class="char-label">${ch === ' ' ? '⎵' : escHtml(ch)}</span>
      <span class="char-bits">${binary}</span>
    `;
    charMap.appendChild(block);
    await sleep(40);
    block.classList.add('visible');
    await sleep(60);
  }

  await sleep(800);
}

// ══════════════════════════════════════════════════════════
//  LAYER 6 — NETWORK TRANSMISSION
// ══════════════════════════════════════════════════════════
async function simulateTransmission() {
  setStepActive(8);
  updateSimProgress(8);

  showSection('section-transmission', 'rgba(0,212,255,0.22)');
  await sleep(400);
  scrollTo('section-transmission');
  await sleep(600);

  const log = document.getElementById('transmission-log');
  log.innerHTML = '';

  for (let i = 0; i < segments.length; i++) {
    addLog(`\n══ Sending Packet ${i + 1}/${segments.length}: "${segments[i]}" ══`, 'log-info');
    await sleep(500);

    await animateHop('node-a', 'router-1', 'wire-1', i);
    addLog(`  Node A → Router 1`, 'log-hop');
    await sleep(700);

    if (rand(10) < 2) {
      addLog(`  ⚠ Packet LOST at Router 1!`, 'log-error');
      flashNode('router-1', 'error');
      await sleep(500);
      addLog(`  ↩ Retransmitting Packet ${i + 1}…`, 'log-warn');
      await sleep(900);
      await animateHop('node-a', 'router-1', 'wire-1', i);
      addLog(`  ✓ Packet resent successfully.`, 'log-success');
      await sleep(500);
    }

    await animateHop('router-1', 'router-2', 'wire-2', i);
    addLog(`  Router 1 → Router 2`, 'log-hop');
    await sleep(700);

    if (rand(10) < 3) {
      addLog(`  ✖ ERROR: Packet corrupted! CRC Check FAILED`, 'log-error');
      flashNode('router-2', 'error');
      await sleep(500);
      addLog(`  ↩ Retransmitting packet…`, 'log-warn');
      await sleep(900);
      await animateHop('router-1', 'router-2', 'wire-2', i);
      addLog(`  ✓ Packet retransmitted successfully.`, 'log-success');
      await sleep(500);
    }

    await animateHop('router-2', 'node-b', 'wire-3', i);
    addLog(`  Router 2 → Node B`, 'log-hop');
    await sleep(700);

    addLog(`  ✅ Packet ${i + 1} Delivered Successfully`, 'log-success');
    await sleep(300);
  }

  await sleep(600);
}

// ── Animate the packet "mover" dot across a wire ──────────
async function animateHop(fromId, toId, wireId, pkgIdx) {
  const fromEl  = document.getElementById(fromId);
  const toEl    = document.getElementById(toId);
  const wire    = document.getElementById(wireId);
  const mover   = document.getElementById('packet-mover');

  wire.classList.add('wire-active');
  fromEl.classList.add('active');

  const fromRect = fromEl.getBoundingClientRect();
  const toRect   = toEl.getBoundingClientRect();
  const cRect    = document.getElementById('section-transmission').querySelector('.layer-visual').getBoundingClientRect();

  mover.textContent       = `PKT${pkgIdx + 1}`;
  mover.style.display     = 'block';
  mover.style.left        = (fromRect.left - cRect.left + fromRect.width / 2) + 'px';
  mover.style.top         = (fromRect.top  - cRect.top  - 24) + 'px';
  mover.style.transition  = 'none';
  mover.style.opacity     = '1';

  await sleep(80);

  mover.style.transition = 'left 0.7s cubic-bezier(0.4,0,0.2,1)';
  mover.style.left       = (toRect.left - cRect.left + toRect.width / 2) + 'px';

  await sleep(750);

  mover.style.opacity = '0';
  wire.classList.remove('wire-active');
  fromEl.classList.remove('active');
  toEl.classList.add('active');
  await sleep(200);
  toEl.classList.remove('active');
  mover.style.display = 'none';
}

// ── Flash node on error ───────────────────────────────────
function flashNode(id, type) {
  const el = document.getElementById(id);
  el.style.filter = type === 'error'
    ? 'drop-shadow(0 0 12px var(--accent-red))'
    : 'drop-shadow(0 0 12px var(--accent-green))';
  setTimeout(() => { el.style.filter = ''; }, 800);
}

// ══════════════════════════════════════════════════════════
//  LAYER 7 — RECEIVER RECONSTRUCTION
// ══════════════════════════════════════════════════════════
async function simulateReceiver() {
  setStepActive(9);
  updateSimProgress(9);

  showSection('section-receiver', 'rgba(57,255,20,0.18)');
  await sleep(400);
  scrollTo('section-receiver');
  await sleep(500);

  const recvSegs  = document.getElementById('recv-segments');
  const joinArrow = document.getElementById('recv-join-arrow');
  const recvMsg   = document.getElementById('recv-message');
  recvSegs.innerHTML = '';

  for (let i = 0; i < segments.length; i++) {
    const box = document.createElement('div');
    box.className = 'recv-seg-box';
    box.textContent = segments[i];
    recvSegs.appendChild(box);
    await sleep(250);
    box.classList.add('visible');
    box.style.boxShadow = '0 0 16px rgba(57,255,20,0.65)';
    setTimeout(() => { box.style.boxShadow = ''; }, 550);
    await sleep(350);
  }

  await sleep(500);
  joinArrow.style.display = 'block';
  await sleep(900);

  recvMsg.textContent   = segments.join('');
  recvMsg.style.display = 'block';

  await sleep(1000);

  const conclusionDiv = document.getElementById('sim-conclusion');
  if (conclusionDiv) {
    const totalBits = message.length * 8;
    conclusionDiv.innerHTML = `🎉 <strong>Conclusion:</strong> The message "<em>${escHtml(message)}</em>" successfully traversed all 7 layers of the OSI model. It was divided into <strong>${segments.length} segments</strong> at the Transport layer, packetized at the Network layer, and framed at the Data Link layer. Finally, it was transmitted as <strong>${totalBits} raw binary bits</strong> over the Physical layer. Upon reaching the destination, the receiver successfully reconstructed the message from the physical signals back to the Application layer!`;
  }

  const complete = document.getElementById('sim-complete');
  complete.style.display = 'block';
  scrollTo('sim-complete');

  // All progress to 100%
  document.getElementById('progress-bar').style.width = '100%';
  const simBar = document.getElementById('sim-progress-bar');
  if (simBar) simBar.style.width = '100%';
  const layerLbl = document.getElementById('layer-counter-label');
  if (layerLbl) layerLbl.textContent = 'Complete! ✓';
  document.querySelectorAll('#layer-steps .step').forEach(el => {
    el.classList.remove('active');
    el.classList.add('done');
  });

  simActive = false;
}

// ══════════════════════════════════════════════════════════
//  RESET
// ══════════════════════════════════════════════════════════
function resetSimulation() {
  message     = '';
  segments    = [];
  simActive   = false;
  packetCount = 0;

  const input = document.getElementById('message-input');
  input.disabled = false;
  input.value    = '';
  input.focus();

  document.getElementById('simulate-btn').style.display = 'inline-flex';
  document.getElementById('reset-btn').style.display    = 'none';
  document.getElementById('scroll-hint').style.display  = 'none';

  clearSimulationUI();
}

function clearSimulationUI() {
  const progressWrap = document.getElementById('sim-progress-wrap');
  if (progressWrap) progressWrap.style.display = 'none';

  [
    'osi-model','section-application','section-transport',
    'section-network','section-datalink','section-physical',
    'section-transmission','section-receiver',
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display   = 'none';
      el.style.opacity   = '';
      el.style.transform = '';
    }
  });

  ['segments-container','packets-container','frames-container',
   'binary-stream','char-binary-map','transmission-log','recv-segments']
  .forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '';
  });

  document.getElementById('recv-join-arrow').style.display = 'none';
  document.getElementById('recv-message').style.display    = 'none';
  document.getElementById('recv-message').textContent      = '';
  document.getElementById('sim-complete').style.display    = 'none';

  // Reset encapsulation diagram
  const encapDiagram = document.getElementById('encap-diagram');
  if (encapDiagram) encapDiagram.style.display = 'none';
  ['encap-tcp','encap-ip','encap-frame','encap-binary'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display   = 'none';
      el.style.opacity   = '0';
      el.style.transform = 'scaleX(0.7)';
    }
  });

  const curs = document.querySelector('.cursor');
  if (curs) curs.style.display = '';

  document.querySelectorAll('.osi-layer').forEach(el => el.classList.remove('highlighted'));

  document.getElementById('progress-bar').style.width = '0%';
  const simBar = document.getElementById('sim-progress-bar');
  if (simBar) simBar.style.width = '0%';
  const layerLbl = document.getElementById('layer-counter-label');
  if (layerLbl) layerLbl.textContent = 'Layer 1 of 7';
  const pktBadge = document.getElementById('packet-badge');
  if (pktBadge) pktBadge.textContent = 'Packets: 0';

  document.querySelectorAll('#layer-steps .step').forEach(el => {
    el.classList.remove('active', 'done');
  });

  document.getElementById('hero').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function replaySimulation() {
  clearSimulationUI();
  document.getElementById('scroll-hint').style.display = 'block';
  
  const progressWrap = document.getElementById('sim-progress-wrap');
  if (progressWrap) {
    progressWrap.style.display = 'block';
    progressWrap.style.opacity = '1';
  }
  
  setTimeout(() => {
    simActive = true;
    updateSimProgress(1);
    
    (async () => {
      await showOSISection();
      await sleep(800);
      await simulateApplication();
      await sleep(800);
      await simulateTransport();
      await sleep(800);
      await simulateNetwork();
      await sleep(800);
      await simulateDataLink();
      await sleep(800);
      await simulatePhysical();
      await sleep(800);
      await simulateTransmission();
      await sleep(800);
      await simulateReceiver();
    })();
  }, 200);
}

// ── HTML escape helper ─────────────────────────────────────
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Enter key triggers simulation ─────────────────────────
document.getElementById('message-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !simActive) startSimulation();
});

// ── Make sidebar items show pointer cursor ─────────────────
document.querySelectorAll('#layer-steps .step').forEach(el => {
  el.style.cursor = 'pointer';
});

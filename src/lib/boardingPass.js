/* The Launchpad boarding pass, drawn on a canvas so it can be saved as a PNG.
   2000×760px: the pass on the left, a tear-off stub on the right. */
export const W = 2000, H = 760;
const STUB = 1480;          // x where the perforation runs
const C = {
  forest: '#023b2c', emerald: '#087a56', emerald2: '#10a273', mint: '#7fe0b5',
  paper: '#fafbf8', pale: '#e6f4ec', sage: '#93b8a6', sageL: '#cfe5d9', ink2: '#2e5747', ink3: '#5a7d6d',
};
const SERIF = 'Fraunces, Georgia, serif', SANS = 'Manrope, system-ui, sans-serif';

export const seatRow = (seat) => seat?.[0] || '';
export const seatNo = (seat) => +(seat || '').slice(1) || 0;
export const seatBlock = (seat) => (seatNo(seat) <= 10 ? 'Left' : 'Right');
export const ticketNo = (n) => (n ? `LP26-${String(n).padStart(4, '0')}` : 'LP26-····');

export async function loadPassFonts() {
  if (!document.fonts?.load) return;
  await Promise.all([
    document.fonts.load(`400 80px Fraunces`), document.fonts.load(`italic 400 80px Fraunces`),
    document.fonts.load(`500 20px Manrope`), document.fonts.load(`700 20px Manrope`),
  ]).catch(() => {});
}

function spaced(g, text, x, y, spacing, align = 'left') {
  // letter-spaced caps (canvas letterSpacing where supported, manual otherwise)
  if ('letterSpacing' in g) {
    g.letterSpacing = `${spacing}px`;
    g.textAlign = align;
    g.fillText(text, align === 'right' ? x + spacing : x, y);
    g.letterSpacing = '0px';
    return;
  }
  const w = [...text].reduce((s, ch) => s + g.measureText(ch).width + spacing, -spacing);
  let cx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x;
  g.textAlign = 'left';
  for (const ch of text) { g.fillText(ch, cx, y); cx += g.measureText(ch).width + spacing; }
}

// largest font size (down to min) that keeps the text inside maxW; ellipsis if still too long
function fit(g, text, font, size, maxW, min = 18) {
  let s = size;
  for (; s > min; s -= 2) { g.font = font(s); if (g.measureText(text).width <= maxW) return text; }
  g.font = font(min);
  let t = text;
  while (t.length > 1 && g.measureText(`${t}…`).width > maxW) t = t.slice(0, -1);
  return t === text ? t : `${t}…`;
}

function label(g, text, x, y, color = C.ink3) {
  g.font = `700 17px ${SANS}`; g.fillStyle = color;
  spaced(g, text.toUpperCase(), x, y, 3.4);
}

function value(g, text, x, y, maxW, size = 34, color = C.forest) {
  g.fillStyle = color; g.textAlign = 'left';
  const t = fit(g, text || '—', (s) => `500 ${s}px ${SANS}`, size, maxW);
  g.fillText(t, x, y);
}

// a decorative barcode, stable for each ticket
function barcode(g, seed, x, y, w, h, color) {
  let n = 0;
  for (const ch of seed) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => ((n = (n * 1664525 + 1013904223) >>> 0) / 4294967296);
  g.fillStyle = color;
  let cx = x;
  while (cx < x + w - 4) {
    const bw = 2 + Math.floor(rnd() * 3) * 2;
    if (cx + bw > x + w) break;
    g.fillRect(cx, y, bw, h);
    cx += bw + 3 + Math.floor(rnd() * 3) * 2;
  }
}

// a small rocket, pointing right
function rocket(g, x, y, s, color) {
  g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = color;
  g.beginPath(); g.moveTo(26, 0); g.quadraticCurveTo(14, -10, -6, -8); g.lineTo(-6, 8); g.quadraticCurveTo(14, 10, 26, 0); g.fill();
  g.beginPath(); g.moveTo(-2, -8); g.lineTo(-14, -16); g.lineTo(-8, -6); g.fill();
  g.beginPath(); g.moveTo(-2, 8); g.lineTo(-14, 16); g.lineTo(-8, 6); g.fill();
  g.globalAlpha = 0.6; g.beginPath(); g.moveTo(-8, -4); g.lineTo(-22, 0); g.lineTo(-8, 4); g.fill();
  g.restore();
}

/* t: { name, year, dept, section, seat, number }, ev: { summit, date, doors, venue } */
export function drawPass(canvas, t, ev) {
  canvas.width = W; canvas.height = H;
  const g = canvas.getContext('2d');
  // a soft green behind the card, so corners and notches never show as black in photo viewers
  g.fillStyle = C.pale; g.fillRect(0, 0, W, H);
  g.textBaseline = 'alphabetic';

  // card with rounded corners
  g.save();
  g.beginPath(); g.roundRect(0, 0, W, H, 40); g.clip();
  g.fillStyle = C.paper; g.fillRect(0, 0, W, H);

  // faint emerald wash and pattern on the pass body
  const wash = g.createLinearGradient(0, 0, STUB, H);
  wash.addColorStop(0, '#f3f9f5'); wash.addColorStop(1, C.paper);
  g.fillStyle = wash; g.fillRect(0, 150, STUB, H - 150);
  g.strokeStyle = 'rgba(8,122,86,.06)'; g.lineWidth = 2;
  for (let r = 120; r < 900; r += 60) { g.beginPath(); g.arc(STUB - 40, H + 60, r, Math.PI, Math.PI * 1.5); g.stroke(); }

  // header band
  g.fillStyle = C.forest; g.fillRect(0, 0, STUB, 150);
  g.fillStyle = C.paper; g.font = `400 70px ${SERIF}`; g.textAlign = 'left';
  spaced(g, 'LAUNCHPAD', 70, 100, 1);
  g.font = `700 20px ${SANS}`; g.fillStyle = C.mint;
  spaced(g, 'BOARDING PASS', STUB - 70, 70, 6, 'right');
  g.font = `500 18px ${SANS}`; g.fillStyle = C.sageL;
  spaced(g, (ev.summit || '').toUpperCase(), STUB - 70, 106, 2.2, 'right');

  // route: IDEA → LAUNCH
  label(g, 'From', 70, 222);
  g.fillStyle = C.forest; g.font = `400 104px ${SERIF}`; g.textAlign = 'left'; g.fillText('IDEA', 64, 320);
  label(g, 'To', 760, 222);
  g.font = `italic 400 104px ${SERIF}`; g.fillStyle = C.emerald; g.fillText('Launch', 754, 320);
  g.strokeStyle = C.emerald2; g.lineWidth = 3; g.setLineDash([2, 12]); g.lineCap = 'round';
  g.beginPath(); g.moveTo(380, 284); g.quadraticCurveTo(560, 214, 712, 284); g.stroke(); g.setLineDash([]);
  rocket(g, 556, 249, 1.5, C.emerald);

  // seat, big, on the pass
  g.fillStyle = C.pale; g.beginPath(); g.roundRect(1150, 186, 262, 168, 22); g.fill();
  label(g, 'Seat', 1176, 228, C.emerald);
  g.fillStyle = C.forest; g.font = `400 112px ${SERIF}`; g.textAlign = 'left';
  g.fillText(t.seat || '—', 1172, 330);

  // passenger
  g.strokeStyle = 'rgba(2,59,44,.12)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(70, 378); g.lineTo(STUB - 68, 378); g.stroke();
  label(g, 'Passenger', 70, 424);
  g.fillStyle = C.forest; g.textAlign = 'left';
  g.fillText(fit(g, t.name || 'Name', (s) => `400 ${s}px ${SERIF}`, 64, STUB - 140, 30), 68, 494);

  // details
  const col = [70, 300, 840, 1060];
  label(g, 'Year', col[0], 560); value(g, t.year, col[0], 604, 200);
  label(g, 'Department', col[1], 560); value(g, t.dept, col[1], 604, 510);
  label(g, 'Section', col[2], 560); value(g, t.section, col[2], 604, 190);
  label(g, 'Date', col[3], 560); value(g, ev.date, col[3], 604, 350);
  label(g, 'Doors', col[0], 652); value(g, ev.doors, col[0], 692, 200, 26, C.ink2);
  label(g, 'Venue', col[1], 652); value(g, ev.venue, col[1], 692, 510, 26, C.ink2);
  label(g, 'Block', col[2], 652); value(g, t.seat ? `${seatBlock(t.seat)} · Row ${seatRow(t.seat)}` : '—', col[2], 692, 200, 26, C.ink2);
  label(g, 'Ticket', col[3], 652); value(g, ticketNo(t.number), col[3], 692, 350, 26, C.ink2);

  // stub
  g.fillStyle = C.emerald; g.fillRect(STUB, 0, W - STUB, H);
  const glow = g.createRadialGradient(W - 60, 40, 10, W - 60, 40, 520);
  glow.addColorStop(0, 'rgba(127,224,181,.35)'); glow.addColorStop(1, 'rgba(127,224,181,0)');
  g.fillStyle = glow; g.fillRect(STUB, 0, W - STUB, H);
  const sx = STUB + 64;
  g.font = `700 18px ${SANS}`; g.fillStyle = C.mint; spaced(g, 'LAUNCHPAD · 2026', sx, 76, 4.5);
  label(g, 'Seat', sx, 168, C.sageL);
  g.fillStyle = C.paper; g.font = `400 168px ${SERIF}`; g.textAlign = 'left'; g.fillText(t.seat || '—', sx - 6, 318);
  g.font = `600 22px ${SANS}`; g.fillStyle = C.mint;
  spaced(g, t.seat ? `ROW ${seatRow(t.seat)} · ${seatBlock(t.seat).toUpperCase()} BLOCK` : 'CHOOSE A SEAT', sx, 362, 2.5);
  g.fillStyle = C.paper; g.textAlign = 'left';
  g.fillText(fit(g, t.name || 'Name', (s) => `500 ${s}px ${SANS}`, 32, W - sx - 64, 18), sx, 432);
  g.font = `500 22px ${SANS}`; g.fillStyle = C.sageL;
  g.fillText(fit(g, [t.year, t.dept, t.section].filter(Boolean).join(' · ') || '—', (s) => `500 ${s}px ${SANS}`, 22, W - sx - 64, 14), sx, 468);
  g.fillText(ev.date || '', sx, 502);
  g.fillStyle = C.paper; g.beginPath(); g.roundRect(sx, 548, W - sx - 64, 120, 12); g.fill();
  barcode(g, `${t.seat}${t.number}${t.name}`, sx + 18, 562, W - sx - 100, 74, C.forest);
  g.font = `600 15px ${SANS}`; g.fillStyle = C.forest; spaced(g, ticketNo(t.number), sx + 18, 658, 3);
  g.font = `500 15px ${SANS}`; g.fillStyle = C.sageL; spaced(g, 'ADMIT ONE', W - 64, 718, 3, 'right');

  // perforation: notches cut top and bottom, dashed tear line
  g.fillStyle = C.pale;
  g.beginPath(); g.arc(STUB, 0, 30, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(STUB, H, 30, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(250,251,248,.85)'; g.lineWidth = 3; g.setLineDash([10, 12]);
  g.beginPath(); g.moveTo(STUB, 44); g.lineTo(STUB, H - 44); g.stroke(); g.setLineDash([]);

  // footer line on the pass
  g.font = `500 16px ${SANS}`; g.fillStyle = C.ink3;
  spaced(g, 'ADMIT ONE · SEAT AS SHOWN · KEEP THIS PASS WITH YOU', 70, H - 24, 2.4);
  g.restore();
  return canvas;
}

export function downloadPass(canvas, t) {
  const safe = (t.name || 'pass').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'pass';
  return new Promise((done) => canvas.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Launchpad-${t.seat}-${safe}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    done();
  }, 'image/png'));
}

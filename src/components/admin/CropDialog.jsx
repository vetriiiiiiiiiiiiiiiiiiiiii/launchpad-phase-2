import { useEffect, useRef, useState } from 'react';

/* Crop to the slot's exact ratio, then compress.
   The frame is fixed at the slot's ratio; drag the photo to choose what's in
   it, zoom with the slider. "Apply" resizes to the slot's width (never
   upscaling) and encodes WebP at quality 0.82 (JPEG if the browser can't). */
export const fmt = (b) => (b > 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

async function compress(img, crop, outW, outH) {
  const c = document.createElement('canvas');
  c.width = outW; c.height = outH;
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, outW, outH);
  const blob = (t, q) => new Promise((r) => c.toBlob(r, t, q));
  let b = await blob('image/webp', 0.82);
  if (!b || b.type !== 'image/webp') b = await blob('image/jpeg', 0.85);
  return b;
}

export default function CropDialog({ file, ratio, maxW, label, onCancel, onDone }) {
  const [img, setImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 }); // image centre offset, in frame widths/heights
  const [busy, setBusy] = useState(false);
  const frame = useRef(null);
  const drag = useRef(null);
  const [rw, rh] = ratio;
  const R = rw / rh;

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // image size in frame units; at zoom 1 it just covers the frame
  const size = (z) => {
    const ir = img.naturalWidth / img.naturalHeight;
    return { w: (ir > R ? ir / R : 1) * z, h: (ir > R ? 1 : R / ir) * z };
  };
  const clampOff = (o, z = zoom) => {
    const { w, h } = size(z);
    const mx = (w - 1) / 2, my = (h - 1) / 2;
    return { x: Math.max(-mx, Math.min(mx, o.x)), y: Math.max(-my, Math.min(my, o.y)) };
  };

  const down = (e) => { drag.current = { x: e.clientX, y: e.clientY, o: off }; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e) => {
    if (!drag.current) return;
    const r = frame.current.getBoundingClientRect();
    setOff(clampOff({ x: drag.current.o.x + (e.clientX - drag.current.x) / r.width, y: drag.current.o.y + (e.clientY - drag.current.y) / r.height }));
  };
  const up = () => { drag.current = null; };

  if (!img) return null;
  const g = size(zoom);
  const pxW = img.naturalWidth / g.w, pxH = img.naturalHeight / g.h; // image pixels per frame width/height
  const crop = { w: pxW, h: pxH, x: (g.w / 2 - off.x - 0.5) * pxW, y: (g.h / 2 - off.y - 0.5) * pxH };
  const outW = Math.round(Math.min(maxW, crop.w));
  const outH = Math.round(outW / R);
  const small = crop.w < maxW * 0.6;

  const apply = async () => {
    setBusy(true);
    const blob = await compress(img, crop, outW, outH);
    onDone(blob, {
      from: { size: file.size, w: img.naturalWidth, h: img.naturalHeight },
      to: { size: blob.size, w: outW, h: outH, type: blob.type.split('/')[1].toUpperCase() },
    });
  };

  return (
    <div className="ad-modal" role="dialog" aria-modal="true" aria-label={`Fit photo for ${label}`}>
      <div className="ad-modal__card">
        <header>
          <h3>Fit the photo — {label}</h3>
          <p>This spot is <b>{rw}:{rh}</b> and will be saved at <b>{outW}×{outH}px</b>. Drag the photo to position it, zoom to tighten.</p>
        </header>
        <div className="ad-crop" ref={frame} style={{ aspectRatio: `${rw} / ${rh}` }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
          <img src={img.src} alt="" draggable="false" style={{
            width: `${g.w * 100}%`, height: `${g.h * 100}%`,
            left: `${(0.5 + off.x - g.w / 2) * 100}%`, top: `${(0.5 + off.y - g.h / 2) * 100}%`,
          }} />
          <i className="ad-crop__grid" aria-hidden="true" />
        </div>
        <label className="ad-zoom">
          <span>Zoom</span>
          <input type="range" min="1" max="3" step="0.01" value={zoom}
            onChange={(e) => { const z = +e.target.value; setZoom(z); setOff((o) => clampOff(o, z)); }} />
        </label>
        <p className="ad-est">
          Original {img.naturalWidth}×{img.naturalHeight}px · {fmt(file.size)} → compressed to {outW}×{outH}px WebP
          {small && <em> · This photo is small for this spot and may look soft; a larger original is better.</em>}
        </p>
        <div className="ad-row ad-row--end">
          <button type="button" className="ad-btn ad-btn--ghost" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className="ad-btn ad-btn--solid" onClick={apply} disabled={busy}>{busy ? 'Compressing…' : 'Crop, compress & upload'}</button>
        </div>
      </div>
    </div>
  );
}

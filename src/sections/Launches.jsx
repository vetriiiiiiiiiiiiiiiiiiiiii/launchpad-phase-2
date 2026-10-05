import { useEffect, useRef, useState } from 'react';
import Rv from '../components/Rv.jsx';
import Btn from '../components/Btn.jsx';
import Photo from '../components/Photo.jsx';
import StageCanvas from '../components/StageCanvas.jsx';
import { useScrollVars } from '../hooks/useScroll.js';
import { clamp, requestFrame } from '../lib/scroll.js';
import { P } from '../lib/images.js';

export function LaunchesIntro() {
  const thread = useRef(null);
  useScrollVars(thread, ({ y, vh, top }) => {
    thread.current.style.setProperty('--tp', clamp((y + vh * 0.85 - top) / (vh * 0.5)).toFixed(3));
  }, { vars: false });
  return (
    <section className="launches-intro is-light" data-tone="light" id="the-launches" data-folio="The Launches">
      <div className="launches-intro__inner">
        <p className="eyebrow" data-reveal>The centrepiece</p>
        <h2 className="launches-intro__title" data-reveal><Rv>One day.</Rv><Rv><em>Three launches.</em></Rv></h2>
        <p className="launches-intro__body" data-reveal>Three products. Three reveals. Each kept under wraps until its moment on stage — and each moment shared by everyone in the room.</p>
        <p className="launches-intro__seq" data-reveal aria-label="Idea, creation, launch"><span>Idea</span><i /><span>Creation</span><i /><span>Launch</span></p>
        <p className="launches-intro__more" data-reveal><Btn to="/launches" magnetic>Inside the launches</Btn></p>
      </div>
      <div className="thread thread--intro" ref={thread} aria-hidden="true"><span /></div>
    </section>
  );
}

/* Shared chapter shell: a tall section with a sticky stage; the WebGL cloth
   takes its lighting from scroll progress, and the thread lands on its peak. */
function useLaunch() {
  const ref = useRef(null), stage = useRef(null);
  const [ready, setReady] = useState(false);
  useScrollVars(ref, ({ p }) => {
    stage.current?.setProgress(p);
    if (ready) {
      const y = stage.current?.topY();
      if (y != null) ref.current.style.setProperty('--drop3d', `${Math.max(0, y - 3).toFixed(1)}px`);
    }
  });
  // once the cloth has settled, re-run a frame so the thread finds its peak immediately
  useEffect(() => { if (ready) requestAnimationFrame(() => requestFrame(true)); }, [ready]);
  return { ref, stage, ready, onReady: () => setReady(true) };
}

const Status = () => <><p className="launch__kind">Product Launch</p><p className="launch__status"><i />Coming soon</p></>;

export function LaunchOne() {
  const { ref, stage, ready, onReady } = useLaunch();
  return (
    <section className={`launch launch--one${ready ? ' has-3d' : ''}`} id="launch-1" ref={ref} data-folio="The First Reveal" aria-labelledby="l1-title">
      <div className="launch__sticky">
        <StageCanvas ref={stage} stageKey="one" onReady={onReady} />
        <div className="l1__cone" aria-hidden="true" />
        <div className="thread thread--drop" aria-hidden="true"><span /><b className="spark" /></div>
        <div className="product-slot l1__object" role="img" aria-label="Product one — to be revealed on 26 October 2026">
          <svg viewBox="0 0 400 500" className="veil">
            <use href="#shape-tall" fill="url(#litTop)" />
            <g clipPath="url(#clip-tall)">
              <use href="#folds" transform="translate(20 44) scale(3.6 4.3)" filter="url(#fold)" />
              <ellipse cx="200" cy="480" rx="220" ry="60" fill="#023b2c" opacity=".55" filter="url(#soft)" />
            </g>
          </svg>
          <div className="floor floor--dark" />
        </div>
        <div className="launch__text l1__text">
          <span className="launch__num">01</span>
          <h3 id="l1-title" className="launch__name"><Rv>The First</Rv><Rv><em>Reveal</em></Rv></h3>
          <Status />
        </div>
        <p className="launch__tag">Object 01 · Under wraps until 26.10.2026</p>
      </div>
    </section>
  );
}

export function LaunchTwo() {
  const { ref, stage, ready, onReady } = useLaunch();
  return (
    <section className={`launch launch--two${ready ? ' has-3d' : ''}`} data-tone="light" id="launch-2" ref={ref} data-folio="The Second Reveal" aria-labelledby="l2-title">
      <div className="launch__sticky">
        <StageCanvas ref={stage} stageKey="two" onReady={onReady} />
        <div className="l2__room" aria-hidden="true"><Photo id={P.whiteRibs} w={1800} sizes="100vw" /></div>
        <div className="l2__window" aria-hidden="true" />
        <div className="thread thread--drop thread--ink" aria-hidden="true"><span /><b className="spark" /></div>
        <div className="product-slot l2__object" role="img" aria-label="Product two — to be revealed on 26 October 2026">
          <svg viewBox="0 0 600 360" className="l2__shadow" aria-hidden="true"><use href="#shape-wide" fill="#023b2c" filter="url(#softer)" /></svg>
          <svg viewBox="0 0 600 360" className="veil">
            <use href="#shape-wide" fill="url(#litIvory)" />
            <g clipPath="url(#clip-wide)">
              <use href="#foldsLight" transform="translate(0 62) scale(6 2.75)" filter="url(#fold)" />
              <ellipse cx="300" cy="345" rx="320" ry="40" fill="#5a7d6d" opacity=".35" filter="url(#soft)" />
            </g>
          </svg>
          <div className="plinth" />
        </div>
        <div className="launch__text l2__text">
          <span className="launch__num">02</span>
          <h3 id="l2-title" className="launch__name"><Rv>The Second</Rv><Rv><em>Reveal</em></Rv></h3>
          <Status />
        </div>
        <p className="launch__tag">Object 02 · Under wraps until 26.10.2026</p>
      </div>
    </section>
  );
}

export function LaunchThree() {
  const { ref, stage, ready, onReady } = useLaunch();
  return (
    <section className={`launch launch--three${ready ? ' has-3d' : ''}`} id="launch-3" ref={ref} data-folio="The Final Reveal" aria-labelledby="l3-title">
      <div className="launch__sticky">
        <StageCanvas ref={stage} stageKey="three" onReady={onReady} />
        <p className="l3__hush" aria-hidden="true">And then the room goes quiet.</p>
        <div className="l3__word" aria-hidden="true"><span>03</span></div>
        <div className="l3__beam" aria-hidden="true" />
        <div className="thread thread--drop" aria-hidden="true"><span /><b className="spark" /></div>
        <div className="product-slot l3__object" role="img" aria-label="Product three — to be revealed on 26 October 2026">
          <svg viewBox="0 0 420 460" className="veil">
            <use href="#shape-peak" fill="url(#litSpot)" />
            <g clipPath="url(#clip-peak)">
              <use href="#folds" transform="translate(20 24) scale(3.8 3.9)" filter="url(#fold)" />
              <ellipse cx="210" cy="440" rx="230" ry="50" fill="#023b2c" opacity=".6" filter="url(#soft)" />
            </g>
          </svg>
          <div className="pedestal" />
          <div className="floor floor--spot" />
        </div>
        <h3 id="l3-title" className="l3__title" aria-label="03 — The Final Reveal"><Rv>The Final</Rv><Rv className="mask">Reveal</Rv></h3>
        <div className="l3__meta"><Status /></div>
      </div>
    </section>
  );
}

import { useEffect } from 'react';
import Hero from '../sections/Hero.jsx';
import Statement from '../sections/Statement.jsx';
import Inside from '../sections/Inside.jsx';
import Day from '../sections/Day.jsx';
import Talks from '../sections/Talks.jsx';
import Workshop from '../sections/Workshop.jsx';
import Pitch from '../sections/Pitch.jsx';
import { LaunchesIntro, LaunchOne, LaunchTwo, LaunchThree } from '../sections/Launches.jsx';
import { Builders, Conversation, Exhibition, Connection } from '../sections/People.jsx';
import { Marks, Finale } from '../sections/Closing.jsx';
import Fuse from '../components/Fuse.jsx';
import SvgDefs from '../components/SvgDefs.jsx';
import { useReveal } from '../hooks/useReveal.js';
import { useArrive } from '../hooks/useArrive.js';

export default function Home() {
  useReveal();
  useArrive();
  useEffect(() => { document.title = 'Launchpad — 26 October 2026'; }, []);
  return (
    <>
      <SvgDefs />
      <Fuse />
      <main>
        <Hero />
        <Statement />
        <Inside />
        <Day />
        <Talks />
        <Workshop />
        <Pitch />
        <LaunchesIntro />
        <LaunchOne />
        <LaunchTwo />
        <LaunchThree />
        <Builders />
        <Conversation />
        <Exhibition />
        <Connection />
        <Marks />
        <Finale />
      </main>
    </>
  );
}

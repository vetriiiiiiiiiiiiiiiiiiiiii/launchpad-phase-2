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
import Invitation from '../sections/Invitation.jsx';
import Facts from '../sections/Facts.jsx';
import Faq from '../sections/Faq.jsx';
import { useEventSeo } from '../hooks/useEventSeo.js';
import Fuse from '../components/Fuse.jsx';
import SvgDefs from '../components/SvgDefs.jsx';
import { useReveal } from '../hooks/useReveal.js';
import { useArrive } from '../hooks/useArrive.js';

export default function Home() {
  useReveal();
  useArrive();
  useEventSeo();
  return (
    <>
      <SvgDefs />
      <Fuse />
      <main>
        <Hero />
        <Facts />
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
        <Invitation />
        <Faq />
        <Marks />
        <Finale />
      </main>
    </>
  );
}

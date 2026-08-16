import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Keyboard, Virtual } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/virtual';
import './slideshow.css';

// Drop-in replacement for the old hand-rolled Switcher. Same props:
// image_ids, base_url, img_access_key, slide_len.
//
// Swiper handles what we were building by hand:
// - Autoplay module: the slide_len-based auto-advance timer.
// - EffectFade module: the crossfade, via CSS opacity transitions
//   Swiper manages itself (no custom keyframes/fill-mode footguns).
// - Navigation module: prev/next, including auto-hiding the arrow at
//   the first/last slide (via the swiper-button-disabled class).
// - Keyboard module: left/right arrow key navigation.
// - Virtual module: THIS IS THE FIX for a 200k+ image_ids array. We
//   still .map() over the full array below (Swiper's React
//   integration requires this), but with virtual+virtualIndex set,
//   Swiper only actually renders real DOM/image content for the
//   handful of slides near the current position - everything else
//   stays a lightweight placeholder. Without this, React/the browser
//   was trying to instantiate ~200,000 real <img> elements (each
//   triggering its own network request) in a single render, which is
//   what was actually causing the "hang" we spent so long chasing as
//   an async/setState bug - it was never a race condition, just a
//   genuinely enormous amount of synchronous work.
// Optional 5th prop: image_meta. A plain object keyed by image id,
// e.g. { 12345: { date: '2024-06-01', location: 'Yosemite, CA' } }.
// When an id has no entry (or image_meta isn't passed at all), no
// overlay renders - so this is a safe no-op until you have real
// date/location data wired up from wherever you decide to source it.
function Slideshow({ image_ids, base_url, img_access_key, slide_len, image_meta }) {
  const [isIdle, setIsIdle] = useState(false);
  const idleTimerRef = useRef(null);
  const prevElRef = useRef(null);
  const nextElRef = useRef(null);

  useEffect(() => {
    const resetIdleTimer = () => {
      setIsIdle(false);
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIsIdle(true), 10000);
    };

    window.addEventListener('mousemove', resetIdleTimer);
    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      clearTimeout(idleTimerRef.current);
    };
  }, []);

  if (!image_ids || image_ids.length === 0) return null;

  const buildUrl = (id) =>
    `${base_url}api/keyed_image/slideshow/?id=${id}&access_key=${img_access_key}`;

  return (
    <div className={`slideshow-wrapper ${isIdle ? 'idle-cursor' : ''}`}>
      <Swiper
        modules={[Autoplay, EffectFade, Navigation, Keyboard, Virtual]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={1200}
        autoplay={{
          delay: slide_len * 1000,
          disableOnInteraction: false,
        }}
        keyboard={{ enabled: true }}
        virtual
        navigation={{
          prevEl: prevElRef.current,
          nextEl: nextElRef.current,
        }}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = prevElRef.current;
          swiper.params.navigation.nextEl = nextElRef.current;
        }}
        className="slideshow-swiper"
      >
        {image_ids.map((id, i) => {
          const meta = image_meta && image_meta[id];
          return (
            <SwiperSlide key={id ?? i} virtualIndex={i}>
              <img className="slide-img" src={buildUrl(id)} alt="" />
              {meta && (meta.date || meta.location) && (
                <div className="slide-overlay">
                  {meta.location && <div className="slide-overlay-location">{meta.location}</div>}
                  {meta.date && <div className="slide-overlay-date">{meta.date}</div>}
                </div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>

      <div ref={prevElRef} className="nav-hit-area nav-left">
        <div className="nav-icon">&#10094;</div>
      </div>
      <div ref={nextElRef} className="nav-hit-area nav-right">
        <div className="nav-icon">&#10095;</div>
      </div>
    </div>
  );
}

export default Slideshow;
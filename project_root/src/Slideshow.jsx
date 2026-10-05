import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Keyboard } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import './slideshow.css';

// How many slides to keep loaded on EACH side of the current photo.
// A window of 2*BUFFER+1 slides is still trivially cheap for Swiper
// no matter how large your library is (21 slides vs. 200,000+), but
// wide enough that we very rarely need to shift the window at all -
// unlike a minimal 3-slide window, which needed a delicate "recenter"
// trick on literally every single transition.
const BUFFER = 10;

// Formats the ISO date string the backend sends in full_data (e.g.
// "2019-12-24T20:07:21+00:00") for on-screen display. Locale-dependent
// formatting is deliberately kept client-side rather than shipped
// pre-formatted from the backend.
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function formatDate(isoDate) {
  if (!isoDate) return null;
  const parsed = new Date(isoDate);
  if (isNaN(parsed)) return null;
  return dateFormatter.format(parsed);
}

function Slideshow({ image_ids, base_url, img_access_key, slide_len, image_meta }) {
  const total = image_ids ? image_ids.length : 0;

  const [isIdle, setIsIdle] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowStart, setWindowStart] = useState(0);
  const [windowEnd, setWindowEnd] = useState(total > 1 ? Math.min(BUFFER, total - 1) : 0);

  const idleTimerRef = useRef(null);
  const prevElRef = useRef(null);
  const nextElRef = useRef(null);
  const swiperRef = useRef(null);
  const pendingShiftRef = useRef(0);

  // "Latest value" ref, updated fresh on every render. The slide-
  // change handler below reads from THIS instead of closing over
  // windowStart directly - guaranteeing it always sees the current
  // value no matter when Swiper actually calls it, regardless of
  // whether Swiper's React wrapper rebinds the handler on every
  // render or only once at init.
  const latestRef = useRef();
  latestRef.current = { windowStart };

  useEffect(() => {
    const resetIdleTimer = () => {
      setIsIdle(false);
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => setIsIdle(true), 5000);
    };
    window.addEventListener('mousemove', resetIdleTimer);
    resetIdleTimer();
    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      clearTimeout(idleTimerRef.current);
    };
  }, []);

  const isFirst = currentIndex <= 0;
  // LOOPING: currentIndex no longer stops at total-1 - it keeps
  // counting up forever, and we map it back into the real photo
  // list with modulo when we actually build the window (see
  // windowIds below). So there's no real "last" slide anymore -
  // isLast now only means "there's nothing to loop to at all"
  // (an empty or single-image list), not "we hit the end."
  const isLast = total <= 1;

  // Explicitly toggle these via Swiper's instance properties rather
  // than trusting the declarative allowSlidePrev/allowSlideNext props
  // to be reactively re-applied after init. isFirst is true on the
  // very first render (allowSlidePrev starts false), while isLast
  // starts false (allowSlideNext starts true and never needed to
  // change until near the real end) - if the declarative prop isn't
  // actually watched reactively, that asymmetry would explain prev
  // staying permanently stuck while next never exposed the problem.
  useEffect(() => {
    if (!swiperRef.current) return;
    swiperRef.current.allowSlidePrev = !isFirst;
    swiperRef.current.allowSlideNext = !isLast;
    // Swiper's Navigation module keeps its own internal disabled/
    // enabled state on the nav buttons (separate from
    // allowSlidePrev/allowSlideNext), synced only on init and on
    // explicit update() calls - without this, the on-screen prev
    // button can stay stuck showing "disabled" even after
    // allowSlidePrev flips back to true, while keyboard nav (which
    // doesn't go through the button) works fine.
    if (swiperRef.current.navigation) {
      swiperRef.current.navigation.update();
    }
  }, [isFirst, isLast]);

  // Keep the loaded window covering [currentIndex - BUFFER, currentIndex + BUFFER].
  // Extending forward (appending to windowEnd) never disturbs any
  // existing slide's position, so it needs no special handling.
  // Extending backward (prepending, i.e. lowering windowStart) DOES
  // shift every already-loaded slide's position forward by however
  // many we just added - Swiper doesn't know that on its own, so we
  // record the CORRECT target position directly (computed from state
  // we already trust) rather than reading swiper.activeIndex, whose
  // value at read-time depends on uncertain ordering between our
  // effect and Swiper's own internal reaction to the children array
  // changing.
  //
  // LOOPING: desiredEnd is no longer clamped to total-1. currentIndex
  // and windowEnd are both logical, ever-increasing positions in an
  // unbounded sequence - "index 200,014" is a completely normal thing
  // to reach once you've looped around once. desiredStart is still
  // clamped at 0, since we deliberately do NOT loop backward past the
  // start.
  useEffect(() => {
    const desiredStart = Math.max(0, currentIndex - BUFFER);
    const desiredEnd = total > 1 ? currentIndex + BUFFER : currentIndex;

    if (desiredStart < windowStart) {
      console.log(
        `[Slideshow] PREPEND: windowStart ${windowStart} -> ${desiredStart} (currentIndex=${currentIndex})`
      );
      pendingShiftRef.current = currentIndex - desiredStart;
      setWindowStart(desiredStart);
    }
    if (desiredEnd > windowEnd) {
      console.log(
        `[Slideshow] APPEND: windowEnd ${windowEnd} -> ${desiredEnd} (currentIndex=${currentIndex})`
      );
      setWindowEnd(desiredEnd);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, total]);

  // After a backward extension actually lands in the DOM (windowStart
  // just decreased), jump Swiper directly to the known-correct target
  // position - with zero duration, so it's invisible.
  useEffect(() => {
    if (pendingShiftRef.current && swiperRef.current) {
      console.log(`[Slideshow] compensating slideTo(${pendingShiftRef.current}, 0)`);
      swiperRef.current.slideTo(pendingShiftRef.current, 0);
      pendingShiftRef.current = 0;
    }
  }, [windowStart]);

  if (!image_ids || image_ids.length === 0) return null;

  const buildUrl = (id) =>
    `${base_url}api/keyed_image/slideshow/?id=${id}&access_key=${img_access_key}`;

  // LOOPING: windowStart/windowEnd are logical positions in the
  // unbounded sequence, not real array indices - each one maps to
  // the actual photo via `% total`, wrapping back to the front of
  // your real library once we run past the end. This is the only
  // place the wraparound actually happens; everything else just
  // deals in logical indices same as before.
  const windowIds = [];
  for (let i = windowStart; i <= windowEnd; i++) {
    windowIds.push(image_ids[i % total]);
  }

  const handleTransitionEnd = (swiper) => {
    const { windowStart: ws } = latestRef.current;
    const newIndex = ws + swiper.activeIndex;

    console.log(
      `[Slideshow] transitionEnd: swiper.activeIndex=${swiper.activeIndex}, windowStart=${ws}, newIndex=${newIndex}`
    );

    setCurrentIndex(newIndex);

    // Restart autoplay's countdown from here, whether this transition
    // was manual (click/keyboard) or autoplay's own tick. Without
    // this, autoplay keeps ticking on a totally independent clock -
    // so a manual click partway through its current cycle could fire
    // again moments later, undoing what the user just did. This
    // guarantees a full slide_len of viewing time from whenever the
    // user actually arrives at a slide, regardless of how they got there.
    if (swiper.autoplay) {
      swiper.autoplay.stop();
      swiper.autoplay.start();
    }
  };

  return (
    <div className={`slideshow-wrapper ${isIdle ? 'idle-cursor' : ''}`}>
      <Swiper
        modules={[Autoplay, EffectFade, Navigation, Keyboard]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        speed={1200}
        initialSlide={currentIndex - windowStart}
        autoplay={{
          delay: slide_len * 1000,
          disableOnInteraction: false,
        }}
        keyboard={{ enabled: true }}
        allowSlidePrev={!isFirst}
        allowSlideNext={!isLast}
        navigation={{
          prevEl: prevElRef.current,
          nextEl: nextElRef.current,
        }}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = prevElRef.current;
          swiper.params.navigation.nextEl = nextElRef.current;
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChangeTransitionEnd={handleTransitionEnd}
        className="slideshow-swiper"
      >
        {windowIds.map((id, i) => {
          const meta = image_meta && image_meta[id];
          const formattedDate = meta && formatDate(meta.date);
          return (
            // Keyed by absolute logical position (windowStart + i),
            // which stays stable and unique even across loops of the
            // real photo list, since it just keeps counting up.
            <SwiperSlide key={windowStart + i}>
              <img className="slide-img" src={buildUrl(id)} alt="" />
              {meta && (formattedDate || meta.location) && (
                <div className="slide-overlay">
                  {meta.location && <div className="slide-overlay-location">{meta.location}</div>}
                  {formattedDate && <div className="slide-overlay-date">{formattedDate}</div>}
                </div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Always rendered (not conditionally mounted) so prevElRef/
          nextElRef are already populated by the time onBeforeInit
          runs Swiper's navigation setup - conditionally mounting
          based on isFirst meant prevElRef.current was ALWAYS null at
          that exact moment (isFirst is true on the very first
          render, by definition), permanently wiring prevEl to null.
          Visibility is now handled purely by CSS. */}
      <div
        ref={prevElRef}
        className={`nav-hit-area nav-left ${isFirst ? 'nav-hidden' : ''}`}
      >
        <div className="nav-icon">&#10094;</div>
      </div>
      <div
        ref={nextElRef}
        className={`nav-hit-area nav-right ${isLast ? 'nav-hidden' : ''}`}
      >
        <div className="nav-icon">&#10095;</div>
      </div>
    </div>
  );
}

export default Slideshow;
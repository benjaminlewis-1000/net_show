import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade, Navigation, Keyboard } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';

// TEST 1: does a plain, synchronous setState work at all in this
// environment (this React version + this Vite setup)?
class SyncCounter extends React.Component {
  state = { count: 0 };
  render() {
    return (
      <div style={{ padding: 20, color: 'white', borderBottom: '1px solid #444' }}>
        <h2>Test 1: Synchronous setState</h2>
        <p>Count: {this.state.count}</p>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          Click me
        </button>
        <p style={{ opacity: 0.7 }}>Expected: count increments immediately on click.</p>
      </div>
    );
  }
}

// TEST 2: setState called from inside a chained async .then(), with a
// commit callback - deliberately mirrors the EXACT shape of App's real
// bug (getList().then() -> getAccessKey().then() -> setState with a
// callback), but with zero axios/API/env-var involvement. A fake
// network delay via setTimeout stands in for the real API calls.
class AsyncCounter extends React.Component {
  state = { count: 0, status: 'idle' };

  runAsyncChain = () => {
    this.setState({ status: 'fetching...' });
    new Promise((resolve) => setTimeout(() => resolve(42), 500))
      .then((value) => {
        console.log('[AsyncCounter] got value, about to setState:', value);
        this.setState(
          { count: value, status: 'done' },
          () => {
            console.log('[AsyncCounter] setState commit callback FIRED. state:', this.state);
          }
        );
        console.log('[AsyncCounter] setState call returned (sync completion)');
      });
  };

  render() {
    return (
      <div style={{ padding: 20, color: 'white', borderBottom: '1px solid #444' }}>
        <h2>Test 2: Async setState (mirrors the real bug's shape)</h2>
        <p>Count: {this.state.count} ({this.state.status})</p>
        <button onClick={this.runAsyncChain}>Click me</button>
        <p style={{ opacity: 0.7 }}>
          Expected: after ~500ms, count becomes 42, status becomes "done", AND
          the console shows "setState commit callback FIRED". If the callback
          never fires here, we've reproduced the bug with zero app-specific
          code involved - meaning it's environmental, not about axios/API keys.
        </p>
      </div>
    );
  }
}

// TEST 3: Swiper rendering known-good public images - no axios, no API
// key, no App state chain at all. Isolates whether Swiper itself
// works in this environment independent of everything else.
function StaticSlideshow() {
  const ids = [237, 433, 111, 1084, 96];
  return (
    <div style={{ padding: 20, color: 'white' }}>
      <h2>Test 3: Swiper with static public images</h2>
      <p style={{ opacity: 0.7 }}>Expected: 5 photos crossfade automatically, arrows work.</p>
      <div style={{ width: '100%', maxWidth: 800, height: '50vh', background: '#000' }}>
        <Swiper
          modules={[Autoplay, EffectFade, Navigation, Keyboard]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={1200}
          autoplay={{ delay: 3000 }}
          navigation
          style={{ width: '100%', height: '100%' }}
        >
          {ids.map((id) => (
            <SwiperSlide key={id}>
              <img
                src={`https://picsum.photos/id/${id}/1200/800`}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
}

export default function Playground() {
  return (
    <div style={{ background: '#111', minHeight: '100vh' }}>
      <h1 style={{ color: 'white', padding: 20 }}>Diagnostic Playground</h1>
      <SyncCounter />
      <AsyncCounter />
      <StaticSlideshow />
    </div>
  );
}
(() => {
  const background = document.querySelector('.hero-video');
  const clips = [...document.querySelectorAll('.hero-video-clip')];
  if (!background || clips.length !== 2) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    clips.forEach((clip) => {
      clip.pause();
      clip.removeAttribute('autoplay');
      clip.preload = 'none';
    });
    return;
  }

  const displayTime = 12000;
  const fadeTime = 1100;
  let active = 0;
  let started = false;
  let tryingSecond = false;
  let changing = false;
  let nextTimer;
  let initialTimer;

  function scheduleNext() {
    clearTimeout(nextTimer);
    nextTimer = setTimeout(switchClip, displayTime);
  }

  function showFirstPlaying(index) {
    if (started) return;
    started = true;
    clearTimeout(initialTimer);
    active = index;
    clips.forEach((clip, clipIndex) => clip.classList.toggle('is-active', clipIndex === index));
    background.classList.add('is-playing');
    scheduleNext();
  }

  function trySecondClip() {
    if (started || tryingSecond) return;
    tryingSecond = true;
    clips[0].pause();
    const playback = clips[1].play();
    if (playback?.catch) playback.catch(() => {});
  }

  function switchClip() {
    if (!started || changing) return;
    changing = true;
    clearTimeout(nextTimer);
    const previous = clips[active];
    const nextIndex = (active + 1) % clips.length;
    const upcoming = clips[nextIndex];
    let settled = false;
    let timeout;

    function finish(success) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      upcoming.removeEventListener('playing', onPlaying);
      upcoming.removeEventListener('error', onError);
      if (success) {
        upcoming.classList.add('is-active');
        previous.classList.remove('is-active');
        active = nextIndex;
        background.classList.add('is-playing');
        setTimeout(() => previous.pause(), fadeTime);
      } else {
        upcoming.pause();
        if (previous.error) background.classList.remove('is-playing');
      }
      changing = false;
      scheduleNext();
    }

    function onPlaying() { finish(true); }
    function onError() { finish(false); }

    upcoming.addEventListener('playing', onPlaying);
    upcoming.addEventListener('error', onError);
    timeout = setTimeout(() => finish(false), 10000);
    try { upcoming.currentTime = 0; } catch { /* Play from the available position. */ }
    const playback = upcoming.play();
    if (playback?.catch) playback.catch(() => finish(false));
  }

  clips[0].addEventListener('playing', () => showFirstPlaying(0), { once: true });
  clips[1].addEventListener('playing', () => showFirstPlaying(1), { once: true });
  clips[0].addEventListener('error', trySecondClip, { once: true });
  clips.forEach((clip, index) => clip.addEventListener('error', () => {
    if (started && active === index) {
      background.classList.remove('is-playing');
      switchClip();
    }
  }));

  initialTimer = setTimeout(trySecondClip, 10000);
  if (!clips[0].paused && clips[0].readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) showFirstPlaying(0);
  const playback = clips[0].play();
  if (playback?.catch) playback.catch(trySecondClip);
})();

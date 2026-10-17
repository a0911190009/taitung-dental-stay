/**
 * TAITUNG DENTAL STAY - EDITORIAL MAGAZINE JS ENGINE
 * Features:
 * - Sync with MiniMax TTS narration with auto-turn
 * - VisualViewport 100svh safe area calculation
 * - Zero vertical scroll fitting (fitSlide / fitAll)
 * - Page-curl folded corner with wiggle animation
 * - Touch swipe, keyboard, click navigation
 * - Dynamic finger prompt during narration
 * - Cache-busting version parameter (?v=...)
 */

(function () {
  'use strict';

  const VERSION = '20261017_1200';
  const TOTAL_PAGES = 9;

  let currentIndex = 0;
  let isStarted = false;
  let isPaused = false;
  let isMuted = false;
  let isAnimating = false;

  let audio = new Audio();
  audio.preload = 'auto';

  let advanceTimer = null;
  let fingerTimer = null;

  // DOM Elements
  const app = document.getElementById('app');
  const stage = document.getElementById('stage');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const pageNoEl = document.getElementById('pageNo');
  const dots = Array.from(document.querySelectorAll('.dot'));
  const btnBack = document.getElementById('btnBack');
  const pageCurl = document.getElementById('pageCurl');
  const btnPause = document.getElementById('btnPause');
  const btnReplay = document.getElementById('btnReplay');
  const btnMute = document.getElementById('btnMute');
  const btnStart = document.getElementById('btnStart');
  const pcLeft = document.getElementById('pcLeft');
  const pcRight = document.getElementById('pcRight');

  // --------------------------------------------------------------------------
  // 1. Viewport & Fitting (Fix iPhone Chrome address bar & Zero Scroll)
  // --------------------------------------------------------------------------
  function setAppH() {
    const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-h', h + 'px');
    fitAll();
  }

  function fitSlide(slide) {
    if (!slide) return;
    const inner = slide.querySelector('.inner');
    if (!inner) return;

    // Reset zoom first
    inner.style.zoom = '1';

    const maxHeight = slide.clientHeight - 4;
    let currentHeight = inner.offsetHeight || inner.getBoundingClientRect().height;

    let z = 1.0;
    while ((currentHeight > maxHeight || slide.scrollHeight > slide.clientHeight) && z > 0.6) {
      z -= 0.02;
      inner.style.zoom = z.toFixed(2);
      currentHeight = (inner.offsetHeight || inner.getBoundingClientRect().height) * z;
    }
  }

  function fitAll() {
    slides.forEach(slide => {
      // Temporarily make slide measurable if hidden
      const isVisible = slide.classList.contains('active');
      if (!isVisible) {
        slide.style.visibility = 'hidden';
        slide.style.display = 'flex';
      }
      fitSlide(slide);
      if (!isVisible) {
        slide.style.display = '';
        slide.style.visibility = '';
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. Audio & Narration Management
  // --------------------------------------------------------------------------
  function getAudioUrl(index) {
    const pad = String(index + 1).padStart(2, '0');
    return `audio/p${pad}.mp3?v=${VERSION}`;
  }

  function clearAllTimers() {
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    if (fingerTimer) {
      clearTimeout(fingerTimer);
      fingerTimer = null;
    }
  }

  function resetFingerHints() {
    document.querySelectorAll('.finger-hint').forEach(el => el.classList.remove('active'));
  }

  function triggerFingerHint(slideIndex) {
    resetFingerHints();
    const currentSlide = slides[slideIndex];
    if (!currentSlide) return;

    const finger = currentSlide.querySelector('.finger-hint');
    if (!finger) return;

    // Page 1 finger is active immediately if not started
    if (slideIndex === 0) {
      if (!isStarted) finger.classList.add('active');
      return;
    }

    // For other pages, show finger when narrator introduces the buttons (~3.5s in)
    fingerTimer = setTimeout(() => {
      if (currentIndex === slideIndex && !isPaused) {
        finger.classList.add('active');
      }
    }, 3800);
  }

  function playAudioFor(index) {
    clearAllTimers();
    resetFingerHints();
    triggerFingerHint(index);

    if (!isStarted || isPaused) return;

    const url = getAudioUrl(index);
    audio.src = url;
    audio.muted = isMuted;
    audio.currentTime = 0;

    audio.play().catch(err => {
      console.warn('Audio playback prevented or error:', err);
      // If playback fails or is blocked, still gracefully trigger afterClip
      scheduleAutoAdvance();
    });

    // Preload next audio
    if (index + 1 < TOTAL_PAGES) {
      const nextAudio = new Audio(getAudioUrl(index + 1));
      nextAudio.preload = 'auto';
    }
  }

  function scheduleAutoAdvance() {
    clearAllTimers();
    // Don't auto-advance on the last page (Cover Back)
    if (currentIndex >= TOTAL_PAGES - 1) return;
    if (!isStarted || isPaused) return;

    advanceTimer = setTimeout(() => {
      if (!isPaused && currentIndex < TOTAL_PAGES - 1) {
        goTo(currentIndex + 1, 1);
      }
    }, 1200);
  }

  audio.addEventListener('ended', () => {
    scheduleAutoAdvance();
  });

  audio.addEventListener('error', () => {
    scheduleAutoAdvance();
  });

  // --------------------------------------------------------------------------
  // 3. Navigation & Slide Transition
  // --------------------------------------------------------------------------
  function updateUI() {
    // Update Page Number (e.g. "01 / 09")
    if (pageNoEl) {
      pageNoEl.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(TOTAL_PAGES).padStart(2, '0')}`;
    }

    // Update Dots
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });

    // Back Button
    if (btnBack) {
      btnBack.disabled = currentIndex === 0;
      btnBack.classList.toggle('hidden', currentIndex === 0);
    }

    // Page Curl (hide on last slide)
    if (pageCurl) {
      pageCurl.classList.toggle('hidden', currentIndex === TOTAL_PAGES - 1);
    }

    // PC Nav Arrows
    if (pcLeft) pcLeft.style.visibility = currentIndex === 0 ? 'hidden' : 'visible';
    if (pcRight) pcRight.style.visibility = currentIndex === TOTAL_PAGES - 1 ? 'hidden' : 'visible';
  }

  function goTo(targetIndex, dir = 1) {
    if (isAnimating || targetIndex === currentIndex) return;
    if (targetIndex < 0 || targetIndex >= TOTAL_PAGES) return;

    isAnimating = true;
    clearAllTimers();

    const outgoing = slides[currentIndex];
    const incoming = slides[targetIndex];

    const outClass = dir > 0 ? 'out-next' : 'out-prev';
    const inClass = dir > 0 ? 'in-next' : 'in-prev';

    // Cleanup previous classes
    slides.forEach(s => s.classList.remove('out-next', 'out-prev', 'in-next', 'in-prev'));

    incoming.classList.add('active', inClass);
    outgoing.classList.add(outClass);

    currentIndex = targetIndex;
    updateUI();
    fitSlide(incoming);

    setTimeout(() => {
      outgoing.classList.remove('active', outClass);
      incoming.classList.remove(inClass);
      isAnimating = false;
      fitSlide(incoming);
      playAudioFor(currentIndex);
    }, 600);
  }

  function next() {
    if (currentIndex < TOTAL_PAGES - 1) {
      goTo(currentIndex + 1, 1);
    }
  }

  function prev() {
    if (currentIndex > 0) {
      goTo(currentIndex - 1, -1);
    }
  }

  // --------------------------------------------------------------------------
  // 4. Start & Controls Handling
  // --------------------------------------------------------------------------
  function startReading() {
    isStarted = true;
    isPaused = false;
    if (btnPause) btnPause.textContent = '⏸';
    if (btnStart) {
      btnStart.innerHTML = '<span>▶ 導覽播放中…</span>';
      btnStart.style.opacity = '0.9';
    }
    resetFingerHints();
    playAudioFor(currentIndex);
  }

  if (btnStart) {
    btnStart.addEventListener('click', () => {
      startReading();
    });
  }

  if (btnPause) {
    btnPause.addEventListener('click', () => {
      if (!isStarted) {
        startReading();
        return;
      }
      isPaused = !isPaused;
      if (isPaused) {
        audio.pause();
        clearAllTimers();
        btnPause.textContent = '▶';
      } else {
        btnPause.textContent = '⏸';
        if (audio.src && audio.currentTime > 0 && !audio.ended) {
          audio.play();
        } else {
          playAudioFor(currentIndex);
        }
      }
    });
  }

  if (btnReplay) {
    btnReplay.addEventListener('click', () => {
      if (!isStarted) isStarted = true;
      isPaused = false;
      if (btnPause) btnPause.textContent = '⏸';
      playAudioFor(currentIndex);
    });
  }

  if (btnMute) {
    btnMute.addEventListener('click', () => {
      isMuted = !isMuted;
      audio.muted = isMuted;
      btnMute.textContent = isMuted ? '🔇' : '🔊';
    });
  }

  if (btnBack) {
    btnBack.addEventListener('click', () => prev());
  }

  if (pageCurl) {
    pageCurl.addEventListener('click', () => {
      if (!isStarted) startReading();
      next();
    });
  }

  if (pcLeft) pcLeft.addEventListener('click', () => prev());
  if (pcRight) pcRight.addEventListener('click', () => {
    if (!isStarted) startReading();
    next();
  });

  // Dots navigation
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      if (!isStarted) isStarted = true;
      goTo(idx, idx > currentIndex ? 1 : -1);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Gestures & Keyboard
  // --------------------------------------------------------------------------
  let touchStartX = 0;
  let touchStartY = 0;

  stage.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;

    if (Math.abs(dx) > 45 && Math.abs(dx) > 1.3 * Math.abs(dy)) {
      if (dx < 0) {
        if (!isStarted) startReading();
        next();
      } else {
        prev();
      }
    }
  }, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      if (!isStarted) startReading();
      next();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      prev();
    } else if (e.key === ' ') {
      e.preventDefault();
      if (btnPause) btnPause.click();
    }
  });

  // Restart buttons on end slide
  document.querySelectorAll('.btn-restart').forEach(btn => {
    btn.addEventListener('click', () => {
      goTo(0, -1);
      if (isStarted && !isPaused) playAudioFor(0);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Lifecycle & Resize Listeners
  // --------------------------------------------------------------------------
  window.addEventListener('resize', setAppH);
  window.addEventListener('orientationchange', setAppH);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setAppH);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !isPaused && isStarted) {
      audio.pause();
    } else if (!document.hidden && !isPaused && isStarted) {
      if (audio.src && audio.currentTime > 0 && !audio.ended) {
        audio.play().catch(() => {});
      }
    }
  });

  document.addEventListener('DOMContentLoaded', () => {
    setAppH();
    updateUI();
    // Prompt finger on cover initially
    const coverFinger = slides[0].querySelector('.finger-hint');
    if (coverFinger) coverFinger.classList.add('active');
  });

  window.addEventListener('load', () => {
    setAppH();
  });

})();

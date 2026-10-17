/**
 * TAITUNG DENTAL STAY - VOGUE & KINFOLK MAGAZINE ENGINE (Task 8 Upgrade)
 * - Desktop (>=1024px): 2-page spread (Left + Right), 3D book page-flip animation,
 *   sequential narration of Left page then Right page before auto-flipping spread.
 * - Mobile (<1024px): Single-page view, touch swipe & page-curl flip, page-by-page TTS.
 * - Preserves: All hotel info, Booking & route buttons, cover start & volume notice,
 *   wiggling finger hint (👉), folded corner page-curl, play/pause/mute/replay,
 *   100dvh + safe-area, cache-busting ?v= parameter.
 */

(function () {
  'use strict';

  const VERSION = '20261017_1415';
  const TOTAL_PAGES = 10;

  // currentIndex is 0..9. On desktop spread mode (>=1024px), spreadLeftIndex is always even (0, 2, 4, 6, 8)
  // while activeAudioIndex tracks which specific page (0..9) is currently being narrated.
  let currentIndex = 0;
  let activeAudioIndex = 0;
  let isStarted = false;
  let isPaused = false;
  let isMuted = false;
  let isAnimating = false;

  const audio = new Audio();
  audio.preload = 'auto';

  let advanceTimer = null;
  let fingerTimer = null;

  // DOM Elements
  const stage = document.getElementById('stage');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const pageNoEl = document.getElementById('pageNo');
  const audioStatusEl = document.getElementById('audioStatus');
  const dots = Array.from(document.querySelectorAll('.dot'));
  const btnBack = document.getElementById('btnBack');
  const pageCurl = document.getElementById('pageCurl');
  const btnPause = document.getElementById('btnPause');
  const btnReplay = document.getElementById('btnReplay');
  const btnMute = document.getElementById('btnMute');
  const btnStart = document.getElementById('btnStart');
  const pcLeft = document.getElementById('pcLeft');
  const pcRight = document.getElementById('pcRight');

  function isSpreadMode() {
    return window.innerWidth >= 1024;
  }

  function getSpreadLeft(idx) {
    return Math.floor(idx / 2) * 2;
  }

  // --------------------------------------------------------------------------
  // 1. Viewport Height & Zero-Scroll Safety Fit
  // --------------------------------------------------------------------------
  function setAppH() {
    const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-h', h + 'px');
    syncSlideVisibility();
    fitVisibleSlides();
    updateUI();
  }

  function fitSlide(slide) {
    if (!slide) return;
    const inner = slide.querySelector('.inner');
    if (!inner) return;
    inner.style.zoom = '1';

    const availH = slide.clientHeight - 10;
    if (availH <= 0) return;

    let z = 1.0;
    while (inner.scrollHeight > availH && z > 0.78) {
      z -= 0.02;
      inner.style.zoom = z.toFixed(2);
    }
  }

  function fitVisibleSlides() {
    slides.forEach(s => {
      if (
        s.classList.contains('active') ||
        s.classList.contains('spread-left') ||
        s.classList.contains('spread-right')
      ) {
        fitSlide(s);
      }
    });
  }

  // --------------------------------------------------------------------------
  // 2. Visibility & UI State Synchronization
  // --------------------------------------------------------------------------
  function syncSlideVisibility() {
    const spread = isSpreadMode();
    const leftIdx = getSpreadLeft(currentIndex);
    const rightIdx = leftIdx + 1;

    slides.forEach((s, idx) => {
      s.classList.remove(
        'active',
        'spread-left',
        'spread-right',
        'reading-focus',
        'out-next',
        'in-next',
        'out-prev',
        'in-prev',
        'spread-flip-out-right',
        'spread-flip-out-left',
        'spread-fade-in'
      );

      if (spread) {
        if (idx === leftIdx) s.classList.add('spread-left');
        if (idx === rightIdx) s.classList.add('spread-right');
        if (isStarted && idx === activeAudioIndex) {
          s.classList.add('reading-focus');
        }
      } else {
        if (idx === currentIndex) {
          s.classList.add('active');
        }
      }
    });
  }

  function updateUI() {
    const spread = isSpreadMode();
    const leftIdx = getSpreadLeft(currentIndex);
    const rightIdx = Math.min(leftIdx + 1, TOTAL_PAGES - 1);

    if (pageNoEl) {
      if (spread) {
        const lStr = String(leftIdx + 1).padStart(2, '0');
        const rStr = String(rightIdx + 1).padStart(2, '0');
        pageNoEl.textContent = `${lStr}–${rStr} / ${TOTAL_PAGES}`;
      } else {
        pageNoEl.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${TOTAL_PAGES}`;
      }
    }

    if (audioStatusEl) {
      if (!isStarted) {
        audioStatusEl.textContent = '點擊封面開始語音導覽';
      } else if (isPaused) {
        audioStatusEl.textContent = `已暫停（第 ${activeAudioIndex + 1} 頁）`;
      } else {
        audioStatusEl.textContent = `🔊 正在朗讀第 ${activeAudioIndex + 1} 頁`;
      }
    }

    dots.forEach((dot, idx) => {
      if (spread) {
        dot.classList.toggle('active', idx === leftIdx || idx === rightIdx);
      } else {
        dot.classList.toggle('active', idx === currentIndex);
      }
    });

    const atStart = spread ? leftIdx === 0 : currentIndex === 0;
    const atEnd = spread ? rightIdx >= TOTAL_PAGES - 1 : currentIndex >= TOTAL_PAGES - 1;

    if (btnBack) {
      btnBack.disabled = atStart;
      btnBack.classList.toggle('hidden', atStart);
    }
    if (pageCurl) {
      pageCurl.classList.toggle('hidden', atEnd);
    }
    if (pcLeft) pcLeft.style.visibility = atStart ? 'hidden' : 'visible';
    if (pcRight) pcRight.style.visibility = atEnd ? 'hidden' : 'visible';
  }

  // --------------------------------------------------------------------------
  // 3. Audio Narration & Auto-Advance (Single Page & 2-Page Spread)
  // --------------------------------------------------------------------------
  function getAudioUrl(pageIndex) {
    const pad = String(pageIndex + 1).padStart(2, '0');
    return `audio/p${pad}.mp3?v=${VERSION}`;
  }

  function clearTimers() {
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

  function scheduleFingerHint(pageIndex) {
    resetFingerHints();
    const slide = slides[pageIndex];
    if (!slide) return;
    const finger = slide.querySelector('.finger-hint');
    if (!finger) return;

    if (pageIndex === 0 && !isStarted) {
      finger.classList.add('active');
      return;
    }

    fingerTimer = setTimeout(() => {
      if (activeAudioIndex === pageIndex && !isPaused) {
        finger.classList.add('active');
      }
    }, 3200);
  }

  function playAudioForPage(pageIndex) {
    clearTimers();
    activeAudioIndex = pageIndex;

    if (isSpreadMode()) {
      slides.forEach((s, idx) => {
        s.classList.toggle('reading-focus', isStarted && idx === activeAudioIndex);
      });
    }
    updateUI();
    scheduleFingerHint(pageIndex);

    if (!isStarted || isPaused) return;

    audio.src = getAudioUrl(pageIndex);
    audio.muted = isMuted;
    audio.currentTime = 0;

    audio.play().catch(() => {
      handleAudioEnded();
    });

    if (pageIndex + 1 < TOTAL_PAGES) {
      const preloadAudio = new Audio(getAudioUrl(pageIndex + 1));
      preloadAudio.preload = 'auto';
    }
  }

  function handleAudioEnded() {
    clearTimers();
    if (!isStarted || isPaused) return;

    if (isSpreadMode()) {
      const leftIdx = getSpreadLeft(currentIndex);
      const rightIdx = leftIdx + 1;

      // If we just finished narrating the Left page of the spread, narrate the Right page next!
      if (activeAudioIndex === leftIdx && rightIdx < TOTAL_PAGES) {
        advanceTimer = setTimeout(() => {
          if (!isPaused && isSpreadMode()) {
            playAudioForPage(rightIdx);
          }
        }, 700);
        return;
      }

      // Otherwise we finished the Right page of the spread: flip to the next spread!
      if (rightIdx < TOTAL_PAGES - 1) {
        advanceTimer = setTimeout(() => {
          if (!isPaused) {
            next();
          }
        }, 1100);
      }
    } else {
      // Mobile single-page mode: flip to next page
      if (currentIndex < TOTAL_PAGES - 1) {
        advanceTimer = setTimeout(() => {
          if (!isPaused && currentIndex < TOTAL_PAGES - 1) {
            next();
          }
        }, 1100);
      }
    }
  }

  audio.addEventListener('ended', handleAudioEnded);
  audio.addEventListener('error', handleAudioEnded);

  // --------------------------------------------------------------------------
  // 4. Page & Spread Flip Transitions
  // --------------------------------------------------------------------------
  function goToPage(targetIndex, dir = 1) {
    if (isAnimating) return;
    if (targetIndex < 0 || targetIndex >= TOTAL_PAGES) return;

    if (isSpreadMode()) {
      const curLeft = getSpreadLeft(currentIndex);
      const targetLeft = getSpreadLeft(targetIndex);
      if (targetLeft === curLeft) {
        // Same spread, just switch active audio page if clicked
        currentIndex = targetIndex;
        playAudioForPage(targetIndex);
        return;
      }

      isAnimating = true;
      clearTimers();

      const oldLeftSlide = slides[curLeft];
      const oldRightSlide = slides[curLeft + 1];
      const newLeftSlide = slides[targetLeft];
      const newRightSlide = slides[targetLeft + 1];

      currentIndex = targetLeft;
      activeAudioIndex = targetLeft;

      // Prepare new spread slides
      newLeftSlide.classList.add('spread-left', 'spread-fade-in');
      newRightSlide.classList.add('spread-right', 'spread-fade-in');
      fitSlide(newLeftSlide);
      fitSlide(newRightSlide);

      // Animate outgoing page flipping across the spine
      if (dir > 0 && oldRightSlide) {
        oldRightSlide.classList.remove('spread-right');
        oldRightSlide.classList.add('spread-flip-out-right');
      } else if (dir < 0 && oldLeftSlide) {
        oldLeftSlide.classList.remove('spread-left');
        oldLeftSlide.classList.add('spread-flip-out-left');
      }

      updateUI();

      setTimeout(() => {
        isAnimating = false;
        syncSlideVisibility();
        fitVisibleSlides();
        playAudioForPage(targetLeft);
      }, 650);
    } else {
      if (targetIndex === currentIndex) return;
      isAnimating = true;
      clearTimers();

      const outgoing = slides[currentIndex];
      const incoming = slides[targetIndex];
      const outClass = dir > 0 ? 'out-next' : 'out-prev';
      const inClass = dir > 0 ? 'in-next' : 'in-prev';

      slides.forEach(s => s.classList.remove('out-next', 'out-prev', 'in-next', 'in-prev'));

      incoming.classList.add('active', inClass);
      outgoing.classList.add(outClass);

      currentIndex = targetIndex;
      activeAudioIndex = targetIndex;
      updateUI();
      fitSlide(incoming);

      setTimeout(() => {
        outgoing.classList.remove('active', outClass);
        incoming.classList.remove(inClass);
        isAnimating = false;
        fitSlide(incoming);
        playAudioForPage(currentIndex);
      }, 560);
    }
  }

  function next() {
    if (isSpreadMode()) {
      const nextLeft = getSpreadLeft(currentIndex) + 2;
      if (nextLeft < TOTAL_PAGES) {
        goToPage(nextLeft, 1);
      }
    } else {
      if (currentIndex < TOTAL_PAGES - 1) {
        goToPage(currentIndex + 1, 1);
      }
    }
  }

  function prev() {
    if (isSpreadMode()) {
      const prevLeft = getSpreadLeft(currentIndex) - 2;
      if (prevLeft >= 0) {
        goToPage(prevLeft, -1);
      }
    } else {
      if (currentIndex > 0) {
        goToPage(currentIndex - 1, -1);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 5. Controls, Touch Swipe & Keyboard Events
  // --------------------------------------------------------------------------
  function startReading() {
    isStarted = true;
    isPaused = false;
    if (btnPause) btnPause.textContent = '⏸';
    if (btnStart) {
      btnStart.innerHTML = '<span>▶ 語音導覽播放中…</span>';
    }
    const startPage = isSpreadMode() ? getSpreadLeft(currentIndex) : currentIndex;
    playAudioForPage(startPage);
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
        clearTimers();
        btnPause.textContent = '▶';
        updateUI();
      } else {
        btnPause.textContent = '⏸';
        updateUI();
        if (audio.src && audio.currentTime > 0 && !audio.ended) {
          audio.play().catch(() => {});
        } else {
          playAudioForPage(activeAudioIndex);
        }
      }
    });
  }

  if (btnReplay) {
    btnReplay.addEventListener('click', () => {
      if (!isStarted) isStarted = true;
      isPaused = false;
      if (btnPause) btnPause.textContent = '⏸';
      const target = isSpreadMode() ? getSpreadLeft(currentIndex) : currentIndex;
      playAudioForPage(target);
    });
  }

  if (btnMute) {
    btnMute.addEventListener('click', () => {
      isMuted = !isMuted;
      audio.muted = isMuted;
      btnMute.textContent = isMuted ? '🔇' : '🔊';
    });
  }

  if (btnBack) btnBack.addEventListener('click', () => prev());

  if (pageCurl) {
    pageCurl.addEventListener('click', () => {
      if (!isStarted) {
        isStarted = true;
        isPaused = false;
        if (btnPause) btnPause.textContent = '⏸';
      }
      next();
    });
  }

  if (pcLeft) pcLeft.addEventListener('click', () => prev());
  if (pcRight) {
    pcRight.addEventListener('click', () => {
      if (!isStarted) {
        isStarted = true;
        isPaused = false;
        if (btnPause) btnPause.textContent = '⏸';
      }
      next();
    });
  }

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      if (!isStarted) {
        isStarted = true;
        isPaused = false;
        if (btnPause) btnPause.textContent = '⏸';
      }
      goToPage(idx, idx > currentIndex ? 1 : -1);
    });
  });

  // Allow clicking Left/Right page in Desktop Spread mode to switch narration to that page
  slides.forEach((slide, idx) => {
    slide.addEventListener('click', (e) => {
      if (!isSpreadMode()) return;
      if (e.target.closest('a, button')) return;
      if (isStarted && activeAudioIndex !== idx) {
        isPaused = false;
        if (btnPause) btnPause.textContent = '⏸';
        playAudioForPage(idx);
      }
    });
  });

  document.querySelectorAll('.btn-restart').forEach(btn => {
    btn.addEventListener('click', () => {
      goToPage(0, -1);
    });
  });

  // Touch Swipe
  let touchStartX = 0;
  let touchStartY = 0;

  stage.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  stage.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 42 && Math.abs(dx) > 1.3 * Math.abs(dy)) {
      if (dx < 0) {
        if (!isStarted) {
          isStarted = true;
          isPaused = false;
          if (btnPause) btnPause.textContent = '⏸';
        }
        next();
      } else {
        prev();
      }
    }
  }, { passive: true });

  // Keyboard Arrows
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      if (!isStarted) {
        isStarted = true;
        isPaused = false;
        if (btnPause) btnPause.textContent = '⏸';
      }
      next();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      prev();
    } else if (e.key === ' ') {
      e.preventDefault();
      if (btnPause) btnPause.click();
    }
  });

  window.addEventListener('resize', setAppH);
  window.addEventListener('orientationchange', setAppH);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setAppH);
  }

  document.addEventListener('DOMContentLoaded', () => {
    setAppH();
    scheduleFingerHint(0);
  });

  window.addEventListener('load', setAppH);
})();

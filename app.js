/**
 * =========================================================================
 * THE JOURNAL OF HIM — CORE JAVASCRIPT ENGINE (2026 EDITION)
 * =========================================================================
 * - Celestial Storytelling Gifts Showcase with 3D Clouds & Stars
 * - Visitor-Only Identity Gatekeeper (Persistent localStorage + Admin134434)
 * - Fixed Left-Rail Timeline Tracking with Gliding Active Bead
 * - Fullscreen HTML5 Canvas Confetti Burst Engine
 * - Smooth Video Lightbox & Dad's Official Prime Years Edit
 * - Infinite Community Wall (up to 100) with Admin Photo Deletion
 * - Standalone Audio Player Engine with Smooth Controls
 */

(function () {
  'use strict';

  // Config reference
  const config = window.JOURNAL_CONFIG || {};

  // DOM Elements - Timeline & Navigation
  const timelineRail = document.getElementById('timeline-rail');
  const railTrack = document.getElementById('rail-track');
  const railProgressBar = document.getElementById('rail-progress-bar');
  const railActiveBead = document.getElementById('rail-active-bead');
  const railNodes = document.querySelectorAll('.rail-node');
  const sections = document.querySelectorAll('.journal-section');

  // Hero & Top Navigation Controls
  const heroOpenBtn = document.getElementById('hero-open-btn');
  const navJournalBtn = document.getElementById('nav-journal-btn');
  const navCommunityBtn = document.getElementById('nav-community-btn');
  const navAddPhotoBtn = document.getElementById('nav-add-photo-btn');
  const brandCrestBtn = document.getElementById('brand-crest-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');

  // Visitor Identity Elements
  const navVisitorPill = document.getElementById('nav-visitor-pill');
  const navVisitorDisplayName = document.getElementById('nav-visitor-display-name');
  const navChangeNameBtn = document.getElementById('nav-change-name-btn');
  const changeNameModal = document.getElementById('change-name-modal');
  const changeNameForm = document.getElementById('change-name-form');
  const changeNameInput = document.getElementById('change-name-input');
  const changeNameCloseBtn = document.getElementById('change-name-close-btn');
  const changeNameBackdrop = document.getElementById('change-name-backdrop');

  // Storytelling Showcase Elements
  const giftSlides = document.querySelectorAll('.gift-slide');
  const storyDots = document.querySelectorAll('.story-dot');
  const storyPrevBtn = document.getElementById('story-prev-btn');
  const storyNextBtn = document.getElementById('story-next-btn');
  const cloudBurstForward = document.getElementById('cloud-burst-forward');

  // Audio Elements
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioIcon = document.getElementById('audio-icon');
  const audioLabel = document.getElementById('audio-label');
  const audioPrevBtn = document.getElementById('audio-prev-btn');
  const audioNextBtn = document.getElementById('audio-next-btn');
  const audioVolumeSlider = document.getElementById('audio-volume-slider');
  const volumeLabel = document.getElementById('volume-label');

  // Lightbox Elements
  const mediaLightbox = document.getElementById('media-lightbox');
  const lightboxMediaTarget = document.getElementById('lightbox-media-target');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxCloseBackdrop = document.getElementById('lightbox-close-backdrop');

  // Photo Upload Modal Elements
  const uploadPhotoModal = document.getElementById('upload-photo-modal');
  const openUploadModalBtn = document.getElementById('open-upload-modal-btn');
  const uploadCloseBtn = document.getElementById('upload-close-btn');
  const uploadCloseBackdrop = document.getElementById('upload-close-backdrop');
  const photoUploadForm = document.getElementById('photo-upload-form');
  const photoFileInput = document.getElementById('photo-file-input');
  const uploadDropzone = document.getElementById('upload-dropzone');
  const dropzonePrompt = document.getElementById('dropzone-prompt');
  const dropzonePreview = document.getElementById('dropzone-preview');
  const previewImg = document.getElementById('preview-img');
  const removePreviewBtn = document.getElementById('remove-preview-btn');
  const fatherNameInput = document.getElementById('father-name-input');
  const uploaderNameInput = document.getElementById('uploader-name-input');
  const uploaderCaptionInput = document.getElementById('uploader-caption-input');
  const uploadErrorMsg = document.getElementById('upload-error-msg');
  const communityCollageBoard = document.getElementById('community-collage-board');

  // Visitor Gatekeeper Elements (Passcode Removed)
  const passcodeGate = document.getElementById('passcode-gate');
  const visitorForm = document.getElementById('visitor-form');
  const visitorNameInput = document.getElementById('visitor-name-input');
  const visitorNoteInput = document.getElementById('visitor-note-input');
  const visitorErrorMsg = document.getElementById('visitor-error-msg');

  // Admin Ledger Elements
  const guestbookOpenBtn = document.getElementById('guestbook-open-btn');
  const guestbookModal = document.getElementById('guestbook-modal');
  const guestbookCloseBtn = document.getElementById('guestbook-close-btn');
  const guestbookCloseBackdrop = document.getElementById('guestbook-close-backdrop');
  const guestbookList = document.getElementById('guestbook-list');
  const visitorCountBadge = document.getElementById('visitor-count-badge');
  const guestbookRefreshBtn = document.getElementById('guestbook-refresh-btn');

  // Toast & Confetti
  const securityToast = document.getElementById('security-toast');
  const confettiLaunchBtn = document.getElementById('confetti-launch-btn');
  const thirstTrapLaunchBtn = document.getElementById('thirst-trap-launch-btn');

  // Application State
  let currentStorySlideIdx = 0;
  let audioPlayer = null;
  let isAudioPlaying = false;
  let isCanvasPaused = false;
  let wasAudioPlayingBeforeVideo = false;
  let currentSongIndex = 0;
  let playlist = [];
  let currentUploadedPhotoData = null;

  const COMMUNITY_STORAGE_KEY = 'tapz_community_photos_v3';

  /* =========================================================================
     1. INITIALIZATION & GATEKEEPER CHECK
     ========================================================================= */
  function init() {
    initGatekeeper();
    initContentFromConfig();
    initStoryShowcase();
    initAudioPlaylist();
    initScrollTracking();
    initLightboxTriggers();
    initUploadEngine();
    initCommunityWall();
    initConfettiEngine();
    initCanvasParticles();
    initAdminGuestbook();
  }

  /* -------------------------------------------------------------------------
     Visitor Identity Gatekeeper (Remembers visitor name; Admin134434 support)
     ------------------------------------------------------------------------- */
  function initGatekeeper() {
    const savedVisitor = (localStorage.getItem('dad_visitor_name') || '').trim();

    if (savedVisitor) {
      // Visitor already known; dismiss modal immediately
      if (passcodeGate) passcodeGate.classList.remove('active');
      applyVisitorIdentity(savedVisitor);
      // Auto-play gifts for returning visitor in theater dark mode
      document.body.classList.add('theater-intro-active');
      setTimeout(() => {
        if (typeof startStoryAutoPlay === 'function') startStoryAutoPlay();
      }, 600);
    } else {
      // First-time visit: show "Who is visiting?" modal
      if (passcodeGate) passcodeGate.classList.add('active');
      if (visitorNameInput) visitorNameInput.focus();
    }

    if (visitorForm) {
      visitorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const rawName = visitorNameInput.value.trim();
        const rawNote = (visitorNoteInput ? visitorNoteInput.value.trim() : '');

        if (!rawName) {
          if (visitorErrorMsg) visitorErrorMsg.style.display = 'block';
          return;
        }

        const res = window.SecurityGatekeeper 
          ? window.SecurityGatekeeper.registerVisitor(rawName, rawNote)
          : { success: true, isAdmin: (rawName.toLowerCase() === 'admin134434'), name: rawName };

        if (res.success) {
          if (passcodeGate) passcodeGate.classList.remove('active');
          applyVisitorIdentity(res.name);

          if (res.isAdmin) {
            showToast('👑 Admin Mode Activated (Admin134434)');
          } else {
            showToast(`Welcome, ${res.name}!`);
            // Attempt logging to backend
            fetch('/api/record_visitor', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: res.name, note: rawNote })
            }).catch(() => {});
          }

          // Dark theater mode auto-starts with the intro showcase!
          document.body.classList.add('theater-intro-active');

          // Unlock audio at 20% volume on direct user interaction
          unlockAndPlayAudioAt20Percent();

          // Re-render community wall to apply admin delete buttons if admin
          initCommunityWall();

          // Immediately start auto-playing the gifts and clicking to next!
          if (typeof startStoryAutoPlay === 'function') {
            startStoryAutoPlay();
          }
        }
      });
    }

    // Name switcher triggers
    if (navChangeNameBtn) {
      navChangeNameBtn.addEventListener('click', openChangeNameModal);
    }
    if (changeNameCloseBtn) {
      changeNameCloseBtn.addEventListener('click', closeChangeNameModal);
    }
    if (changeNameBackdrop) {
      changeNameBackdrop.addEventListener('click', closeChangeNameModal);
    }
    if (changeNameForm) {
      changeNameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = changeNameInput.value.trim();
        if (newName) {
          const res = window.SecurityGatekeeper 
            ? window.SecurityGatekeeper.registerVisitor(newName, '')
            : { success: true, isAdmin: (newName.toLowerCase() === 'admin134434'), name: newName };

          applyVisitorIdentity(res.name);
          closeChangeNameModal();
          showToast(`Name updated to: ${res.name}`);
          initCommunityWall();
        }
      });
    }
  }

  function applyVisitorIdentity(name) {
    const isAdmin = (name.toLowerCase() === 'admin134434') || (localStorage.getItem('dad_is_admin') === 'true');

    if (navVisitorPill && navVisitorDisplayName) {
      navVisitorDisplayName.textContent = name;
      navVisitorPill.style.display = 'inline-flex';
    }

    // Show/hide admin guestbook button
    if (guestbookOpenBtn) {
      guestbookOpenBtn.style.display = isAdmin ? 'inline-flex' : 'none';
    }
  }

  function openChangeNameModal() {
    if (changeNameModal) {
      const current = localStorage.getItem('dad_visitor_name') || '';
      if (changeNameInput) changeNameInput.value = current;
      changeNameModal.classList.add('active');
      changeNameModal.style.display = 'flex';
      if (changeNameInput) changeNameInput.focus();
    }
  }

  function closeChangeNameModal() {
    if (changeNameModal) {
      changeNameModal.classList.remove('active');
      changeNameModal.style.display = 'none';
    }
  }

  /* -------------------------------------------------------------------------
     Config Population
     ------------------------------------------------------------------------- */
  function initContentFromConfig() {
    if (config.DAD_NAME) {
      const navBrand = document.getElementById('nav-brand-title');
      if (navBrand) navBrand.textContent = config.DAD_NAME;
    }

    // 1. Entry I Content & Photo
    if (config.ENTRY_1) {
      const entry1Img = document.getElementById('entry1-img');
      const entry1Frame = document.getElementById('entry1-photo-frame');
      const entry1Stamp = document.getElementById('entry1-photo-stamp');
      if (entry1Img && config.ENTRY_1.photo) entry1Img.src = config.ENTRY_1.photo.src;
      if (entry1Frame && config.ENTRY_1.photo) {
        entry1Frame.setAttribute('data-src', config.ENTRY_1.photo.src);
        entry1Frame.setAttribute('data-title', config.ENTRY_1.photo.caption || 'A Lifetime of Integrity');
      }
      if (entry1Stamp && config.ENTRY_1.photo) {
        entry1Stamp.textContent = `${config.ENTRY_1.photo.year || '2001'} — ${config.ENTRY_1.photo.caption || 'INTEGRITY'}`;
      }
    }

    // 2. Timeline Reels (Entry III)
    if (config.ENTRY_3 && Array.isArray(config.ENTRY_3.reels)) {
      const reelContainer = document.getElementById('timeline-reels-container');
      if (reelContainer) {
        reelContainer.innerHTML = '';
        config.ENTRY_3.reels.forEach((reel, idx) => {
          const isLeft = (idx % 2 === 0);
          const row = document.createElement('div');
          row.className = `film-reel-row ${isLeft ? 'layout-left' : 'layout-right'}`;

          const frameHtml = `
            <div class="film-strip-frame photo-zoomable" data-src="${reel.src}" data-title="${reel.title}">
              <div class="sprockets top"></div>
              <div class="film-image-target">
                <img src="${reel.src}" alt="${reel.title}" class="film-img" loading="lazy">
              </div>
              <div class="sprockets bottom"></div>
            </div>
          `;

          const metaHtml = `
            <div class="film-reel-meta">
              <span class="film-year-badge">${reel.year}</span>
              <h3 class="film-title">${reel.title}</h3>
              <p class="film-caption">${reel.caption}</p>
              <div class="film-meta-divider"></div>
            </div>
          `;

          row.innerHTML = isLeft ? (frameHtml + metaHtml) : (metaHtml + frameHtml);
          reelContainer.appendChild(row);
        });
      }
    }

    // 3. Polaroids Constellation (Entry IV)
    if (config.ENTRY_4 && Array.isArray(config.ENTRY_4.items)) {
      const polaroidContainer = document.getElementById('polaroid-scatter-constellation');
      if (polaroidContainer) {
        polaroidContainer.innerHTML = '';
        config.ENTRY_4.items.forEach((item, idx) => {
          const card = document.createElement('div');
          const isVideo = item.isVideo || item.isThirstTrap || (item.src && (item.src.endsWith('.mov') || item.src.endsWith('.mp4')));
          card.className = `scatter-polaroid-item photo-zoomable ${isVideo ? 'thirst-trap-polaroid' : ''}`;
          const tilt = item.tilt || `${((idx % 5) - 2) * 2.5}deg`;
          card.style.transform = `rotate(${tilt})`;
          card.setAttribute('data-src', item.src);
          card.setAttribute('data-title', item.title || 'Family Memory');
          if (item.caption) card.setAttribute('data-caption', item.caption);
          if (isVideo) card.setAttribute('data-video', 'true');

          const imgSrc = item.poster || (isVideo ? 'assets/photos/THAT_KINDA_GUY.JPG' : item.src);

          card.innerHTML = `
            <div class="scotch-tape"></div>
            ${isVideo ? '<div class="thirst-trap-badge">🔥 THE EDIT</div>' : ''}
            <div class="polaroid-photo-box">
              <img src="${imgSrc}" alt="${item.title || 'Memory'}" loading="lazy">
              ${isVideo ? '<div class="polaroid-play-overlay">▶</div>' : ''}
            </div>
            <div class="polaroid-year-stamp">${item.year || ''} • ${item.title || ''}</div>
          `;

          polaroidContainer.appendChild(card);
        });
      }
    }
  }

  /* =========================================================================
     2. STORYTELLING SHOWCASE ENGINE ("GIFTS OVER THE YEARS") - AUTO-PLAY SYSTEM
     ========================================================================= */
  let storyAutoPlayTimer = null;
  let storyAutoProgressAnimFrame = null;
  let isStoryAutoPlaying = true;
  let progressStartTime = 0;

  function startStoryAutoPlay() {
    isStoryAutoPlaying = true;
    updateAutoPlayButtonUI();
    runCurrentSlideAutoPlay();
  }
  window.startStoryAutoPlay = startStoryAutoPlay;

  function pauseStoryAutoPlay() {
    isStoryAutoPlaying = false;
    clearTimeout(storyAutoPlayTimer);
    cancelAnimationFrame(storyAutoProgressAnimFrame);
    resetAllTimerBars();
    updateAutoPlayButtonUI();
  }
  window.pauseStoryAutoPlay = pauseStoryAutoPlay;

  function toggleStoryAutoPlay() {
    if (isStoryAutoPlaying) {
      pauseStoryAutoPlay();
      showToast('⏸ Story Auto-Play Paused');
    } else {
      startStoryAutoPlay();
      showToast('▶ Story Auto-Play Resumed');
    }
  }

  function updateAutoPlayButtonUI() {
    const btn = document.getElementById('story-autoplay-btn');
    const icon = document.getElementById('autoplay-icon');
    const text = document.getElementById('autoplay-text');
    if (!btn) return;

    if (isStoryAutoPlaying) {
      btn.classList.remove('paused');
      if (icon) icon.textContent = '⏸';
      if (text) text.textContent = 'Auto-Playing';
      btn.title = 'Click to Pause Automatic Story';
    } else {
      btn.classList.add('paused');
      if (icon) icon.textContent = '▶';
      if (text) text.textContent = 'Auto-Play';
      btn.title = 'Click to Resume Automatic Story';
    }
  }

  function resetAllTimerBars() {
    document.querySelectorAll('.gift-timer-fill').forEach(fill => {
      fill.style.width = '0%';
    });
  }

  function animateProgressBar(durationMs) {
    cancelAnimationFrame(storyAutoProgressAnimFrame);
    progressStartTime = performance.now();

    const activeSlide = giftSlides[currentStorySlideIdx];
    const fillEl = activeSlide ? activeSlide.querySelector('.gift-timer-fill') : null;
    if (!fillEl) return;

    resetAllTimerBars();

    function step(now) {
      if (!isStoryAutoPlaying) return;
      const elapsed = now - progressStartTime;
      const pct = Math.min((elapsed / durationMs) * 100, 100);
      fillEl.style.width = `${pct}%`;

      if (pct < 100) {
        storyAutoProgressAnimFrame = requestAnimationFrame(step);
      }
    }

    storyAutoProgressAnimFrame = requestAnimationFrame(step);
  }

  function runCurrentSlideAutoPlay() {
    clearTimeout(storyAutoPlayTimer);
    cancelAnimationFrame(storyAutoProgressAnimFrame);
    resetAllTimerBars();

    if (!isStoryAutoPlaying) return;

    const activeSlide = giftSlides[currentStorySlideIdx];
    if (!activeSlide) return;

    // Pause all other videos
    giftSlides.forEach((s, idx) => {
      if (idx !== currentStorySlideIdx) {
        const v = s.querySelector('video');
        if (v) {
          v.pause();
          v.currentTime = 0;
        }
      }
    });

    const activeVideo = activeSlide.querySelector('video');
    const activeWrap = activeSlide.querySelector('.gift-card-media-wrap');

    if (currentStorySlideIdx === 0) {
      // 1. FIRST SLIDE (The Mohenoa Jumper): DO NOT AUTO-SKIP!
      // Let the user read the highlight text at their own pace until they click/tap next.
      isCanvasPaused = false;
      clearTimeout(storyAutoPlayTimer);
      cancelAnimationFrame(storyAutoProgressAnimFrame);
      resetAllTimerBars();
    } else if (activeVideo) {
      // 2. VIDEO SLIDES (African Dance, Mum's AI Video, Prime Edit):
      // User request: AUTO UNMUTE FOR THE INTRO!
      isCanvasPaused = true;
      activeVideo.currentTime = 0;
      activeVideo.muted = false; // Auto unmute!
      activeVideo.volume = 1.0;

      const soundBtn = activeSlide.querySelector('.video-sound-toggle-btn');
      if (soundBtn) {
        soundBtn.textContent = '🔊 Sound: On (Tap to Mute)';
        soundBtn.classList.add('unmuted');
      }

      // Duck ambient background music so video audio is crisp & clear
      if (audioPlayer && isAudioPlaying) {
        audioPlayer.volume = 0.02;
      }

      const playPromise = activeVideo.play();
      if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(() => {
          if (activeWrap) activeWrap.classList.add('is-playing');
        }).catch((err) => {
          console.warn('Browser prevented unmuted autoplay, playing muted fallback:', err);
          activeVideo.muted = true;
          activeVideo.play().then(() => {
            if (activeWrap) activeWrap.classList.add('is-playing');
          }).catch(() => {});
          if (soundBtn) {
            soundBtn.textContent = '🔇 Tap to Unmute';
            soundBtn.classList.remove('unmuted');
          }
        });
      }

      const onEnded = () => {
        isCanvasPaused = false;
        activeVideo.removeEventListener('ended', onEnded);
        clearTimeout(storyAutoPlayTimer);
        if (activeWrap) activeWrap.classList.remove('is-playing');
        // Restore background audio volume
        if (audioPlayer && isAudioPlaying) {
          audioPlayer.volume = 0.20;
        }
        advanceNextSlideAuto();
      };
      activeVideo.addEventListener('ended', onEnded, { once: true });

      // Safety timeout: wait for full video duration + 1.5s
      let videoFallbackDuration = 32000;
      if (activeVideo.duration && !isNaN(activeVideo.duration) && activeVideo.duration > 2) {
        videoFallbackDuration = Math.round(activeVideo.duration * 1000) + 1500;
      }
      animateProgressBar(videoFallbackDuration);

      storyAutoPlayTimer = setTimeout(() => {
        isCanvasPaused = false;
        activeVideo.removeEventListener('ended', onEnded);
        if (audioPlayer && isAudioPlaying) {
          audioPlayer.volume = 0.20;
        }
        advanceNextSlideAuto();
      }, videoFallbackDuration);

    } else if (currentStorySlideIdx === 4) {
      // 3. LAST SLIDE (The 2026 Grand Journal Keepsake)
      isCanvasPaused = false;
      clearTimeout(storyAutoPlayTimer);
      cancelAnimationFrame(storyAutoProgressAnimFrame);
      resetAllTimerBars();
      if (audioPlayer && isAudioPlaying) {
        audioPlayer.volume = 0.20;
      }
      if (heroOpenBtn) {
        heroOpenBtn.classList.add('pulse-glow');
      }
      pauseStoryAutoPlay();
    }
  }

  function advanceNextSlideAuto() {
    if (!isStoryAutoPlaying) return;
    if (currentStorySlideIdx < giftSlides.length - 1) {
      goToSlide(currentStorySlideIdx + 1);
    } else {
      pauseStoryAutoPlay();
    }
  }

  function goToSlide(idx) {
    if (idx < 0) idx = giftSlides.length - 1;
    if (idx >= giftSlides.length) idx = 0;
    currentStorySlideIdx = idx;

    // Trigger 3D cloud burst animation on each transition
    if (cloudBurstForward) {
      cloudBurstForward.classList.add('burst-active');
      setTimeout(() => cloudBurstForward.classList.remove('burst-active'), 900);
    }

    // When changing slides, restore ambient music if moving away from a video slide
    if (audioPlayer && isAudioPlaying) {
      audioPlayer.volume = 0.20;
    }

    giftSlides.forEach((slide, sIdx) => {
      const isActive = (sIdx === currentStorySlideIdx);
      slide.classList.toggle('active', isActive);
      const v = slide.querySelector('video');
      const wrap = slide.querySelector('.gift-card-media-wrap');
      if (v && !isActive) {
        v.pause();
        v.currentTime = 0;
        v.muted = true;
        if (wrap) wrap.classList.remove('is-playing');
      }
    });

    storyDots.forEach((dot, dIdx) => {
      dot.classList.toggle('active', dIdx === currentStorySlideIdx);
    });

    if (isStoryAutoPlaying) {
      runCurrentSlideAutoPlay();
    } else {
      // If paused, still play current slide video inline with sound
      const activeSlide = giftSlides[currentStorySlideIdx];
      const activeVideo = activeSlide ? activeSlide.querySelector('video') : null;
      const activeWrap = activeSlide ? activeSlide.querySelector('.gift-card-media-wrap') : null;
      const soundBtn = activeSlide ? activeSlide.querySelector('.video-sound-toggle-btn') : null;
      if (activeVideo) {
        activeVideo.currentTime = 0;
        activeVideo.muted = false; // Auto unmute!
        activeVideo.volume = 1.0;
        if (soundBtn) {
          soundBtn.textContent = '🔊 Sound: On (Tap to Mute)';
          soundBtn.classList.add('unmuted');
        }
        if (audioPlayer && isAudioPlaying) {
          audioPlayer.volume = 0.02;
        }
        activeVideo.play().then(() => {
          if (activeWrap) activeWrap.classList.add('is-playing');
        }).catch(() => {
          activeVideo.muted = true;
          activeVideo.play().then(() => {
            if (activeWrap) activeWrap.classList.add('is-playing');
          }).catch(() => {});
        });
      }
    }
  }

  window.storyGoToNext = function () {
    if (currentStorySlideIdx < giftSlides.length - 1) {
      goToSlide(currentStorySlideIdx + 1);
    } else {
      exitTheaterIntroMode();
    }
  };

  window.storyGoToPrev = function () {
    if (currentStorySlideIdx > 0) {
      goToSlide(currentStorySlideIdx - 1);
    }
  };

  /* Video Click Interactions & Sound Controls */
  function initVideoInteractions() {
    giftSlides.forEach((slide) => {
      const video = slide.querySelector('video');
      const mediaWrap = slide.querySelector('.gift-card-media-wrap');
      const soundBtn = slide.querySelector('.video-sound-toggle-btn');
      const progressFill = slide.querySelector('.video-progress-fill');

      if (!video) return;

      // Ensure video is configured for smooth mobile and desktop playback
      video.playsInline = true;
      video.preload = 'auto';

      // Click anywhere on mediaWrap or video to toggle play/pause
      if (mediaWrap) {
        mediaWrap.addEventListener('click', (e) => {
          if (e.target.closest('.video-sound-toggle-btn') || e.target.closest('.video-skip-overlay-btn')) {
            return;
          }
          if (video.paused) {
            video.play().then(() => {
              mediaWrap.classList.add('is-playing');
            }).catch(() => {});
          } else {
            video.pause();
            mediaWrap.classList.remove('is-playing');
          }
        });
      }

      // Sound toggle button (Mute / Unmute)
      if (soundBtn) {
        soundBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          if (video.muted) {
            video.muted = false;
            soundBtn.textContent = '🔊 Sound: On (Tap to Mute)';
            soundBtn.classList.add('unmuted');
            // Duck background ambient music so video audio is clear
            if (audioPlayer && isAudioPlaying) {
              audioPlayer.volume = 0.04;
            }
          } else {
            video.muted = true;
            soundBtn.textContent = '🔇 Sound: Off (Tap to Unmute)';
            soundBtn.classList.remove('unmuted');
            // Restore background music
            if (audioPlayer && isAudioPlaying) {
              audioPlayer.volume = 0.20;
            }
          }
        });
      }

      // Time update for progress bar
      video.addEventListener('timeupdate', () => {
        if (progressFill && video.duration && !isNaN(video.duration)) {
          const pct = Math.min((video.currentTime / video.duration) * 100, 100);
          progressFill.style.width = `${pct}%`;
        }
      });

      video.addEventListener('play', () => {
        if (mediaWrap) mediaWrap.classList.add('is-playing');
        isCanvasPaused = true;
      });

      video.addEventListener('pause', () => {
        if (mediaWrap) mediaWrap.classList.remove('is-playing');
      });

      video.addEventListener('ended', () => {
        if (mediaWrap) mediaWrap.classList.remove('is-playing');
        isCanvasPaused = false;
        if (audioPlayer && isAudioPlaying) {
          audioPlayer.volume = 0.20;
        }
      });
    });
  }

  function initStoryShowcase() {
    if (giftSlides.length === 0) return;

    if (storyPrevBtn) {
      storyPrevBtn.addEventListener('click', () => {
        goToSlide(currentStorySlideIdx - 1);
      });
    }

    if (storyNextBtn) {
      storyNextBtn.addEventListener('click', () => {
        goToSlide(currentStorySlideIdx + 1);
      });
    }

    storyDots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        goToSlide(idx);
      });
    });

    const fastSkipBtn = document.getElementById('story-fast-skip-btn');
    if (fastSkipBtn) {
      fastSkipBtn.addEventListener('click', () => {
        window.storyGoToNext();
      });
    }

    // Theater Mode Close Button (Matches Screenshot 1 & 3 gold circle '✕')
    const theaterCloseBtn = document.getElementById('theater-close-btn');
    if (theaterCloseBtn) {
      theaterCloseBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        exitTheaterIntroMode();
      });
    }

    // Top Nav Replay Intro Show Button
    const navIntroReplayBtn = document.getElementById('nav-intro-replay-btn');
    if (navIntroReplayBtn) {
      navIntroReplayBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.body.classList.add('theater-intro-active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        goToSlide(0);
        showToast('✨ Cinematic Intro Replaying');
      });
    }

    // Initialize Video Click & Sound controls
    initVideoInteractions();

    // Helper to play gift video in lightbox
    window.playGiftVideo = function (videoSrc, videoTitle) {
      openLightbox(videoSrc, videoTitle, 'Gifts Over The Years • Cherished Memory', true);
    };

    // Hero Open button smoothly exits theater mode & scrolls to Entry I with 20% music
    if (heroOpenBtn) {
      heroOpenBtn.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        exitTheaterIntroMode(true);
        const entry1 = document.getElementById('entry-1');
        if (entry1) {
          entry1.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    const heroScrollCue = document.getElementById('hero-scroll-cue');
    if (heroScrollCue) {
      heroScrollCue.addEventListener('click', (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        exitTheaterIntroMode(true);
        const entry1 = document.getElementById('entry-1');
        if (entry1) {
          entry1.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  /* =========================================================================
     3. LEFT-RAIL TIMELINE TRACKING WITH GLIDING BEAD (FIXED ALIGNMENT)
     ========================================================================= */
  function initScrollTracking() {
    window.addEventListener('scroll', updateTimelineProgress, { passive: true });
    window.addEventListener('resize', updateTimelineProgress, { passive: true });

    // Smooth scroll on timeline node click
    railNodes.forEach((node) => {
      node.addEventListener('click', () => {
        const targetId = node.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetId === 'entry-1') {
          unlockAndPlayAudioAt20Percent();
          exitTheaterIntroMode();
        }
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    if (navJournalBtn) {
      navJournalBtn.addEventListener('click', () => {
        pauseStoryAutoPlay();
        exitTheaterIntroMode();
        unlockAndPlayAudioAt20Percent();
        const entry1 = document.getElementById('entry-1');
        if (entry1) entry1.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (navCommunityBtn) {
      navCommunityBtn.addEventListener('click', () => {
        exitTheaterIntroMode();
        const commSec = document.getElementById('community-wall-section');
        if (commSec) commSec.scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (brandCrestBtn) {
      brandCrestBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Direct mobile touch/click on Entry 1 triggers 20% audio unlock
    const entry1El = document.getElementById('entry-1');
    if (entry1El) {
      entry1El.addEventListener('click', () => {
        unlockAndPlayAudioAt20Percent();
        exitTheaterIntroMode();
      });
    }

    // Initial position update
    setTimeout(updateTimelineProgress, 100);
  }

  function updateTimelineProgress() {
    const scrollPos = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight - windowHeight;
    const progress = Math.min(Math.max(scrollPos / (docHeight || 1), 0), 1);

    if (railProgressBar) {
      railProgressBar.style.height = `${progress * 100}%`;
    }

    // Determine active section using viewport-relative coordinates
    let currentIdx = 0;
    const triggerOffset = windowHeight * 0.45;

    sections.forEach((sec, idx) => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= triggerOffset) {
        currentIdx = idx;
      }
    });

    // If user has scrolled while theater mode was active, exit it cleanly without forcing scroll
    if (document.body.classList.contains('theater-intro-active') && (currentIdx > 0 || scrollPos > 350)) {
      exitTheaterIntroMode(false);
    }

    // Update active node & bead position with pixel-perfect anchor
    railNodes.forEach((node, idx) => {
      const isActive = (idx === currentIdx);
      node.classList.toggle('active', isActive);

      if (isActive && railActiveBead && railTrack) {
        const dot = node.querySelector('.node-dot');
        if (dot) {
          const dotRect = dot.getBoundingClientRect();
          const trackRect = railTrack.getBoundingClientRect();
          const beadTop = (dotRect.top + dotRect.height / 2) - trackRect.top;
          railActiveBead.style.top = `${beadTop}px`;
        }
      }
    });

    // Update nav view tabs
    if (navJournalBtn && navCommunityBtn) {
      const inCommunity = (currentIdx === 6);
      navJournalBtn.classList.toggle('active', !inCommunity);
      navCommunityBtn.classList.toggle('active', inCommunity);
    }
  }

  /* =========================================================================
     4. AMBIENT AUDIO & SONG PLAYLIST ENGINE
     ========================================================================= */
  function initAudioPlaylist() {
    if (config.AUDIO && Array.isArray(config.AUDIO.playlist) && config.AUDIO.playlist.length > 0) {
      playlist = config.AUDIO.playlist;
    } else {
      playlist = [
        {
          title: "Maoli - Every Night Every Morning",
          url: "assets/songs/Maoli%20-%20%20every%20night%20every%20morning%20(%20lyrics)%20@MaoliMusic%20@VibeAndVerse-m4l.mp3"
        },
        {
          title: "Maoli - My Old Man ft. Fiji & Josh Tatofi",
          url: "assets/songs/Maoli%20-%20My%20Old%20Man%20ft.%20Fiji%20&%20Josh%20Tatofi%20(Official%20Lyric%20Video).mp3"
        }
      ];
    }

    if (audioToggleBtn) audioToggleBtn.addEventListener('click', toggleMusic);
    if (audioNextBtn) audioNextBtn.addEventListener('click', nextTrack);
    if (audioPrevBtn) audioPrevBtn.addEventListener('click', prevTrack);

    if (audioVolumeSlider) {
      audioVolumeSlider.value = 20;
      if (volumeLabel) volumeLabel.textContent = '20%';
      audioVolumeSlider.addEventListener('input', (e) => {
        const val = e.target.value / 100;
        if (audioPlayer) audioPlayer.volume = val;
        if (volumeLabel) volumeLabel.textContent = `${e.target.value}%`;
      });
    }
  }

  function exitTheaterIntroMode(shouldScroll = true) {
    const wasTheaterActive = document.body.classList.contains('theater-intro-active');
    if (wasTheaterActive) {
      document.body.classList.remove('theater-intro-active');

      // Pause all intro slide videos and reset states
      giftSlides.forEach(slide => {
        const v = slide.querySelector('video');
        const wrap = slide.querySelector('.gift-card-media-wrap');
        if (v) {
          v.pause();
          if (wrap) wrap.classList.remove('is-playing');
        }
      });

      isCanvasPaused = false;
      clearTimeout(storyAutoPlayTimer);
      cancelAnimationFrame(storyAutoProgressAnimFrame);
      unlockAndPlayAudioAt20Percent();

      if (typeof launchCelebrationConfetti === 'function') {
        launchCelebrationConfetti();
      }
    }

    if (shouldScroll) {
      const entry1 = document.getElementById('entry-1');
      if (entry1) {
        setTimeout(() => {
          entry1.scrollIntoView({ behavior: 'smooth' });
        }, 50);
      }
    }
  }
  window.exitTheaterIntroMode = exitTheaterIntroMode;

  function unlockAndPlayAudioAt20Percent() {
    if (!audioPlayer) {
      audioPlayer = new Audio();
      audioPlayer.volume = 0.20;
      audioPlayer.addEventListener('ended', nextTrack);
      audioPlayer.addEventListener('error', () => setTimeout(nextTrack, 1000));
    } else {
      audioPlayer.volume = 0.20;
    }
    if (audioVolumeSlider) audioVolumeSlider.value = 20;
    if (volumeLabel) volumeLabel.textContent = '20%';
    if (!isAudioPlaying) {
      startMusic();
    }
  }
  window.unlockAndPlayAudioAt20Percent = unlockAndPlayAudioAt20Percent;

  function startMusic() {
    if (!audioPlayer) {
      audioPlayer = new Audio();
      audioPlayer.volume = 0.20;
      audioPlayer.addEventListener('ended', nextTrack);
      audioPlayer.addEventListener('error', () => setTimeout(nextTrack, 1000));
    } else if (audioPlayer.volume > 0.4) {
      audioPlayer.volume = 0.20;
    }

    if (audioVolumeSlider) audioVolumeSlider.value = Math.round(audioPlayer.volume * 100);
    if (volumeLabel) volumeLabel.textContent = `${Math.round(audioPlayer.volume * 100)}%`;

    const track = playlist[currentSongIndex];
    if (!track) return;

    audioPlayer.src = track.url;
    audioPlayer.play().then(() => {
      isAudioPlaying = true;
      updateAudioUI(true, track.title);
    }).catch(() => {
      updateAudioUI(false, track.title);
    });
  }

  function toggleMusic() {
    if (!audioPlayer || !audioPlayer.src) {
      startMusic();
      return;
    }

    if (audioPlayer.paused) {
      audioPlayer.play().then(() => {
        isAudioPlaying = true;
        updateAudioUI(true, playlist[currentSongIndex]?.title);
      }).catch(() => {});
    } else {
      audioPlayer.pause();
      isAudioPlaying = false;
      updateAudioUI(false, playlist[currentSongIndex]?.title);
    }
  }

  function nextTrack() {
    if (playlist.length === 0) return;
    currentSongIndex = (currentSongIndex + 1) % playlist.length;
    if (audioPlayer) {
      const track = playlist[currentSongIndex];
      audioPlayer.src = track.url;
      audioPlayer.play().then(() => {
        isAudioPlaying = true;
        updateAudioUI(true, track.title);
      }).catch(() => {});
    }
  }

  function prevTrack() {
    if (playlist.length === 0) return;
    currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
    if (audioPlayer) {
      const track = playlist[currentSongIndex];
      audioPlayer.src = track.url;
      audioPlayer.play().then(() => {
        isAudioPlaying = true;
        updateAudioUI(true, track.title);
      }).catch(() => {});
    }
  }

  function updateAudioUI(playing, title) {
    if (!audioLabel || !audioIcon) return;
    if (playing) {
      const displayTitle = title ? (title.length > 22 ? title.substring(0, 20) + '...' : title) : 'Playing';
      audioLabel.textContent = displayTitle;
      audioIcon.textContent = '⏸';
      audioToggleBtn.style.color = 'var(--gold-vivid)';
    } else {
      audioLabel.textContent = 'Music: Off';
      audioIcon.textContent = '▶';
      audioToggleBtn.style.color = 'var(--gold-primary)';
    }
  }

  /* =========================================================================
     5. LIGHTBOX ZOOM & VIDEO PLAYER (DAD'S EDIT HUB)
     ========================================================================= */
  function launchDadVideoEdit(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();
    launchCelebrationConfetti();
    const cfg = window.JOURNAL_CONFIG || {};
    const videoSrc = (cfg.VIDEO_EDIT && cfg.VIDEO_EDIT.src) || 'assets/videos/thirst trap edit of my dad.mp4';
    const videoTitle = (cfg.VIDEO_EDIT && cfg.VIDEO_EDIT.title) || '🔥 Ratu Nautu Latunipulu — The Official Prime Years Edit';
    const videoCaption = (cfg.VIDEO_EDIT && cfg.VIDEO_EDIT.caption) || 'Proceed with caution: High aura ahead.';
    openLightbox(videoSrc, videoTitle, videoCaption, true);
  }

  window.launchDadVideoEdit = launchDadVideoEdit;

  function initLightboxTriggers() {
    // Dedicated Prime Years Edit button
    if (thirstTrapLaunchBtn) {
      thirstTrapLaunchBtn.addEventListener('click', launchDadVideoEdit);
    }

    // Global Event Delegation for zoomable photos, polaroids, & video buttons
    document.addEventListener('click', (e) => {
      const editBtn = e.target.closest('#thirst-trap-launch-btn, .thirst-trap-btn');
      if (editBtn) {
        launchDadVideoEdit(e);
        return;
      }

      const closeTarget = e.target.closest('#lightbox-close-btn, #lightbox-close-backdrop');
      if (closeTarget) {
        e.preventDefault();
        closeLightbox();
        return;
      }

      const zoomItem = e.target.closest('.photo-zoomable, .scatter-polaroid-item');
      if (zoomItem) {
        const img = zoomItem.querySelector('img');
        const src = zoomItem.getAttribute('data-src') || (img ? img.src : '');
        const title = zoomItem.getAttribute('data-title') || (img ? img.alt : '');
        const caption = zoomItem.getAttribute('data-caption') || 'Kept loose, cherished forever.';
        const isVideo = zoomItem.getAttribute('data-video') === 'true' || (src && (src.endsWith('.mov') || src.endsWith('.mp4')));
        if (src) {
          openLightbox(src, title, caption, isVideo);
        }
      }
    });

    // Secret Crest 3-tap Easter Egg
    const brandCrest = document.getElementById('brand-crest-btn');
    let crestClickCount = 0;
    let crestClickTimer = null;
    if (brandCrest) {
      brandCrest.addEventListener('click', () => {
        crestClickCount++;
        clearTimeout(crestClickTimer);
        crestClickTimer = setTimeout(() => { crestClickCount = 0; }, 1200);
        if (crestClickCount >= 3) {
          crestClickCount = 0;
          showToast('🔥 SECRET PRIME EDIT UNLOCKED!');
          launchDadVideoEdit();
        }
      });
    }
  }

  function openLightbox(src, title, caption, isVideo = false) {
    if (!mediaLightbox || !lightboxMediaTarget || !src) return;
    
    if (isVideo || src.endsWith('.mov') || src.endsWith('.mp4') || src.includes('.mp4')) {
      wasAudioPlayingBeforeVideo = isAudioPlaying;
      if (isAudioPlaying && audioPlayer) {
        audioPlayer.pause();
        isAudioPlaying = false;
        updateAudioUI(false, '');
      }

      isCanvasPaused = true;

      // Ensure proper MP4 source element with fallback
      lightboxMediaTarget.innerHTML = `
        <div class="video-player-container">
          <video id="active-lightbox-video" controls playsinline preload="auto" class="lightbox-video-player">
            <source src="${src}" type="video/mp4">
            Your browser does not support the video tag.
          </video>
        </div>
      `;

      setTimeout(() => {
        const activeVideo = document.getElementById('active-lightbox-video');
        if (activeVideo && typeof activeVideo.play === 'function') {
          activeVideo.play().catch(() => {});
        }
      }, 80);
    } else {
      lightboxMediaTarget.innerHTML = `<img src="${src}" alt="${title || ''}" loading="eager">`;
    }

    if (lightboxTitle) lightboxTitle.textContent = title || '';
    if (lightboxCaption) lightboxCaption.textContent = caption || '';
    mediaLightbox.classList.add('active');
    mediaLightbox.style.display = 'flex';
  }

  window.openLightbox = openLightbox;

  function closeLightbox() {
    if (!mediaLightbox) return;
    mediaLightbox.classList.remove('active');
    mediaLightbox.style.display = 'none';

    const activeVideo = document.getElementById('active-lightbox-video');
    if (activeVideo) {
      activeVideo.pause();
      activeVideo.src = '';
      activeVideo.remove();
    }
    if (lightboxMediaTarget) lightboxMediaTarget.innerHTML = '';

    isCanvasPaused = false;

    if (wasAudioPlayingBeforeVideo && audioPlayer) {
      audioPlayer.play().then(() => {
        isAudioPlaying = true;
        const track = playlist[currentSongIndex];
        updateAudioUI(true, track ? track.title : '');
      }).catch(() => {});
      wasAudioPlayingBeforeVideo = false;
    }
  }

  window.closeLightbox = closeLightbox;

  /* =========================================================================
     6. COMMUNITY PHOTO WALL & INFINITE SLOTS (UP TO 100) + ADMIN DELETION
     ========================================================================= */
  function initUploadEngine() {
    if (navAddPhotoBtn) navAddPhotoBtn.addEventListener('click', openUploadModal);
    if (openUploadModalBtn) openUploadModalBtn.addEventListener('click', openUploadModal);
    if (uploadCloseBtn) uploadCloseBtn.addEventListener('click', closeUploadModal);
    if (uploadCloseBackdrop) uploadCloseBackdrop.addEventListener('click', closeUploadModal);

    if (uploadDropzone) {
      uploadDropzone.addEventListener('click', () => photoFileInput.click());
      uploadDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadDropzone.style.borderColor = 'var(--gold-vivid)';
      });
      uploadDropzone.addEventListener('dragleave', () => {
        uploadDropzone.style.borderColor = 'rgba(223, 183, 108, 0.4)';
      });
      uploadDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadDropzone.style.borderColor = 'rgba(223, 183, 108, 0.4)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleSelectedFile(e.dataTransfer.files[0]);
        }
      });
    }

    if (photoFileInput) {
      photoFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          handleSelectedFile(e.target.files[0]);
        }
      });
    }

    if (removePreviewBtn) {
      removePreviewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSelectedFile();
      });
    }

    if (photoUploadForm) {
      photoUploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitCommunityPhoto();
      });
    }
  }

  function handleSelectedFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      currentUploadedPhotoData = event.target.result;
      previewImg.src = currentUploadedPhotoData;
      dropzonePrompt.style.display = 'none';
      dropzonePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }

  function clearSelectedFile() {
    currentUploadedPhotoData = null;
    photoFileInput.value = '';
    previewImg.src = '';
    dropzonePreview.style.display = 'none';
    dropzonePrompt.style.display = 'block';
  }

  function openUploadModal() {
    if (uploadPhotoModal) {
      clearSelectedFile();
      if (uploadErrorMsg) uploadErrorMsg.style.display = 'none';
      uploadPhotoModal.classList.add('active');
    }
  }

  function closeUploadModal() {
    if (uploadPhotoModal) uploadPhotoModal.classList.remove('active');
  }

  async function submitCommunityPhoto() {
    const fatherName = fatherNameInput.value.trim();
    const uploaderName = uploaderNameInput.value.trim();
    const caption = uploaderCaptionInput.value.trim();

    if (!currentUploadedPhotoData || !fatherName || !uploaderName) {
      if (uploadErrorMsg) uploadErrorMsg.style.display = 'block';
      return;
    }

    const localPhoto = {
      id: Date.now(),
      url: currentUploadedPhotoData,
      title: `Father: ${fatherName}`,
      caption: caption || 'Honoring our beloved father',
      uploader: uploaderName,
      date: new Date().toLocaleDateString()
    };

    // Try posting to backend
    try {
      const resp = await fetch('/api/upload_photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploader: uploaderName,
          father_name: fatherName,
          caption: caption,
          image: currentUploadedPhotoData
        })
      });
      if (resp.ok) {
        const result = await resp.json();
        if (result.success && result.photo) {
          localPhoto.id = result.photo.id || localPhoto.id;
          localPhoto.url = result.photo.url || localPhoto.url;
        }
      }
    } catch (err) {}

    // Save locally
    try {
      const stored = JSON.parse(localStorage.getItem(COMMUNITY_STORAGE_KEY) || '[]');
      stored.unshift(localPhoto);
      localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {}

    closeUploadModal();
    initCommunityWall();
    showToast(`Photo for ${fatherName} added to Wall of Honor!`);
    
    const wallSec = document.getElementById('community-wall-section');
    if (wallSec) wallSec.scrollIntoView({ behavior: 'smooth' });
  }

  async function initCommunityWall() {
    if (!communityCollageBoard) return;

    const isAdmin = window.SecurityGatekeeper 
      ? window.SecurityGatekeeper.isAdmin()
      : ((localStorage.getItem('dad_visitor_name') || '').toLowerCase() === 'admin134434');

    // 1. Dad's Primary Card
    const dadPrimaryCard = {
      url: "assets/photos/464825450_10225438053368831_2504579000914362514_n.jpg",
      title: "Ratu Nautu Latunipulu",
      caption: "Our Pillar of Strength & Wisdom",
      uploader: "Latunipulu Family",
      tilt: "-2deg",
      isPrimaryDad: true
    };

    let serverPhotos = [];
    try {
      const res = await fetch('/api/community_photos');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.photos)) {
          serverPhotos = data.photos.map(p => ({
            id: p.id,
            url: p.url,
            title: p.father_name ? `Father: ${p.father_name}` : `Father tribute`,
            caption: p.caption || "Special Memory",
            uploader: p.uploader || "Family Member"
          }));
        }
      }
    } catch (e) {}

    let localPhotos = [];
    try {
      localPhotos = JSON.parse(localStorage.getItem(COMMUNITY_STORAGE_KEY) || '[]');
    } catch (e) {}

    // Combine photos
    const combinedMap = new Map();
    [...serverPhotos, ...localPhotos].forEach(p => {
      if (p.url && !combinedMap.has(p.url)) {
        combinedMap.set(p.url, p);
      }
    });

    const userUploadedList = Array.from(combinedMap.values());
    const allPhotos = [dadPrimaryCard, ...userUploadedList];

    communityCollageBoard.innerHTML = '';

    // Render photo cards
    allPhotos.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'polaroid-scatter-card';
      const tilt = item.tilt || `${((idx % 5) - 2) * 2.2}deg`;
      card.style.transform = `rotate(${tilt})`;

      // Admin delete button (only for non-primary community uploads)
      let adminBtnHtml = '';
      if (isAdmin && !item.isPrimaryDad) {
        adminBtnHtml = `<button class="admin-delete-photo-btn" title="Delete this photo from Wall of Honor">✕ Delete</button>`;
      }

      card.innerHTML = `
        <div class="scotch-tape"></div>
        ${adminBtnHtml}
        <div class="polaroid-img-wrap">
          <img src="${item.url}" alt="${item.title}" loading="lazy">
        </div>
        <div class="polaroid-meta">
          <div class="polaroid-card-caption">${item.title}</div>
          <div class="polaroid-card-subcaption">"${item.caption}"</div>
          <div class="polaroid-card-uploader">✦ Shared by ${item.uploader}</div>
        </div>
      `;

      // Lightbox click
      card.addEventListener('click', (e) => {
        if (e.target.closest('.admin-delete-photo-btn')) return;
        openLightbox(item.url, item.title, `${item.caption} — Shared by ${item.uploader}`);
      });

      // Admin delete handler
      if (isAdmin && !item.isPrimaryDad) {
        const delBtn = card.querySelector('.admin-delete-photo-btn');
        if (delBtn) {
          delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteCommunityPhoto(item, card);
          });
        }
      }

      communityCollageBoard.appendChild(card);
    });

    // Dynamic infinite upload slots: Always show 5-6 ready "+ Add Your Father" empty slots by default!
    // As slots get filled with photos, append empty slots one by one up to MAX_WALL_CAPACITY (100).
    const DEFAULT_EMPTY_SLOTS = 5;
    const MAX_WALL_CAPACITY = 100;
    const slotsToShow = Math.max(1, Math.min(DEFAULT_EMPTY_SLOTS, MAX_WALL_CAPACITY - allPhotos.length));

    for (let s = 0; s < slotsToShow; s++) {
      const slotIndex = allPhotos.length + s;
      if (slotIndex > MAX_WALL_CAPACITY) break;

      const emptySlot = document.createElement('div');
      emptySlot.className = 'polaroid-scatter-card empty-slot-card';
      const tilt = `${(((slotIndex) % 5) - 2) * 2}deg`;
      emptySlot.style.transform = `rotate(${tilt})`;

      emptySlot.innerHTML = `
        <div class="scotch-tape"></div>
        <div class="polaroid-img-wrap empty-slot-box">
          <span class="empty-slot-plus">＋</span>
          <span class="empty-slot-text">Add Your Father</span>
        </div>
        <div class="polaroid-meta">
          <div class="polaroid-card-caption">✦ Wall of Honor ✦</div>
          <div class="polaroid-card-subcaption">Slot ${slotIndex} of ${MAX_WALL_CAPACITY} • Tap to honor your father</div>
        </div>
      `;

      emptySlot.addEventListener('click', openUploadModal);
      communityCollageBoard.appendChild(emptySlot);
    }
  }

  async function deleteCommunityPhoto(item, cardElement) {
    if (!confirm(`Are you sure you want to delete the photo for "${item.title}" from the Wall of Honor?`)) {
      return;
    }

    // 1. Delete on server backend
    try {
      await fetch('/api/delete_photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id })
      });
    } catch (e) {}

    // 2. Delete from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem(COMMUNITY_STORAGE_KEY) || '[]');
      const filtered = stored.filter(p => p.url !== item.url && p.id !== item.id);
      localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {}

    // 3. Remove DOM element smoothly
    if (cardElement) {
      cardElement.style.transition = 'all 0.35s ease';
      cardElement.style.opacity = '0';
      cardElement.style.transform = 'scale(0.8)';
      setTimeout(() => {
        if (cardElement.parentNode) cardElement.parentNode.removeChild(cardElement);
      }, 350);
    }

    showToast(`Deleted photo: ${item.title}`);
  }

  /* =========================================================================
     7. ADMIN GUESTBOOK LEDGER MODAL
     ========================================================================= */
  function initAdminGuestbook() {
    if (guestbookOpenBtn) {
      guestbookOpenBtn.addEventListener('click', openGuestbookModal);
    }
    if (guestbookCloseBtn) {
      guestbookCloseBtn.addEventListener('click', closeGuestbookModal);
    }
    if (guestbookCloseBackdrop) {
      guestbookCloseBackdrop.addEventListener('click', closeGuestbookModal);
    }
    if (guestbookRefreshBtn) {
      guestbookRefreshBtn.addEventListener('click', fetchAndRenderVisitors);
    }
  }

  function openGuestbookModal() {
    if (guestbookModal) {
      guestbookModal.classList.add('active');
      guestbookModal.style.display = 'flex';
      fetchAndRenderVisitors();
    }
  }

  function closeGuestbookModal() {
    if (guestbookModal) {
      guestbookModal.classList.remove('active');
      guestbookModal.style.display = 'none';
    }
  }

  async function fetchAndRenderVisitors() {
    if (!guestbookList) return;

    guestbookList.innerHTML = '<div class="guestbook-loading">Loading visitor records...</div>';

    let visitors = [];

    // 1. Try server
    try {
      const resp = await fetch('/api/visitors');
      if (resp.ok) {
        const data = await resp.json();
        if (data.success && Array.isArray(data.visitors)) {
          visitors = data.visitors;
        }
      }
    } catch (e) {}

    // 2. Fallback / Merge with local ledger
    try {
      const localLedger = JSON.parse(localStorage.getItem('dad_visitor_ledger') || '[]');
      const map = new Map();
      [...visitors, ...localLedger].forEach(v => {
        const key = `${v.name}_${v.timestamp}`;
        if (!map.has(key)) map.set(key, v);
      });
      visitors = Array.from(map.values());
    } catch (e) {}

    if (visitorCountBadge) {
      visitorCountBadge.textContent = `${visitors.length} Visitors Recorded`;
    }

    if (visitors.length === 0) {
      guestbookList.innerHTML = '<div class="guestbook-empty">No visitors recorded yet.</div>';
      return;
    }

    guestbookList.innerHTML = '';
    visitors.slice().reverse().forEach((v) => {
      const row = document.createElement('div');
      row.className = 'visitor-item-row';
      row.style.cssText = 'background:rgba(255,255,255,0.05);padding:12px 16px;border-radius:8px;margin-bottom:8px;border-left:3px solid var(--gold-vivid);display:flex;flex-direction:column;gap:4px;';

      const timeStr = v.timestamp || 'Recent';
      const noteStr = v.note ? `<div style="font-size:13px;color:#f5eedf;font-style:italic;">“${v.note}”</div>` : '';

      row.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <strong style="color:var(--gold-vivid);font-size:14px;">${v.name}</strong>
          <span style="font-size:11px;color:rgba(255,255,255,0.4);">${timeStr}</span>
        </div>
        ${noteStr}
      `;
      guestbookList.appendChild(row);
    });
  }

  /* =========================================================================
     8. FULLSCREEN HTML5 CANVAS CONFETTI CELEBRATION ENGINE
     ========================================================================= */
  let confettiParticles = [];
  let isConfettiActive = false;

  function initConfettiEngine() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    if (confettiLaunchBtn) {
      confettiLaunchBtn.addEventListener('click', launchCelebrationConfetti);
    }
  }

  function launchCelebrationConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    const colors = ['#dfb76c', '#f3cf7a', '#ffffff', '#b85d19', '#e28743', '#8b1d1d', '#ffe082'];
    const particleCount = 150;

    for (let i = 0; i < particleCount; i++) {
      confettiParticles.push({
        x: width * 0.5 + (Math.random() - 0.5) * 200,
        y: height * 0.4 + (Math.random() - 0.5) * 100,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 1.2) * 16,
        size: Math.random() * 9 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        wobble: Math.random() * 10,
        wobbleSpeed: Math.random() * 0.1 + 0.05,
        opacity: 1,
        shape: Math.random() > 0.3 ? 'rect' : 'circle'
      });
    }

    showToast("🎉 Happy Father's Day, Dad!");

    if (!isConfettiActive) {
      isConfettiActive = true;
      runConfettiLoop(ctx, width, height);
    }
  }

  function runConfettiLoop(ctx, width, height) {
    if (confettiParticles.length === 0) {
      ctx.clearRect(0, 0, width, height);
      isConfettiActive = false;
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (let i = confettiParticles.length - 1; i >= 0; i--) {
      const p = confettiParticles[i];

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.32; // Gravity
      p.vx *= 0.985; // Air friction
      p.rotation += p.rotationSpeed;
      p.wobble += p.wobbleSpeed;
      p.opacity -= 0.0055; // Fade decay

      if (p.opacity <= 0 || p.y > height + 20) {
        confettiParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = Math.max(p.opacity, 0);
      ctx.translate(p.x + Math.sin(p.wobble) * 4, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    requestAnimationFrame(() => runConfettiLoop(ctx, width, height));
  }

  /* =========================================================================
     9. AMBIENT GOLDEN DUST CANVAS PARTICLES
     ========================================================================= */
  function initCanvasParticles() {
    const canvas = document.getElementById('ambient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    });

    const particles = [];
    const particleCount = 38;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2.2 + 0.6,
        speedY: Math.random() * 0.35 + 0.12,
        speedX: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.6 + 0.2
      });
    }

    function renderParticles() {
      if (!isCanvasPaused) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#dfb76c';

        particles.forEach((p) => {
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          p.y -= p.speedY;
          p.x += p.speedX;

          if (p.y < 0) {
            p.y = h;
            p.x = Math.random() * w;
          }
        });
      }

      requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }

  /* =========================================================================
     10. TOAST & FULLSCREEN UTILITIES
     ========================================================================= */
  function showToast(msg) {
    if (!securityToast) return;
    securityToast.textContent = msg;
    securityToast.classList.add('active');
    setTimeout(() => {
      securityToast.classList.remove('active');
    }, 3200);
  }

  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });
  }

  // Launch on DOM ready
  document.addEventListener('DOMContentLoaded', init);

})();

/**
 * =========================================================================
 * THE JOURNAL OF HIM — CORE JAVASCRIPT ENGINE
 * =========================================================================
 * - Left-Rail Timeline Tracking with Gliding Active Bead
 * - Smooth Section Transitions & Scroll Waypoints
 * - Standalone Audio Player Engine (Static Cloudflare Pages & GitHub Ready)
 * - Lightbox Zoom for Super 8 Frames & Loose Polaroids
 * - Community Photo Wall with Client-Side Persistence
 * - Confetti Celebration Engine
 */

(function () {
  'use strict';

  // Config reference
  const config = window.JOURNAL_CONFIG || {};

  // DOM Elements
  const timelineRail = document.getElementById('timeline-rail');
  const railProgressBar = document.getElementById('rail-progress-bar');
  const railActiveBead = document.getElementById('rail-active-bead');
  const railNodes = document.querySelectorAll('.rail-node');
  const sections = document.querySelectorAll('.journal-section');

  // Hero Open Button
  const heroOpenBtn = document.getElementById('hero-open-btn');
  const navJournalBtn = document.getElementById('nav-journal-btn');
  const navCommunityBtn = document.getElementById('nav-community-btn');
  const navAddPhotoBtn = document.getElementById('nav-add-photo-btn');
  const brandCrestBtn = document.getElementById('brand-crest-btn');

  // Audio elements
  const audioToggleBtn = document.getElementById('audio-toggle-btn');
  const audioIcon = document.getElementById('audio-icon');
  const audioLabel = document.getElementById('audio-label');
  const audioPrevBtn = document.getElementById('audio-prev-btn');
  const audioNextBtn = document.getElementById('audio-next-btn');
  const audioVolumeSlider = document.getElementById('audio-volume-slider');
  const volumeLabel = document.getElementById('volume-label');

  // Lightbox elements
  const mediaLightbox = document.getElementById('media-lightbox');
  const lightboxMediaTarget = document.getElementById('lightbox-media-target');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxCloseBackdrop = document.getElementById('lightbox-close-backdrop');

  // Upload modal elements
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

  // Gatekeeper elements
  const passcodeGate = document.getElementById('passcode-gate');
  const gatePasscodeCard = document.getElementById('gate-passcode-card');
  const gateVisitorCard = document.getElementById('gate-visitor-card');
  const passcodeForm = document.getElementById('passcode-form');
  const passcodeInput = document.getElementById('passcode-input');
  const passcodeErrorMsg = document.getElementById('passcode-error-msg');
  const visitorForm = document.getElementById('visitor-form');
  const visitorNameInput = document.getElementById('visitor-name-input');
  const visitorNoteInput = document.getElementById('visitor-note-input');
  const visitorErrorMsg = document.getElementById('visitor-error-msg');

  // Toast & Confetti
  const securityToast = document.getElementById('security-toast');
  const confettiLaunchBtn = document.getElementById('confetti-launch-btn');
  const fullscreenBtn = document.getElementById('fullscreen-btn');

  // State
  let audioPlayer = null;
  let isAudioPlaying = false;
  let currentSongIndex = 0;
  let playlist = [];
  let currentUploadedPhotoData = null;

  const COMMUNITY_STORAGE_KEY = 'tapz_community_photos_v2';
  const PASSCODE_STORAGE_KEY = 'tapz_unlocked_v2';

  /* =========================================================================
     1. INITIALIZATION & PASSCODE GATEKEEPER
     ========================================================================= */
  function init() {
    initContentFromConfig();
    initAudioPlaylist();
    initScrollTracking();
    initLightboxTriggers();
    initUploadEngine();
    initCommunityWall();
    initConfetti();
    initCanvasParticles();
    checkGatekeeperStatus();
  }

  function initContentFromConfig() {
    if (config.DAD_NAME) {
      document.getElementById('nav-brand-title').textContent = config.DAD_NAME;
    }

    // 1. Render Entry I Hero Photo
    if (config.ENTRY_1 && config.ENTRY_1.photo) {
      const entry1Img = document.getElementById('entry1-img');
      const entry1Frame = document.getElementById('entry1-photo-frame');
      const entry1Stamp = document.getElementById('entry1-photo-stamp');
      if (entry1Img) entry1Img.src = config.ENTRY_1.photo.src;
      if (entry1Frame) {
        entry1Frame.setAttribute('data-src', config.ENTRY_1.photo.src);
        entry1Frame.setAttribute('data-title', config.ENTRY_1.photo.caption || 'The Early Years');
      }
      if (entry1Stamp) entry1Stamp.textContent = `${config.ENTRY_1.photo.year || '2001'} — ${config.ENTRY_1.photo.caption || 'HERITAGE'}`;
    }

    // 2. Dynamic Timeline Reels (Entry III)
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

    // 3. Dynamic Polaroids Constellation (Entry IV)
    if (config.ENTRY_4 && Array.isArray(config.ENTRY_4.items)) {
      const polaroidContainer = document.getElementById('polaroid-scatter-constellation');
      if (polaroidContainer) {
        polaroidContainer.innerHTML = '';
        config.ENTRY_4.items.forEach((item, idx) => {
          const card = document.createElement('div');
          card.className = 'scatter-polaroid-item photo-zoomable';
          const tilt = item.tilt || `${((idx % 5) - 2) * 2.5}deg`;
          card.style.transform = `rotate(${tilt})`;
          card.setAttribute('data-src', item.src);
          card.setAttribute('data-title', item.title || 'Family Memory');

          card.innerHTML = `
            <div class="scotch-tape"></div>
            <div class="polaroid-photo-box">
              <img src="${item.src}" alt="${item.title || 'Memory'}" loading="lazy">
            </div>
            <div class="polaroid-year-stamp">${item.year || ''} • ${item.title || ''}</div>
          `;

          polaroidContainer.appendChild(card);
        });
      }
    }
  }

  function checkGatekeeperStatus() {
    const requiredPasscode = config.PASSCODE;
    if (!requiredPasscode || requiredPasscode.trim() === '') {
      passcodeGate.classList.remove('active');
      return;
    }

    const isUnlocked = localStorage.getItem(PASSCODE_STORAGE_KEY);
    if (isUnlocked === 'true') {
      passcodeGate.classList.remove('active');
    } else {
      passcodeGate.classList.add('active');
    }
  }

  passcodeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = passcodeInput.value.trim();
    if (entered === config.PASSCODE || entered.toUpperCase() === 'DAD2026' || entered.toUpperCase() === 'LELOUCH') {
      passcodeErrorMsg.style.display = 'none';
      gatePasscodeCard.style.display = 'none';
      gateVisitorCard.style.display = 'block';
      visitorNameInput.focus();
    } else {
      passcodeErrorMsg.style.display = 'block';
      passcodeInput.value = '';
    }
  });

  visitorForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = visitorNameInput.value.trim();
    const note = visitorNoteInput.value.trim();
    if (!name) {
      visitorErrorMsg.style.display = 'block';
      return;
    }

    // Save visitor locally
    try {
      const visitors = JSON.parse(localStorage.getItem('tapz_visitors_v2') || '[]');
      visitors.push({ name, note, time: new Date().toISOString() });
      localStorage.setItem('tapz_visitors_v2', JSON.stringify(visitors));
    } catch (err) {}

    localStorage.setItem(PASSCODE_STORAGE_KEY, 'true');
    passcodeGate.classList.remove('active');
    showToast(`Welcome, ${name}!`);

    // Auto-start ambient music if enabled
    if (config.AUDIO && config.AUDIO.autoPlayAfterUnlock) {
      startMusic();
    }
  });

  /* =========================================================================
     2. LEFT-RAIL TIMELINE TRACKING WITH GLIDING BEAD
     ========================================================================= */
  function initScrollTracking() {
    window.addEventListener('scroll', updateTimelineProgress, { passive: true });
    window.addEventListener('resize', updateTimelineProgress, { passive: true });

    // Smooth scroll on node click
    railNodes.forEach((node) => {
      node.addEventListener('click', () => {
        const targetId = node.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    if (heroOpenBtn) {
      heroOpenBtn.addEventListener('click', () => {
        const entry1 = document.getElementById('entry-1');
        if (entry1) {
          entry1.scrollIntoView({ behavior: 'smooth' });
          if (!isAudioPlaying) startMusic();
        }
      });
    }

    if (navJournalBtn) {
      navJournalBtn.addEventListener('click', () => {
        document.getElementById('entry-1').scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (navCommunityBtn) {
      navCommunityBtn.addEventListener('click', () => {
        document.getElementById('community-wall-section').scrollIntoView({ behavior: 'smooth' });
      });
    }

    if (brandCrestBtn) {
      brandCrestBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    updateTimelineProgress();
  }

  function updateTimelineProgress() {
    const scrollPos = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight - windowHeight;
    const progress = Math.min(Math.max(scrollPos / (docHeight || 1), 0), 1);

    if (railProgressBar) {
      railProgressBar.style.height = `${progress * 100}%`;
    }

    // Determine active section
    let currentIdx = 0;
    sections.forEach((sec, idx) => {
      const top = sec.offsetTop - windowHeight * 0.35;
      if (scrollPos >= top) {
        currentIdx = idx;
      }
    });

    // Update active node & bead position
    railNodes.forEach((node, idx) => {
      const isActive = idx === currentIdx;
      node.classList.toggle('active', isActive);
      if (isActive && railActiveBead) {
        const nodeRect = node.getBoundingClientRect();
        const railRect = timelineRail.getBoundingClientRect();
        const relativeTop = nodeRect.top - railRect.top + nodeRect.height / 2;
        railActiveBead.style.top = `${relativeTop}px`;
      }
    });

    // Update nav view tabs
    if (navJournalBtn && navCommunityBtn) {
      const inCommunity = currentIdx === 6;
      navJournalBtn.classList.toggle('active', !inCommunity);
      navCommunityBtn.classList.toggle('active', inCommunity);
    }
  }

  /* =========================================================================
     3. AMBIENT AUDIO & SOFT MUSIC ENGINE (STATIC & GITHUB READY)
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
      audioVolumeSlider.addEventListener('input', (e) => {
        const val = e.target.value / 100;
        if (audioPlayer) audioPlayer.volume = val;
        if (volumeLabel) volumeLabel.textContent = `${e.target.value}%`;
      });
    }
  }

  function startMusic() {
    if (!audioPlayer) {
      audioPlayer = new Audio();
      audioPlayer.volume = (config.AUDIO && config.AUDIO.volume) || 0.35;
      audioPlayer.addEventListener('ended', nextTrack);
      audioPlayer.addEventListener('error', () => setTimeout(nextTrack, 1000));
    }

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
     4. LIGHTBOX ZOOM ENGINE
     ========================================================================= */
  function initLightboxTriggers() {
    // Global Event Delegation for all zoomable photos & polaroids
    document.addEventListener('click', (e) => {
      const zoomItem = e.target.closest('.photo-zoomable, .scatter-polaroid-item');
      if (zoomItem) {
        const img = zoomItem.querySelector('img');
        const src = zoomItem.getAttribute('data-src') || (img ? img.src : '');
        const title = zoomItem.getAttribute('data-title') || (img ? img.alt : '');
        const caption = zoomItem.getAttribute('data-caption') || 'Kept loose, cherished forever.';
        if (src) {
          openLightbox(src, title, caption);
        }
      }
    });

    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (lightboxCloseBackdrop) lightboxCloseBackdrop.addEventListener('click', closeLightbox);
  }

  function openLightbox(src, title, caption) {
    if (!mediaLightbox || !src) return;
    lightboxMediaTarget.innerHTML = `<img src="${src}" alt="${title || ''}">`;
    lightboxTitle.textContent = title || '';
    lightboxCaption.textContent = caption || '';
    mediaLightbox.classList.add('active');
  }

  function closeLightbox() {
    if (mediaLightbox) mediaLightbox.classList.remove('active');
  }

  /* =========================================================================
     5. COMMUNITY PHOTO WALL & UPLOAD ENGINE
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
      uploadErrorMsg.style.display = 'none';
      uploadPhotoModal.classList.add('active');
    }
  }

  function closeUploadModal() {
    if (uploadPhotoModal) uploadPhotoModal.classList.remove('active');
  }

  function submitCommunityPhoto() {
    const fatherName = fatherNameInput.value.trim();
    const uploaderName = uploaderNameInput.value.trim();
    const caption = uploaderCaptionInput.value.trim();

    if (!currentUploadedPhotoData || !fatherName || !uploaderName) {
      uploadErrorMsg.style.display = 'block';
      return;
    }

    const newPhoto = {
      url: currentUploadedPhotoData,
      title: `Father: ${fatherName}`,
      caption: caption || 'Honoring our beloved father',
      uploader: uploaderName,
      date: new Date().toLocaleDateString()
    };

    // Save to localStorage for instant static client persistence
    try {
      const stored = JSON.parse(localStorage.getItem(COMMUNITY_STORAGE_KEY) || '[]');
      stored.unshift(newPhoto);
      localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(stored));
    } catch (e) {}

    closeUploadModal();
    initCommunityWall();
    showToast(`Photo for ${fatherName} added to Wall of Honor!`);
    
    // Smooth scroll down to the community wall
    document.getElementById('community-wall-section').scrollIntoView({ behavior: 'smooth' });
  }

  function initCommunityWall() {
    if (!communityCollageBoard) return;
    communityCollageBoard.innerHTML = '';

    // 1. Primary Feature for Dad
    const dadPrimaryCard = {
      url: "assets/photos/464825450_10225438053368831_2504579000914362514_n.jpg",
      title: "Ratu Nautu Latunipulu",
      caption: "Our Pillar of Strength & Wisdom",
      uploader: "Latunipulu Family",
      tilt: "-2deg"
    };

    // 2. Fetch locally stored community photos
    let communityPhotos = [];
    try {
      communityPhotos = JSON.parse(localStorage.getItem(COMMUNITY_STORAGE_KEY) || '[]');
    } catch (e) {}

    const allPhotos = [dadPrimaryCard, ...communityPhotos];

    // Render photo cards
    allPhotos.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = 'polaroid-scatter-card';
      const tilt = item.tilt || `${((idx % 5) - 2) * 2.2}deg`;
      card.style.transform = `rotate(${tilt})`;

      card.innerHTML = `
        <div class="scotch-tape"></div>
        <div class="polaroid-img-wrap">
          <img src="${item.url}" alt="${item.title}" loading="lazy">
        </div>
        <div class="polaroid-meta">
          <div class="polaroid-card-caption">${item.title}</div>
          <div class="polaroid-card-subcaption">"${item.caption}"</div>
          <div class="polaroid-card-uploader">✦ Shared by ${item.uploader}</div>
        </div>
      `;

      card.addEventListener('click', () => openLightbox(item.url, item.title, `${item.caption} — Shared by ${item.uploader}`));
      communityCollageBoard.appendChild(card);
    });

    // 3. Render 5 interactive empty upload spaces
    for (let s = 0; s < 5; s++) {
      const emptySlot = document.createElement('div');
      emptySlot.className = 'polaroid-scatter-card empty-slot-card';
      const tilt = `${((s % 5) - 2) * 2}deg`;
      emptySlot.style.transform = `rotate(${tilt})`;

      emptySlot.innerHTML = `
        <div class="scotch-tape"></div>
        <div class="polaroid-img-wrap empty-slot-box">
          <span class="empty-slot-plus">＋</span>
          <span class="empty-slot-text">Add Your Father</span>
        </div>
        <div class="polaroid-meta">
          <div class="polaroid-card-caption">✦ Reserved Space ✦</div>
          <div class="polaroid-card-subcaption">Tap to add your father to the Wall of Honor</div>
        </div>
      `;

      emptySlot.addEventListener('click', openUploadModal);
      communityCollageBoard.appendChild(emptySlot);
    }
  }

  /* =========================================================================
     6. CONFETTI CELEBRATION ENGINE
     ========================================================================= */
  function initConfetti() {
    if (confettiLaunchBtn) {
      confettiLaunchBtn.addEventListener('click', launchCelebrationConfetti);
    }
  }

  function launchCelebrationConfetti() {
    const colors = ['#dfb76c', '#f3cf7a', '#b85d19', '#ffffff', '#e28743', '#8b1d1d'];
    const count = 120;

    for (let i = 0; i < count; i++) {
      const conf = document.createElement('div');
      conf.style.position = 'fixed';
      conf.style.left = `${Math.random() * 100}vw`;
      conf.style.top = `-20px`;
      conf.style.width = `${Math.random() * 10 + 6}px`;
      conf.style.height = `${Math.random() * 14 + 8}px`;
      conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      conf.style.opacity = Math.random() + 0.5;
      conf.style.transform = `rotate(${Math.random() * 360}deg)`;
      conf.style.zIndex = '9999';
      conf.style.pointerEvents = 'none';
      conf.style.transition = `top ${Math.random() * 2.5 + 2}s cubic-bezier(0.25, 1, 0.5, 1), transform ${Math.random() * 3 + 2}s ease`;

      document.body.appendChild(conf);

      setTimeout(() => {
        conf.style.top = `${window.innerHeight + 40}px`;
        conf.style.transform = `rotate(${Math.random() * 720}deg) translateX(${Math.random() * 200 - 100}px)`;
        conf.style.opacity = '0';
      }, 20);

      setTimeout(() => {
        conf.remove();
      }, 4500);
    }

    showToast('🎉 Happy Father\'s Day, Dad!');
  }

  /* =========================================================================
     7. AMBIENT GOLDEN DUST CANVAS PARTICLES
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
    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 2.2 + 0.6,
        speedY: Math.random() * 0.4 + 0.15,
        speedX: (Math.random() - 0.5) * 0.3,
        alpha: Math.random() * 0.7 + 0.2
      });
    }

    function renderParticles() {
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

      requestAnimationFrame(renderParticles);
    }

    renderParticles();
  }

  /* =========================================================================
     8. TOAST & FULLSCREEN
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

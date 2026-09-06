/**
 * =========================================================================
 * FATHER'S DAY POLAROID KEEPSAKE STUDIO ENGINE (2026 EDITION)
 * =========================================================================
 * - 3-Layer Canvas Compositing:
 *     Layer 1: Background Flatlay (Wood, Best Dad Cap, Paper Note, Keys, Wallet)
 *     Layer 2: User's Uploaded Father Photo (Smooth Pan, Zoom, Rotation, Touch Drag)
 *     Layer 3: Transparent-Window Polaroid Frame Overlay
 *     Layer 4: Inscribed Chin Message (Custom Fonts, Angles, Ink Colors)
 * - Formats:
 *     📱 Instagram/Facebook Story: 9:16 (1080 × 1920)
 *     📷 Instagram/Facebook Feed Post: 1:1 (1080 × 1080)
 * - High-Res PNG Download + Native Mobile Share API
 */

(function () {
  'use strict';

  // Modal & Trigger Elements
  const studioModal = document.getElementById('story-studio-modal');
  const openStudioBtns = document.querySelectorAll('.open-studio-trigger, #nav-story-studio-btn, #hero-studio-btn, #community-studio-btn');
  const closeStudioBtn = document.getElementById('studio-close-btn');
  const closeStudioBackdrop = document.getElementById('studio-close-backdrop');

  // Format Tabs
  const formatStoryBtn = document.getElementById('studio-format-story');
  const formatPostBtn = document.getElementById('studio-format-post');

  // Canvas & Workspace
  const studioCanvas = document.getElementById('studio-canvas');
  if (!studioCanvas) return;
  const ctx = studioCanvas.getContext('2d');

  // Interactive Inputs
  const photoInput = document.getElementById('studio-photo-input');
  const uploadPhotoBtn = document.getElementById('studio-upload-btn');
  const samplePhotoBtn = document.getElementById('studio-sample-btn');
  const zoomSlider = document.getElementById('studio-zoom-slider');
  const zoomLabel = document.getElementById('studio-zoom-label');
  const rotateSlider = document.getElementById('studio-rotate-slider');
  const rotateLabel = document.getElementById('studio-rotate-label');
  const resetPosBtn = document.getElementById('studio-reset-btn');

  // Text & Typography
  const captionInput = document.getElementById('studio-caption-input');
  const fontSelect = document.getElementById('studio-font-select');
  const fontSizeSlider = document.getElementById('studio-font-size-slider');
  const fontSizeLabel = document.getElementById('studio-font-size-label');
  const colorRadios = document.querySelectorAll('input[name="studio-ink-color"]');
  const presetChips = document.querySelectorAll('.studio-preset-chip');

  // Export & Share
  const downloadBtn = document.getElementById('studio-download-btn');
  const shareBtn = document.getElementById('studio-share-btn');

  // Constants & Template
  const OVERLAY_SRC = 'assets/photos/story_polaroid_overlay.png';
  const DEFAULT_PHOTO_SRC = 'assets/photos/THAT_KINDA_GUY.JPG';

  // Base canvas template dimensions (matches overlay image)
  const BASE_WIDTH = 940;
  const BASE_HEIGHT = 1672;

  // Window coordinates inside the 940x1672 template
  // Top-Left: (207, 560), Top-Right: (724, 506), Bottom-Right: (752, 1010), Bottom-Left: (254, 1074)
  const POLAROID_WINDOW_PTS = [
    { x: 207, y: 560 },
    { x: 724, y: 506 },
    { x: 752, y: 1010 },
    { x: 254, y: 1074 }
  ];
  // Center of the polaroid window:
  const WINDOW_CENTER_X = 484;
  const WINDOW_CENTER_Y = 787;
  // Polaroid tilt angle in radians
  const POLAROID_ANGLE = -0.105; // ~ -6.0 degrees

  // Center of the polaroid chin (where inscription goes)
  const CHIN_CENTER_X = 495;
  const CHIN_CENTER_Y = 1118;

  // State
  let currentFormat = 'story'; // 'story' | 'post'
  let overlayImg = null;
  let userImg = null;

  let state = {
    zoom: 1.0,
    rotation: 0, // degrees offset
    panX: 0,     // offset from WINDOW_CENTER_X
    panY: 0,     // offset from WINDOW_CENTER_Y
    caption: "Happy Father's Day, Dad! ❤️",
    fontFamily: "'Dancing Script', cursive",
    fontSize: 34,
    fontColor: '#23201d'
  };

  // Drag interaction
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let panStartX = 0;
  let panStartY = 0;

  /* =========================================================================
     INIT STUDIO
     ========================================================================= */
  function initStudio() {
    loadOverlayImage();
    loadDefaultUserImage();
    bindEvents();
  }

  function loadOverlayImage() {
    overlayImg = new Image();
    overlayImg.crossOrigin = 'anonymous';
    overlayImg.src = OVERLAY_SRC;
    overlayImg.onload = () => {
      render();
    };
  }

  function loadDefaultUserImage() {
    userImg = new Image();
    userImg.crossOrigin = 'anonymous';
    userImg.src = DEFAULT_PHOTO_SRC;
    userImg.onload = () => {
      render();
    };
  }

  /* =========================================================================
     EVENT BINDINGS
     ========================================================================= */
  function bindEvents() {
    // Open / Close modal
    openStudioBtns.forEach(btn => {
      btn.addEventListener('click', openStudioModal);
    });
    if (closeStudioBtn) closeStudioBtn.addEventListener('click', closeStudioModal);
    if (closeStudioBackdrop) closeStudioBackdrop.addEventListener('click', closeStudioModal);

    // Format toggle
    if (formatStoryBtn) {
      formatStoryBtn.addEventListener('click', () => setFormat('story'));
    }
    if (formatPostBtn) {
      formatPostBtn.addEventListener('click', () => setFormat('post'));
    }

    // Photo input
    if (uploadPhotoBtn && photoInput) {
      uploadPhotoBtn.addEventListener('click', () => photoInput.click());
      photoInput.addEventListener('change', handlePhotoUpload);
    }
    if (samplePhotoBtn) {
      samplePhotoBtn.addEventListener('click', loadDefaultUserImage);
    }

    // Sliders
    if (zoomSlider) {
      zoomSlider.addEventListener('input', (e) => {
        state.zoom = parseFloat(e.target.value);
        if (zoomLabel) zoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
        render();
      });
    }

    if (rotateSlider) {
      rotateSlider.addEventListener('input', (e) => {
        state.rotation = parseInt(e.target.value, 10);
        if (rotateLabel) rotateLabel.textContent = `${state.rotation}°`;
        render();
      });
    }

    if (resetPosBtn) {
      resetPosBtn.addEventListener('click', () => {
        state.zoom = 1.0;
        state.rotation = 0;
        state.panX = 0;
        state.panY = 0;
        if (zoomSlider) zoomSlider.value = 1.0;
        if (zoomLabel) zoomLabel.textContent = '100%';
        if (rotateSlider) rotateSlider.value = 0;
        if (rotateLabel) rotateLabel.textContent = '0°';
        render();
      });
    }

    // Typography
    if (captionInput) {
      captionInput.addEventListener('input', (e) => {
        state.caption = e.target.value;
        render();
      });
    }

    if (fontSelect) {
      fontSelect.addEventListener('change', (e) => {
        state.fontFamily = e.target.value;
        render();
      });
    }

    if (fontSizeSlider) {
      fontSizeSlider.addEventListener('input', (e) => {
        state.fontSize = parseInt(e.target.value, 10);
        if (fontSizeLabel) fontSizeLabel.textContent = `${state.fontSize}px`;
        render();
      });
    }

    colorRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          state.fontColor = e.target.value;
          render();
        }
      });
    });

    // Preset chips
    presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-text') || chip.textContent;
        state.caption = text;
        if (captionInput) captionInput.value = text;
        render();
      });
    });

    // Canvas Mouse & Touch Dragging
    setupCanvasInteractions();

    // Export & Share
    if (downloadBtn) downloadBtn.addEventListener('click', downloadKeepsake);
    if (shareBtn) shareBtn.addEventListener('click', shareKeepsake);
  }

  function setupCanvasInteractions() {
    // Mouse Drag
    studioCanvas.addEventListener('mousedown', (e) => {
      isDragging = true;
      const rect = studioCanvas.getBoundingClientRect();
      const scaleX = studioCanvas.width / rect.width;
      const scaleY = studioCanvas.height / rect.height;
      dragStartX = (e.clientX - rect.left) * scaleX;
      dragStartY = (e.clientY - rect.top) * scaleY;
      panStartX = state.panX;
      panStartY = state.panY;
      studioCanvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const rect = studioCanvas.getBoundingClientRect();
      const scaleX = studioCanvas.width / rect.width;
      const scaleY = studioCanvas.height / rect.height;
      const currentX = (e.clientX - rect.left) * scaleX;
      const currentY = (e.clientY - rect.top) * scaleY;

      state.panX = panStartX + (currentX - dragStartX);
      state.panY = panStartY + (currentY - dragStartY);
      render();
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        studioCanvas.style.cursor = 'grab';
      }
    });

    // Touch Drag (Mobile & iPad)
    studioCanvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isDragging = true;
        const touch = e.touches[0];
        const rect = studioCanvas.getBoundingClientRect();
        const scaleX = studioCanvas.width / rect.width;
        const scaleY = studioCanvas.height / rect.height;
        dragStartX = (touch.clientX - rect.left) * scaleX;
        dragStartY = (touch.clientY - rect.top) * scaleY;
        panStartX = state.panX;
        panStartY = state.panY;
      }
    }, { passive: true });

    studioCanvas.addEventListener('touchmove', (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const rect = studioCanvas.getBoundingClientRect();
      const scaleX = studioCanvas.width / rect.width;
      const scaleY = studioCanvas.height / rect.height;
      const currentX = (touch.clientX - rect.left) * scaleX;
      const currentY = (touch.clientY - rect.top) * scaleY;

      state.panX = panStartX + (currentX - dragStartX);
      state.panY = panStartY + (currentY - dragStartY);
      render();
    }, { passive: true });

    studioCanvas.addEventListener('touchend', () => {
      isDragging = false;
    }, { passive: true });
  }

  function handlePhotoUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        userImg = img;
        state.panX = 0;
        state.panY = 0;
        state.zoom = 1.0;
        state.rotation = 0;
        if (zoomSlider) zoomSlider.value = 1.0;
        if (zoomLabel) zoomLabel.textContent = '100%';
        if (rotateSlider) rotateSlider.value = 0;
        if (rotateLabel) rotateLabel.textContent = '0°';
        render();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  function setFormat(fmt) {
    currentFormat = fmt;
    if (formatStoryBtn) formatStoryBtn.classList.toggle('active', fmt === 'story');
    if (formatPostBtn) formatPostBtn.classList.toggle('active', fmt === 'post');

    if (downloadBtn) {
      downloadBtn.textContent = fmt === 'story' 
        ? '📥 Download 1080×1920 Story PNG' 
        : '📥 Download 1080×1080 Post PNG';
    }

    render();
  }

  function openStudioModal() {
    if (studioModal) {
      studioModal.classList.add('active');
      studioModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      setTimeout(render, 50);
    }
  }

  function closeStudioModal() {
    if (studioModal) {
      studioModal.classList.remove('active');
      studioModal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  /* =========================================================================
     CANVAS COMPOSITING RENDER ENGINE
     ========================================================================= */
  function render() {
    if (!overlayImg || !overlayImg.complete) return;

    if (currentFormat === 'story') {
      studioCanvas.width = BASE_WIDTH;
      studioCanvas.height = BASE_HEIGHT;
      renderStoryFormat(ctx, BASE_WIDTH, BASE_HEIGHT);
    } else {
      // 1:1 Square Post
      const squareSize = BASE_WIDTH; // 940x940
      studioCanvas.width = squareSize;
      studioCanvas.height = squareSize;
      renderPostFormat(ctx, squareSize);
    }
  }

  function renderStoryFormat(targetCtx, w, h) {
    // 1. Dark warm wooden base backdrop
    targetCtx.fillStyle = '#1e140d';
    targetCtx.fillRect(0, 0, w, h);

    // 2. Draw user photo clipped to the polaroid window (plus 15px bleed)
    if (userImg && userImg.complete) {
      targetCtx.save();
      // Define clipping polygon matching the inner polaroid window
      targetCtx.beginPath();
      targetCtx.moveTo(POLAROID_WINDOW_PTS[0].x, POLAROID_WINDOW_PTS[0].y);
      targetCtx.lineTo(POLAROID_WINDOW_PTS[1].x, POLAROID_WINDOW_PTS[1].y);
      targetCtx.lineTo(POLAROID_WINDOW_PTS[2].x, POLAROID_WINDOW_PTS[2].y);
      targetCtx.lineTo(POLAROID_WINDOW_PTS[3].x, POLAROID_WINDOW_PTS[3].y);
      targetCtx.closePath();
      targetCtx.clip();

      // Transform & draw user photo
      targetCtx.translate(WINDOW_CENTER_X + state.panX, WINDOW_CENTER_Y + state.panY);
      // Base rotation matches polaroid slant (-6deg) + user rotation
      const totalAngle = POLAROID_ANGLE + (state.rotation * Math.PI / 180);
      targetCtx.rotate(totalAngle);

      // Fit scale: cover a 540x540 polaroid window
      const baseFitScale = Math.max(540 / userImg.width, 540 / userImg.height);
      const drawScale = baseFitScale * state.zoom;
      const dw = userImg.width * drawScale;
      const dh = userImg.height * drawScale;

      targetCtx.drawImage(userImg, -dw / 2, -dh / 2, dw, dh);
      targetCtx.restore();
    }

    // 3. Draw Overlay on top (wood, hat, paper note, keys, wallet, polaroid frame)
    targetCtx.drawImage(overlayImg, 0, 0, w, h);

    // 4. Draw Inscription Text on Polaroid Chin
    drawChinInscription(targetCtx, CHIN_CENTER_X, CHIN_CENTER_Y, POLAROID_ANGLE);
  }

  function renderPostFormat(targetCtx, sqSize) {
    // Center square crop of the 940x1672 story image
    // Center around the polaroid (y ≈ 785)
    // from y = 785 - 470 = 315 to 315 + 940 = 1255
    const cropY = Math.round(WINDOW_CENTER_Y - sqSize / 2);

    targetCtx.fillStyle = '#1e140d';
    targetCtx.fillRect(0, 0, sqSize, sqSize);

    // Save and translate to account for crop
    targetCtx.save();
    targetCtx.translate(0, -cropY);

    // 1. Clip and draw user photo
    if (userImg && userImg.complete) {
      targetCtx.save();
      targetCtx.beginPath();
      targetCtx.moveTo(POLAROID_WINDOW_PTS[0].x, POLAROID_WINDOW_PTS[0].y);
      targetCtx.lineTo(POLAROID_WINDOW_PTS[1].x, POLAROID_WINDOW_PTS[1].y);
      targetCtx.lineTo(POLAROID_WINDOW_PTS[2].x, POLAROID_WINDOW_PTS[2].y);
      targetCtx.lineTo(POLAROID_WINDOW_PTS[3].x, POLAROID_WINDOW_PTS[3].y);
      targetCtx.closePath();
      targetCtx.clip();

      targetCtx.translate(WINDOW_CENTER_X + state.panX, WINDOW_CENTER_Y + state.panY);
      const totalAngle = POLAROID_ANGLE + (state.rotation * Math.PI / 180);
      targetCtx.rotate(totalAngle);

      const baseFitScale = Math.max(540 / userImg.width, 540 / userImg.height);
      const drawScale = baseFitScale * state.zoom;
      const dw = userImg.width * drawScale;
      const dh = userImg.height * drawScale;

      targetCtx.drawImage(userImg, -dw / 2, -dh / 2, dw, dh);
      targetCtx.restore();
    }

    // 2. Draw overlay
    targetCtx.drawImage(overlayImg, 0, 0, BASE_WIDTH, BASE_HEIGHT);

    // 3. Draw Inscription
    drawChinInscription(targetCtx, CHIN_CENTER_X, CHIN_CENTER_Y, POLAROID_ANGLE);

    targetCtx.restore();
  }

  function drawChinInscription(targetCtx, cx, cy, angle) {
    const text = (state.caption || '').trim();
    if (!text) return;

    targetCtx.save();
    targetCtx.translate(cx, cy);
    targetCtx.rotate(angle);

    targetCtx.font = `600 ${state.fontSize}px ${state.fontFamily}`;
    targetCtx.fillStyle = state.fontColor;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';

    // Subtle natural paper ink shadow
    targetCtx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    targetCtx.shadowBlur = 2;
    targetCtx.shadowOffsetX = 1;
    targetCtx.shadowOffsetY = 1;

    targetCtx.fillText(text, 0, 0);
    targetCtx.restore();
  }

  /* =========================================================================
     EXPORT (1080x1920 Story / 1080x1080 Post) & NATIVE SHARING
     ========================================================================= */
  function generateHighResCanvas() {
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');

    if (currentFormat === 'story') {
      exportCanvas.width = 1080;
      exportCanvas.height = 1920;
      // Scale from 940x1672 up to 1080x1920
      exportCtx.scale(1080 / BASE_WIDTH, 1920 / BASE_HEIGHT);
      renderStoryFormat(exportCtx, BASE_WIDTH, BASE_HEIGHT);
    } else {
      exportCanvas.width = 1080;
      exportCanvas.height = 1080;
      // Scale from 940x940 up to 1080x1080
      exportCtx.scale(1080 / BASE_WIDTH, 1080 / BASE_WIDTH);
      renderPostFormat(exportCtx, BASE_WIDTH);
    }

    return exportCanvas;
  }

  function downloadKeepsake() {
    const canvas = generateHighResCanvas();
    const link = document.createElement('a');
    const fmtName = currentFormat === 'story' ? 'FathersDay_Story_1080x1920' : 'FathersDay_Post_1080x1080';
    link.download = `${fmtName}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (window.showToast) {
      window.showToast(`🎉 Keepsake downloaded (${canvas.width}×${canvas.height})!`);
    }
  }

  async function shareKeepsake() {
    const canvas = generateHighResCanvas();
    if (!navigator.share || !canvas.toBlob) {
      downloadKeepsake();
      return;
    }

    canvas.toBlob(async (blob) => {
      if (!blob) {
        downloadKeepsake();
        return;
      }
      const file = new File([blob], 'Fathers_Day_Keepsake.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: "Happy Father's Day 2026 Keepsake",
            text: "Honoring Dad with our custom Father's Day Polaroid Keepsake ❤️"
          });
        } catch (err) {
          // User cancelled or share failed
        }
      } else {
        downloadKeepsake();
      }
    }, 'image/png');
  }

  // Initialize once DOM is ready
  document.addEventListener('DOMContentLoaded', initStudio);

  // Global handle
  window.FathersDayStudio = {
    open: openStudioModal,
    close: closeStudioModal,
    render: render
  };

})();

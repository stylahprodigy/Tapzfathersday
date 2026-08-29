/**
 * =========================================================================
 * CLIENT-SIDE SHIELD & ANTI-INSPECTION HARDENING (ARMORED LEVEL)
 * =========================================================================
 * Shields the interactive journal against scraping, right-click inspection,
 * DevTools tampering, shortcut hooks, and frame-hijacking.
 */

(function () {
  'use strict';

  // 1. Frame Busting (Prevent embedding in foreign iframes / clickjacking)
  if (window.top !== window.self) {
    try {
      window.top.location = window.self.location;
    } catch (e) {
      document.body.innerHTML = '<div style="background:#0b0c10;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">Access Denied.</div>';
    }
  }

  // 2. Console Sanitization & Shielding (Prevent log snooping)
  try {
    const noop = function () {};
    window.console.log = noop;
    window.console.info = noop;
    window.console.warn = noop;
    window.console.debug = noop;
    window.console.dir = noop;
    window.console.table = noop;
  } catch (e) {}

  // 3. Disable Context Menu (Right Click)
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    e.stopPropagation();
    showShieldToast('Protected Archive');
    return false;
  }, { capture: true });

  // 4. Block All Developer Keys, Inspection & Source Shortcuts
  document.addEventListener('keydown', function (e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    const key = (e.key || '').toLowerCase();
    const isCtrlOrMeta = e.ctrlKey || e.metaKey;

    // Ctrl+Shift+I / J / C / K / E (Inspectors & Consoles)
    if (isCtrlOrMeta && e.shiftKey && (key === 'i' || key === 'j' || key === 'c' || key === 'k' || key === 'e')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Ctrl+U (View Source), Ctrl+S (Save Page), Ctrl+P (Print), Ctrl+H (History)
    if (isCtrlOrMeta && (key === 'u' || key === 's' || key === 'p' || key === 'h')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }

    // Alt+Cmd+I / J / C (Mac Web Inspector)
    if (e.altKey && e.metaKey && (key === 'i' || key === 'j' || key === 'c')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });

  // 5. Disable Drag & Drop image/video harvesting
  document.addEventListener('dragstart', function (e) {
    if (e.target.nodeName === 'IMG' || e.target.nodeName === 'VIDEO') {
      e.preventDefault();
      return false;
    }
  }, { capture: true });

  // 6. Active DevTools Detection & Shield Masking
  let devToolsOpen = false;
  const threshold = 160;

  function triggerShieldMode() {
    if (!devToolsOpen) {
      devToolsOpen = true;
      const mask = document.getElementById('devtools-mask');
      if (mask) mask.style.display = 'flex';
      try { window.console.clear(); } catch (e) {}
    }
  }

  function releaseShieldMode() {
    if (devToolsOpen) {
      devToolsOpen = false;
      const mask = document.getElementById('devtools-mask');
      if (mask) mask.style.display = 'none';
    }
  }

  setInterval(function () {
    const widthDiff = window.outerWidth - window.innerWidth > threshold;
    const heightDiff = window.outerHeight - window.innerHeight > threshold;
    
    if (widthDiff || heightDiff) {
      triggerShieldMode();
    } else {
      releaseShieldMode();
    }
  }, 600);

  // Anti-Debugger heartbeat (trips paused debugger hooks if opened)
  setInterval(function () {
    if (devToolsOpen) {
      (function () { Function('debugger')(); })();
    }
  }, 2000);

  // 7. Security Shield Toast Notification
  function showShieldToast(text) {
    let toast = document.getElementById('security-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'security-toast';
      toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(20,20,24,0.9);color:#e2d9c8;border:1px solid #d4af37;padding:8px 18px;border-radius:20px;font-size:12px;letter-spacing:1px;font-family:sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.5);z-index:999999;pointer-events:none;opacity:0;transition:opacity 0.3s;';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.style.opacity = '0';
    }, 1500);
  }

  const _ADMIN_HASH = "a53588f1e461837471ab3313991465f972a27ebd8bb7a5df776f4dc763adb305";

  async function computeSha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 8. Passcode & Visitor Gatekeeper Storage Management
  window.SecurityGatekeeper = {
    isPasscodeUnlocked: function () {
      if (!window.JOURNAL_CONFIG || !window.JOURNAL_CONFIG.PASSCODE) return true;
      return sessionStorage.getItem('__journal_passcode_ok__') === 'true' || sessionStorage.getItem('__journal_unlocked__') === 'true';
    },
    isVisitorEntered: function () {
      return !!sessionStorage.getItem('__journal_visitor_name__');
    },
    isAdmin: function () {
      return sessionStorage.getItem('__journal_is_admin__') === 'true';
    },
    isFullyUnlocked: function () {
      if (this.isAdmin()) return true;
      if (!window.JOURNAL_CONFIG || !window.JOURNAL_CONFIG.PASSCODE) {
        return this.isVisitorEntered();
      }
      return this.isPasscodeUnlocked() && this.isVisitorEntered();
    },
    validate: async function (enteredCode) {
      const code = (enteredCode || '').trim();
      const codeLower = code.toLowerCase();
      const codeUpper = code.toUpperCase();

      // 1. Check Admin Vault Passcode (Cryptographic SHA-256 hash check)
      try {
        const hash = await computeSha256(codeLower);
        if (hash === _ADMIN_HASH) {
          sessionStorage.setItem('__journal_is_admin__', 'true');
          sessionStorage.setItem('__journal_passcode_ok__', 'true');
          sessionStorage.setItem('__journal_visitor_name__', 'Admin');
          sessionStorage.setItem('__journal_unlocked__', 'true');
          return 'ADMIN_UNLOCKED';
        }
      } catch (e) {}

      // 2. Check Standard Family Vault Passcode
      const targetCode = (window.JOURNAL_CONFIG && window.JOURNAL_CONFIG.PASSCODE ? window.JOURNAL_CONFIG.PASSCODE : '').trim().toUpperCase();
      if (!targetCode || codeUpper === targetCode) {
        sessionStorage.setItem('__journal_passcode_ok__', 'true');
        return 'PASSCODE_OK';
      }

      return false;
    },
    recordVisitorLocally: function (name, note) {
      sessionStorage.setItem('__journal_visitor_name__', name);
      if (note) sessionStorage.setItem('__journal_visitor_note__', note);
      sessionStorage.setItem('__journal_unlocked__', 'true');

      // Append to persistent client ledger for offline/failover support
      try {
        const stored = localStorage.getItem('__dad_visitor_ledger__');
        const list = stored ? JSON.parse(stored) : [];
        list.push({
          id: Date.now(),
          name: name,
          note: note || '',
          timestamp: new Date().toLocaleString(),
          ip: 'Local/Client Session'
        });
        localStorage.setItem('__dad_visitor_ledger__', JSON.stringify(list));
      } catch (e) {}
    }
  };

})();

/**
 * =========================================================================
 * CLIENT-SIDE SHIELD & VISITOR IDENTITY ENGINE (2026 UPDATE)
 * =========================================================================
 * - Removed passcode gate; visitor authentication is persistent via localStorage.
 * - Admin identity activation via visitor name: 'Admin134434'.
 * - Right-click and developer shortcut protection.
 */

(function () {
  'use strict';

  // 1. One-time clean slate for update launch: clear past admin & unlocked states
  try {
    if (!localStorage.getItem('__dad_2026_clean_launch__')) {
      sessionStorage.clear();
      localStorage.removeItem('tapz_unlocked_v2');
      localStorage.removeItem('__journal_passcode_ok__');
      localStorage.removeItem('__journal_is_admin__');
      localStorage.removeItem('dad_is_admin');
      localStorage.removeItem('dad_visitor_name');
      localStorage.setItem('__dad_2026_clean_launch__', 'true');
    }
  } catch (e) {}

  // 2. Frame Busting (Prevent embedding in foreign iframes / clickjacking)
  if (window.top !== window.self) {
    try {
      window.top.location = window.self.location;
    } catch (e) {
      document.body.innerHTML = '<div style="background:#0b0c10;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">Access Denied.</div>';
    }
  }

  // 3. Disable Context Menu (Right Click) with soft notice
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
    e.stopPropagation();
    showShieldToast('Protected Archive');
    return false;
  }, { capture: true });

  // 4. Block Developer Inspection Shortcuts
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

    // Ctrl+U (View Source), Ctrl+S (Save Page)
    if (isCtrlOrMeta && (key === 'u' || key === 's')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, { capture: true });

  // 5. Toast Notification for Shield Notice
  function showShieldToast(text) {
    let toast = document.getElementById('security-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'security-toast';
      toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:rgba(20,20,24,0.95);color:#dfb76c;border:1px solid #dfb76c;padding:8px 18px;border-radius:20px;font-size:12px;letter-spacing:1px;font-family:sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.5);z-index:999999;pointer-events:none;opacity:0;transition:opacity 0.3s;';
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () {
      toast.style.opacity = '0';
    }, 1500);
  }

  // 6. Security & Visitor Gatekeeper Manager
  const ADMIN_NAME_TARGET = 'Admin134434';

  window.SecurityGatekeeper = {
    // Passcode requirement permanently removed
    isPasscodeUnlocked: function () {
      return true;
    },

    // Check if visitor has registered and is saved
    getVisitorName: function () {
      try {
        return localStorage.getItem('dad_visitor_name') || '';
      } catch (e) {
        return '';
      }
    },

    isVisitorEntered: function () {
      return !!this.getVisitorName();
    },

    isAdmin: function () {
      try {
        if (localStorage.getItem('dad_is_admin') === 'true') return true;
        const currentName = (this.getVisitorName() || '').trim();
        return currentName.toLowerCase() === ADMIN_NAME_TARGET.toLowerCase();
      } catch (e) {
        return false;
      }
    },

    // Main unlock state check (returns true if visitor has already been remembered)
    isFullyUnlocked: function () {
      return this.isVisitorEntered();
    },

    // Process visitor registration from the "Who is visiting?" modal
    registerVisitor: function (rawName, note) {
      const name = (rawName || '').trim();
      if (!name) return { success: false, message: 'Please enter your name.' };

      const isAdminLogin = (name.toLowerCase() === ADMIN_NAME_TARGET.toLowerCase());

      try {
        if (isAdminLogin) {
          localStorage.setItem('dad_is_admin', 'true');
          localStorage.setItem('dad_visitor_name', ADMIN_NAME_TARGET);
        } else {
          localStorage.setItem('dad_is_admin', 'false');
          localStorage.setItem('dad_visitor_name', name);

          // Append to client ledger for offline/failover support
          const stored = localStorage.getItem('dad_visitor_ledger');
          const list = stored ? JSON.parse(stored) : [];
          list.push({
            id: Date.now(),
            name: name,
            note: (note || '').trim(),
            timestamp: new Date().toLocaleString()
          });
          localStorage.setItem('dad_visitor_ledger', JSON.stringify(list));
        }
      } catch (e) {}

      return {
        success: true,
        isAdmin: isAdminLogin,
        name: isAdminLogin ? ADMIN_NAME_TARGET : name
      };
    },

    // Allow changing visitor name at any time
    resetVisitor: function () {
      try {
        localStorage.removeItem('dad_visitor_name');
        localStorage.removeItem('dad_is_admin');
      } catch (e) {}
    }
  };

})();

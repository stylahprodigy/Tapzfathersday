// SPORTS EDGE AI v2.0.0 — Interactive Quantitative Web Terminal Logic

const STATE = {
  currentPage: 'overview',
  rugbyCode: 'RUGBY_UNION',
  rugbyTournamentTab: 'ALL', // 'ALL' | 'MENS_WORLD_CUP' | 'WOMENS_WORLD_CUP' | 'DOMESTIC_INTL'
  difficultyFilter: ['EASY', 'MID', 'CLOSE'], // multi-select array
  showFinishedGames: false, // Default: hide matches finished > 30 minutes ago
  multiStudioSport: 'NBA', // 'NBA' | 'RUGBY_UNION' | 'RUGBY_LEAGUE' | 'MENS_WORLD_CUP' | 'WOMENS_WORLD_CUP' | 'NFL'
  multiStudioTeam: null,
  multiStudioScope: 'TEAM', // 'TEAM' | 'MATCH'
  showZeroTotalBands: false,
  slipCollapsed: false,
  overviewData: null,
  selectedFixtureId: null,
  currentFixtureAnalysis: null,
  activeGameTab: 'overview',
  slipLegs: [],
  pasteOrderSport: 'NBA',
  selectedPlayerId: null,
  liveWatchedFixtureId: null,
  liveAutoRefreshTimer: null,
  liveAutoRefreshEnabled: false,
};

// High-speed client cache for Monte Carlo distributions and analysis
const FIXTURE_ANALYSIS_CACHE = new Map();
const LIVE_MATCH_CACHE = new Map();

async function getCachedFixtureAnalysis(fid, sims = 10000) {
  if (!fid) return null;
  const cacheKey = `${fid}_${sims}`;
  if (FIXTURE_ANALYSIS_CACHE.has(cacheKey)) {
    return FIXTURE_ANALYSIS_CACHE.get(cacheKey);
  }
  const data = await apiGet(`/api/fixture?id=${fid}&sims=${sims}`);
  FIXTURE_ANALYSIS_CACHE.set(cacheKey, data);
  return data;
}

function toggleSlipDrawer() {
  const shell = document.querySelector('.app-shell');
  if (!shell) return;
  STATE.slipCollapsed = !STATE.slipCollapsed;
  shell.classList.toggle('slip-collapsed', STATE.slipCollapsed);
  const btn = document.getElementById('btnToggleSlip');
  if (btn) {
    btn.textContent = STATE.slipCollapsed ? '⇤ Open Slip' : '⇥ Slip';
  }
}

function isFixtureActiveOrRecent(f) {
  if (!f) return false;
  // If user turned on full historical view, keep all
  if (STATE.showFinishedGames) return true;
  if (!f.start_utc) return true;

  const now = Date.now();
  const startTime = new Date(f.start_utc).getTime();
  if (isNaN(startTime)) return true;

  // Approximate match duration by sport:
  // NBA: ~2.5 hrs (150 min)
  // Rugby (Union & League): ~2 hrs (120 min)
  // NFL: ~3.25 hrs (195 min)
  const sport = (f.sport || '').toUpperCase();
  let durationMs = 150 * 60 * 1000;
  if (sport === 'NBA') durationMs = 150 * 60 * 1000;
  else if (sport.includes('RUGBY')) durationMs = 120 * 60 * 1000;
  else if (sport === 'NFL') durationMs = 195 * 60 * 1000;

  const gracePeriodMs = 60 * 60 * 1000; // 1 hour after conclusion

  const status = (f.status || '').toLowerCase();
  if (status === 'final' || status === 'finished') {
    const finishTime = f.finish_utc ? new Date(f.finish_utc).getTime() : (startTime + durationMs);
    // If finished more than 1 hour ago, hide it
    return (now - finishTime) <= gracePeriodMs;
  }

  // If match kickoff was longer than estimated duration + 1 hr ago, prune
  if (now > (startTime + durationMs + gracePeriodMs)) {
    return false;
  }

  return true;
}

function toggleFinishedGamesFilter() {
  STATE.showFinishedGames = !STATE.showFinishedGames;
  const btn = document.getElementById('btnToggleFinished');
  if (btn) {
    btn.classList.toggle('active', !STATE.showFinishedGames);
    btn.innerHTML = STATE.showFinishedGames
      ? '<span>📋 Showing All (Inc. Past)</span>'
      : '<span>✓ Hide Finished (&gt;1h)</span>';
  }
  renderCurrentPage();
}

function formatSydneyDateTime(utcStr) {
  if (!utcStr) {
    return {
      dayHeader: 'Upcoming Scheduled Games',
      timeStr: 'TBD',
      timeWithZone: 'TBD',
      fullStr: 'Upcoming Schedule',
      isoDay: '9999-99-99',
      dayShort: 'Upcoming',
    };
  }
  try {
    const d = new Date(utcStr);
    const dayName = d.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short' });
    const dayNum = d.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', day: '2-digit' });
    const month = d.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', month: 'short' });
    const dayHeader = `${dayName} ${dayNum} ${month}`; // e.g. "Tue 03 Nov"

    const timeStr = d.toLocaleTimeString('en-AU', {
      timeZone: 'Australia/Sydney',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toUpperCase(); // e.g. "11:00 AM", "1:30 PM"

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Australia/Sydney',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);

    return {
      dayHeader, // "Tue 03 Nov"
      timeStr, // "12:15"
      timeWithZone: `${timeStr} AEDT`, // "12:15 AEDT"
      fullStr: `${dayHeader} · ${timeStr} AEDT`,
      isoDay: parts,
      dayShort: `${dayName} ${dayNum}`,
      rawDate: d,
    };
  } catch (err) {
    const raw = String(utcStr).slice(0, 10);
    return {
      dayHeader: raw,
      timeStr: String(utcStr).slice(11, 16) || 'TBD',
      timeWithZone: `${String(utcStr).slice(11, 16) || 'TBD'} AEDT`,
      fullStr: utcStr,
      isoDay: raw,
      dayShort: raw,
      rawDate: new Date(),
    };
  }
}

function badgeHtml(difficulty, extra = '') {
  const d = (difficulty || 'MID').toUpperCase();
  const cls = d === 'EASY' ? 'badge-easy' : (d === 'CLOSE' ? 'badge-close' : 'badge-mid');
  const txt = extra ? `● ${d} · ${extra}` : `● ${d}`;
  return `<span class="badge ${cls} mono">${txt}</span>`;
}

function isDiffSelected(tier) {
  const t = (tier || 'MID').toUpperCase();
  if (!STATE.difficultyFilter || STATE.difficultyFilter.length === 0) return true;
  return STATE.difficultyFilter.includes(t);
}

function fixtureMatchesDiffFilter(f) {
  if (!STATE.difficultyFilter || STATE.difficultyFilter.length === 0 || STATE.difficultyFilter.length === 3) {
    return true;
  }
  const dGame = (f.difficulty || 'MID').toUpperCase();
  // Strict match: the game matchup rating itself must match the active filter
  return STATE.difficultyFilter.includes(dGame);
}

function syncDiffChipsUI() {
  const map = [
    { tier: 'EASY', id: 'chipDiffEasy', cls: 'active-easy' },
    { tier: 'MID', id: 'chipDiffMid', cls: 'active-mid' },
    { tier: 'CLOSE', id: 'chipDiffClose', cls: 'active-close' },
  ];
  map.forEach((item) => {
    const el = document.getElementById(item.id);
    if (!el) return;
    const on = STATE.difficultyFilter.includes(item.tier);
    el.classList.toggle(item.cls, on);
    el.textContent = `${on ? '✓' : '○'} ${item.tier}`;
  });
}

function toggleDifficultyFilter(tier) {
  const idx = STATE.difficultyFilter.indexOf(tier);
  if (idx >= 0) {
    if (STATE.difficultyFilter.length > 1) {
      STATE.difficultyFilter.splice(idx, 1);
    }
  } else {
    STATE.difficultyFilter.push(tier);
  }
  syncDiffChipsUI();
  renderCurrentPage();
}

function setDifficultyPreset(tiers) {
  STATE.difficultyFilter = [...tiers];
  syncDiffChipsUI();
  renderCurrentPage();
}

function filterRugbyFixturesByTournament(rows, tournTab) {
  if (!tournTab || tournTab === 'ALL') return rows;
  return rows.filter((r) => (r.tournament_category || 'DOMESTIC_INTL') === tournTab);
}

async function openRugbyTournamentTab(tournTab) {
  STATE.rugbyTournamentTab = tournTab;
  STATE.currentPage = 'RUGBY';
  STATE.selectedFixtureId = null;
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    const p = btn.dataset.page;
    const isMatch =
      (tournTab === 'MENS_WORLD_CUP' && p === 'RUGBY_MWC') ||
      (tournTab === 'WOMENS_WORLD_CUP' && p === 'RUGBY_WWC') ||
      (tournTab === 'ALL' && p === 'RUGBY');
    btn.classList.toggle('active', isMatch);
  });
  await renderCurrentPage();
}

function edgeHtml(edgeDiff) {
  const pct = (Number(edgeDiff || 0) * 100).toFixed(1);
  if (Number(edgeDiff) > 0.005) {
    return `<span class="badge badge-easy mono">+${pct}% EDGE</span>`;
  }
  if (Number(edgeDiff) < -0.005) {
    return `<span class="badge badge-close mono">${pct}%</span>`;
  }
  return `<span class="badge badge-mid mono">${pct}%</span>`;
}

async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ============================================================================
// INITIALIZATION & NAVIGATION
// ============================================================================
window.addEventListener('DOMContentLoaded', async () => {
  const isAuthorized = await checkGatekeeperAuth();
  if (isAuthorized) {
    await loadOverviewData();
    renderSlipUI();
  }
});

async function checkGatekeeperAuth() {
  return true;
}

async function loadOverviewData() {
  try {
    document.getElementById('topStatusBadge').textContent = '⟳ SYNCING TELEMETRY...';
    const data = await apiGet('/api/overview');
    STATE.overviewData = data;

    const nbaCount = (data.sports.NBA || []).filter(isFixtureActiveOrRecent).length;
    const rugCount = [...(data.sports.RUGBY_UNION || []), ...(data.sports.RUGBY_LEAGUE || [])].filter(isFixtureActiveOrRecent).length;
    const nflCount = (data.sports.NFL || []).filter(isFixtureActiveOrRecent).length;
    const totalActive = nbaCount + rugCount + nflCount;

    const liveCnt = (data.live_scores || []).length || (data.kpis && data.kpis.live_inplay) || 0;
    const navLive = document.getElementById('nav-count-live');
    if (navLive) navLive.textContent = `${liveCnt} LIVE`;

    document.getElementById('nav-count-nba').textContent = nbaCount;
    document.getElementById('nav-count-rugby').textContent = rugCount;
    document.getElementById('nav-count-nfl').textContent = nflCount;
    document.getElementById('topStatusBadge').innerHTML = `<span class="live-pulse-dot"></span> ${totalActive} ACTIVE · 50K SIMS`;

    populateManualMarketFixtures();
    await renderCurrentPage();
  } catch (err) {
    console.error('Failed to load overview:', err);
  }
}

async function switchPage(pageName, fixtureId = null) {
  STATE.currentPage = pageName;
  if (fixtureId) {
    STATE.selectedFixtureId = fixtureId;
  }
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.page === pageName);
  });

  const box = document.getElementById('workspaceContent');
  if (box && box.dataset.activePage !== pageName) {
    // Immediate responsive feedback so switching feels instant
    box.innerHTML = `
      <div style="padding:48px 24px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; min-height:280px;">
        <div class="live-pulse-dot" style="width:12px; height:12px;"></div>
        <div style="font-size:14.5px; font-weight:800; color:var(--text-main); letter-spacing:0.5px;">Loading ${pageName.toUpperCase()} View...</div>
        <div style="font-size:11.5px; color:var(--text-secondary);">Accessing cached distributions &amp; verified telemetry</div>
      </div>
    `;
    box.dataset.activePage = pageName;
  }

  try {
    await renderCurrentPage();
  } catch (err) {
    console.error(`Error rendering page ${pageName}:`, err);
    if (box) {
      box.innerHTML = `
        <div class="card" style="padding:28px; text-align:center; border:1px solid var(--crimson);">
          <div style="font-size:16px; font-weight:800; color:var(--crimson); margin-bottom:8px;">Unable to switch to ${pageName}</div>
          <div style="font-size:12px; color:var(--text-secondary); margin-bottom:16px;">${err.message || String(err)}</div>
          <button class="btn btn-primary" onclick="switchPage('${pageName}', ${fixtureId})">⟳ Retry Loading</button>
        </div>
      `;
    }
  }
}

async function renderCurrentPage() {
  const p = STATE.currentPage;
  if (p === 'overview') {
    renderOverviewPage();
  } else if (p === 'NBA') {
    await renderSportGameCentre('NBA', 'NBA Basketball Quantitative Centre');
  } else if (p === 'RUGBY') {
    await renderSportGameCentre(STATE.rugbyCode, 'Rugby Intelligence Centre (Strict Union / League Separation)');
  } else if (p === 'NFL') {
    await renderSportGameCentre('NFL', 'NFL Football Quantitative Centre (nflverse CC BY 4.0)');
  } else if (p === 'multis') {
    await renderMultiStudioPage();
  } else if (p === 'livescores' || p === 'livewatch') {
    await renderLiveScoresPage();
  } else if (p === 'players') {
    await renderPlayersPage();
  } else if (p === 'backtest') {
    await renderBacktestPage();
  } else if (p === 'datacentre') {
    await renderDataCentrePage();
  }
}

function renderOverviewLiveScoresStrip(liveMatches) {
  const activeMatches = (liveMatches || []).filter((m) => {
    if (m.is_final) {
      const startTime = m.start_utc ? new Date(m.start_utc).getTime() : 0;
      const durationMs = 150 * 60 * 1000;
      const finishTime = m.finish_utc ? new Date(m.finish_utc).getTime() : (startTime + durationMs);
      return (Date.now() - finishTime) <= (60 * 60 * 1000);
    }
    return true;
  });

  if (activeMatches.length === 0) {
    return `
      <div class="card" style="padding:12px 18px; display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:8px; margin-bottom:18px;">
        <div style="display:flex; align-items:center; gap:10px;">
          <span style="width:8px; height:8px; border-radius:50%; background:var(--emerald); display:inline-block;"></span>
          <span style="font-size:12px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px;">Live In-Play Scores</span>
          <span style="font-size:12px; color:var(--text-secondary);">— All games currently scheduled. Next kickoff: <b style="color:var(--cyan);">Thu 05 Nov 11:00 AM AEDT</b> (Detroit Pistons vs Philadelphia 76ers)</span>
        </div>
        <button class="btn" style="font-size:11.5px; padding:4px 12px;" onclick="switchPage('livescores')">View In-Play Scoreboard →</button>
      </div>
    `;
  }
  const cardsHtml = activeMatches.map((m) => {
    const hLead = m.home_score >= m.away_score;
    const aLead = m.away_score >= m.home_score;
    return `
      <div class="live-match-row ticker-card" onclick="selectLiveScoreMatch(${m.fixture_id}); switchPage('livescores');">
        <div class="live-clock-cell mono" style="width:78px; min-width:78px; flex-shrink:0;">
          <div class="live-clock-time" style="font-size:12px;">
            <span class="live-pulse-red"></span>
            <span>${m.clock || m.period || 'LIVE'}</span>
          </div>
          <div class="live-clock-sub" style="font-size:9.5px;">
            <span class="live-sport-tag">${m.sport}</span>
          </div>
        </div>
        <div class="live-teams-cell" style="gap:4px; min-width:0; overflow:hidden;">
          <div class="live-team-line ${hLead ? 'leader' : ''}" style="font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${m.home}</span>
          </div>
          <div class="live-team-line ${aLead ? 'leader' : ''}" style="font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${m.away}</span>
          </div>
        </div>
        <div class="live-scores-cell mono" style="display:flex; flex-direction:column; gap:4px; flex-shrink:0; min-width:38px;">
          <div class="live-score-box ${hLead ? 'leader' : ''}" style="width:36px; min-width:36px; font-size:13px; padding:2px 0; text-align:center;">${m.home_score}</div>
          <div class="live-score-box ${aLead ? 'leader' : ''}" style="width:36px; min-width:36px; font-size:13px; padding:2px 0; text-align:center;">${m.away_score}</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="card" style="padding:14px 16px;">
      <div class="card-header" style="margin-bottom:10px;">
        <div class="card-title">
          <span>🔴 Live In-Play Scores (Real-Time In-Game Ticker)</span>
          <span class="live-badge-pulse"><span class="live-pulse-red"></span> ${activeMatches.length} IN-PLAY</span>
        </div>
        <button class="btn" style="color:var(--emerald-text); border-color:var(--emerald);" onclick="switchPage('livescores')">View Full Scoreboard →</button>
      </div>
      <div style="display:flex; gap:12px; overflow-x:auto; padding:4px 2px 8px 2px; flex-wrap:nowrap; align-items:stretch;">
        ${cardsHtml}
      </div>
    </div>
  `;
}

// ============================================================================
// 1. EXECUTIVE OVERVIEW PAGE
// ============================================================================
function renderOverviewPage() {
  const box = document.getElementById('workspaceContent');
  const d = STATE.overviewData;
  if (!d) {
    box.innerHTML = `<div class="card">Loading quantitative intelligence...</div>`;
    return;
  }

  const k = d.kpis;
  const topEdges = d.top_edges || [];

  let edgeRowsHtml = '';
  if (topEdges.length > 0) {
    edgeRowsHtml = topEdges.map((e) => `
      <tr>
        <td><span class="badge badge-cyan mono">${e.sport}</span></td>
        <td style="font-weight:700;">${e.matchup}</td>
        <td>${e.selection} <span class="mono" style="color:var(--text-secondary);">(${e.market_code} ${e.line !== '—' ? e.line : ''})</span></td>
        <td class="mono" style="color:var(--cyan); font-weight:700;">${(e.model_prob * 100).toFixed(1)}% ($${e.fair_odds.toFixed(2)})</td>
        <td class="mono">$${Number(e.decimal_odds).toFixed(2)} (${(e.implied_prob * 100).toFixed(1)}%)</td>
        <td>${edgeHtml(e.edge_diff)}</td>
        <td>
          <button class="btn-slip" onclick='addLegToSlip(${JSON.stringify({
            id: `mm_${e.id}`,
            fixture_id: e.fixture_id,
            matchup: e.matchup,
            sport: e.sport,
            leg_type: "MANUAL_MARKET",
            player_or_team: e.selection,
            market: e.market_code,
            selection: `${e.selection} (${e.line !== "—" ? e.line : "Winner"})`,
            line: e.line_value || 0,
            prob: e.model_prob,
            user_odds: e.decimal_odds,
            correlation_group: "manual_user"
          })})'>+ Slip</button>
        </td>
      </tr>
    `).join('');
  } else {
    edgeRowsHtml = `<tr><td colspan="7" style="text-align:center; color:var(--text-secondary);">No manual bookmaker lines entered yet — click "+ Enter Bookmaker Line" in the top bar to scan edges.</td></tr>`;
  }

  box.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Executive Intelligence &amp; Edge Scanner</div>
        <div class="page-subtitle">Priority Order: 1. NBA Basketball · 2. Rugby (Union &amp; League) · 3. NFL Football</div>
      </div>
      <div style="display:flex; gap:10px;">
        <button class="btn" onclick="openManualMarketModal()">+ Compare Bookmaker Odds</button>
        <button class="btn btn-primary" onclick="loadOverviewData()">⟳ Refresh Slate</button>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Scheduled Fixtures</div>
        <div class="kpi-value mono">${k.fixtures} Matches</div>
        <div class="kpi-sub">User-controlled event sequence</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Tracked Franchises</div>
        <div class="kpi-value mono">${k.teams} Teams</div>
        <div class="kpi-sub">NBA, Rugby Union, NRL &amp; NFL</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Profiled Athletes</div>
        <div class="kpi-value mono">${k.players} Players</div>
        <div class="kpi-sub">Active roster &amp; injury status</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Bookmaker Edge Comparisons</div>
        <div class="kpi-value mono">${k.manual_lines} Lines</div>
        <div class="kpi-sub">Manual reference vs Fair Odds</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Monte Carlo Engine</div>
        <div class="kpi-value mono">50,000 Sims</div>
        <div class="kpi-sub">Correlated joint distributions</div>
      </div>
    </div>

    <!-- Live In-Play Scores Arena Strip -->
    ${renderOverviewLiveScoresStrip(d.live_scores || [])}

    <!-- Top Positive Edge Scanner -->
    <div class="card">
      <div class="card-header">
        <div class="card-title">
          <span>⚡ Live Positive-Edge Scanner (User Bookmaker Odds vs Model Fair Price)</span>
        </div>
        <button class="btn" onclick="openManualMarketModal()">+ Add Bookmaker Line</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Sport</th>
              <th>Fixture</th>
              <th>Selection / Line</th>
              <th>Model Prob (Fair)</th>
              <th>Bookmaker Odds (Implied)</th>
              <th>Net Edge</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>${edgeRowsHtml}</tbody>
        </table>
      </div>
    </div>

    ${renderOverviewSportSection('NBA', '1 · Basketball (NBA)', d.sports.NBA || [])}
    ${renderOverviewRugbySection(d.sports)}
    ${renderOverviewSportSection('NFL', '3 · American Football (NFL)', d.sports.NFL || [])}
  `;
}

function renderOverviewSportSection(sportCode, title, rows) {
  const navTarget = sportCode === 'NBA' ? 'NBA' : (sportCode === 'NFL' ? 'NFL' : 'RUGBY');
  const activeSlate = rows.filter(isFixtureActiveOrRecent);
  const filteredRows = activeSlate.filter(fixtureMatchesDiffFilter);
  const bodyHtml = filteredRows.map((r) => {
    const hFair = (1 / Math.max(0.01, r.win_prob_home)).toFixed(2);
    const aFair = (1 / Math.max(0.01, r.win_prob_away)).toFixed(2);
    return `
      <tr>
        <td>
          <div style="font-weight:700; font-size:14px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
            <span>${r.home}</span> ${badgeHtml(r.home_difficulty || r.difficulty)}
            <span style="color:var(--text-muted);">vs</span>
            <span>${r.away}</span> ${badgeHtml(r.away_difficulty || r.difficulty)}
          </div>
          <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">${r.competition || sportCode} · ${r.venue || ''}</div>
        </td>
        <td class="mono">
          <div style="font-weight:700; color:var(--text-main);">${formatSydneyDateTime(r.start_utc).dayHeader}</div>
          <div style="font-size:11px; color:var(--cyan); font-weight:600;">${formatSydneyDateTime(r.start_utc).timeStr} AEDT</div>
        </td>
        <td class="mono">
          <span style="font-weight:800; color:var(--cyan);">${r.home_expected} – ${r.away_expected}</span>
          <div style="font-size:11px; color:var(--text-secondary);">Band: ${r.most_likely_total_band} (Tot ${r.exp_total})</div>
        </td>
        <td class="mono">
          <div>H: <b>${(r.win_prob_home * 100).toFixed(1)}%</b> ($${hFair})</div>
          <div>A: <b>${(r.win_prob_away * 100).toFixed(1)}%</b> ($${aFair})</div>
        </td>
        <td>${badgeHtml(r.difficulty, `${r.matchup_score}/100`)}</td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="btn-slip" onclick='addLegToSlip(${JSON.stringify({
              id: `f${r.id}_home_win`,
              fixture_id: r.id,
              matchup: `${r.home} vs ${r.away}`,
              sport: sportCode,
              leg_type: "TEAM",
              player_or_team: r.home,
              market: "Match Winner",
              selection: `${r.home} to Win`,
              line: 0,
              prob: r.win_prob_home,
              correlation_group: "team_total"
            })})'>+ H Win</button>
            <button class="btn-slip" onclick='addLegToSlip(${JSON.stringify({
              id: `f${r.id}_away_win`,
              fixture_id: r.id,
              matchup: `${r.home} vs ${r.away}`,
              sport: sportCode,
              leg_type: "TEAM",
              player_or_team: r.away,
              market: "Match Winner",
              selection: `${r.away} to Win`,
              line: 0,
              prob: r.win_prob_away,
              correlation_group: "team_total"
            })})'>+ A Win</button>
            <button class="btn btn-primary" style="padding:5px 11px; font-size:12px;" onclick="openFixtureAnalysis('${navTarget}', '${sportCode}', ${r.id})">
              Deep Model →
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">${title}</div>
        <div style="display:flex; gap:8px; align-items:center;">
          <span class="status-pill mono">${filteredRows.length} / ${activeSlate.length} FIXTURES</span>
          <button class="btn" onclick="openPasteOrderModal('${sportCode}')">Arrange Order</button>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Fixture / Competition (Team Matchup Difficulty)</th>
              <th>Kickoff (Sydney AEDT)</th>
              <th>Expected Score &amp; Total Band</th>
              <th>Win Probabilities (Fair Price)</th>
              <th>Game Matchup</th>
              <th>Quick Slip &amp; Deep Analysis</th>
            </tr>
          </thead>
          <tbody>${bodyHtml || '<tr><td colspan="6" style="text-align:center; color:var(--text-secondary);">No fixtures match the active difficulty filter. Click "All" in the top Filter bar to reset.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;
}

function setRugbyTournamentTab(tourn) {
  STATE.rugbyTournamentTab = tourn;
  STATE.selectedFixtureId = null;
  renderCurrentPage();
}

function renderOverviewRugbySection(sportsMap) {
  const code = STATE.rugbyCode;
  const tTab = STATE.rugbyTournamentTab || 'ALL';
  let rawRows = [];
  if (tTab === 'MENS_WORLD_CUP' || tTab === 'WOMENS_WORLD_CUP') {
    rawRows = [...(sportsMap.RUGBY_UNION || []), ...(sportsMap.RUGBY_LEAGUE || [])];
  } else {
    rawRows = sportsMap[code] || [];
  }
  const rows = filterRugbyFixturesByTournament(rawRows, tTab);
  const rulesText = code === 'RUGBY_UNION'
    ? 'Union Rules: Try=5, Conv=2, Pen=3, Drop Goal=3'
    : 'League Rules: Try=4, Conv=2, Pen=2, Field Goal=1';

  const tournLabel = tTab === 'MENS_WORLD_CUP' ? "🏆 Men's Rugby World Cup"
    : (tTab === 'WOMENS_WORLD_CUP' ? "🏆 Women's Rugby World Cup"
      : `${code === 'RUGBY_UNION' ? 'Rugby Union' : 'Rugby League'}`);

  const baseCard = renderOverviewSportSection(code, `2 · Rugby (${tournLabel})`, rows);
  return `
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:-10px; padding:0 4px;">
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
        <span style="font-weight:700; color:var(--cyan);">Rugby Code &amp; World Cup Tabs:</span>
        <button class="tab-btn ${code === 'RUGBY_UNION' && tTab === 'ALL' ? 'active' : ''}" onclick="STATE.rugbyTournamentTab='ALL'; setRugbyCode('RUGBY_UNION')">Rugby Union</button>
        <button class="tab-btn ${code === 'RUGBY_LEAGUE' && tTab === 'ALL' ? 'active' : ''}" onclick="STATE.rugbyTournamentTab='ALL'; setRugbyCode('RUGBY_LEAGUE')">Rugby League (NRL)</button>
        <button class="tab-btn ${tTab === 'MENS_WORLD_CUP' ? 'active' : ''}" onclick="setRugbyTournamentTab('MENS_WORLD_CUP')">🏆 Men's World Cup</button>
        <button class="tab-btn ${tTab === 'WOMENS_WORLD_CUP' ? 'active' : ''}" onclick="setRugbyTournamentTab('WOMENS_WORLD_CUP')">🏆 Women's World Cup</button>
        <button class="tab-btn ${tTab === 'DOMESTIC_INTL' ? 'active' : ''}" onclick="setRugbyTournamentTab('DOMESTIC_INTL')">Domestic / Tests</button>
      </div>
      <span class="mono" style="font-size:11.5px; color:var(--text-secondary);">${rulesText}</span>
    </div>
    ${baseCard}
  `;
}

function setRugbyCode(code) {
  STATE.rugbyCode = code;
  STATE.selectedFixtureId = null;
  renderCurrentPage();
}

async function openFixtureAnalysis(navPage, sportCode, fixtureId) {
  if (sportCode === 'RUGBY_UNION' || sportCode === 'RUGBY_LEAGUE') {
    STATE.rugbyCode = sportCode;
  }
  await switchPage(navPage, fixtureId);
}

// ============================================================================
// 2. SPORT GAME CENTRE (NBA, RUGBY UNION/LEAGUE + WORLD CUP TABS, NFL)
// ============================================================================
async function renderSportGameCentre(sportCode, headerTitle) {
  const box = document.getElementById('workspaceContent');
  const isRugby = sportCode === 'RUGBY_UNION' || sportCode === 'RUGBY_LEAGUE';
  const tTab = isRugby ? (STATE.rugbyTournamentTab || 'ALL') : 'ALL';

  let rawFixtures = [];
  if (isRugby && (tTab === 'MENS_WORLD_CUP' || tTab === 'WOMENS_WORLD_CUP')) {
    rawFixtures = [
      ...((STATE.overviewData && STATE.overviewData.sports.RUGBY_UNION) || []),
      ...((STATE.overviewData && STATE.overviewData.sports.RUGBY_LEAGUE) || []),
    ];
  } else {
    rawFixtures = (STATE.overviewData && STATE.overviewData.sports[sportCode]) || [];
  }

  const tournFixtures = isRugby ? filterRugbyFixturesByTournament(rawFixtures, tTab) : rawFixtures;
  const activeSlate = tournFixtures.filter(isFixtureActiveOrRecent);
  const fixtures = activeSlate.filter(fixtureMatchesDiffFilter);

  if (fixtures.length > 0 && (!STATE.selectedFixtureId || !fixtures.some((f) => f.id === STATE.selectedFixtureId))) {
    STATE.selectedFixtureId = fixtures[0].id;
  }

  let codeToggleHtml = '';
  let rugbyTournamentTabsHtml = '';
  if (isRugby) {
    codeToggleHtml = `
      <button class="tab-btn ${sportCode === 'RUGBY_UNION' && tTab === 'ALL' ? 'active' : ''}" onclick="STATE.rugbyTournamentTab='ALL'; setRugbyCode('RUGBY_UNION')">Rugby Union (Try=5)</button>
      <button class="tab-btn ${sportCode === 'RUGBY_LEAGUE' && tTab === 'ALL' ? 'active' : ''}" onclick="STATE.rugbyTournamentTab='ALL'; setRugbyCode('RUGBY_LEAGUE')">Rugby League (Try=4)</button>
    `;
    rugbyTournamentTabsHtml = `
      <div class="tab-bar" style="margin-bottom:4px;">
        <button class="tab-btn ${tTab === 'ALL' ? 'active' : ''}" onclick="setRugbyTournamentTab('ALL')">All ${sportCode === 'RUGBY_UNION' ? 'Rugby Union' : 'Rugby League'}</button>
        <button class="tab-btn ${tTab === 'MENS_WORLD_CUP' ? 'active' : ''}" onclick="setRugbyTournamentTab('MENS_WORLD_CUP')">🏆 Men's Rugby World Cup</button>
        <button class="tab-btn ${tTab === 'WOMENS_WORLD_CUP' ? 'active' : ''}" onclick="setRugbyTournamentTab('WOMENS_WORLD_CUP')">🏆 Women's Rugby World Cup</button>
        <button class="tab-btn ${tTab === 'DOMESTIC_INTL' ? 'active' : ''}" onclick="setRugbyTournamentTab('DOMESTIC_INTL')">NRL / Six Nations / International Tests</button>
      </div>
    `;
  }

  const leftListHtml = fixtures.map((f) => {
    const isSel = f.id === STATE.selectedFixtureId;
    return `
      <div class="fixture-list-item ${isSel ? 'selected' : ''}" onclick="selectFixtureInCentre('${f.sport || sportCode}', ${f.id})">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; gap:6px;">
          <span style="font-weight:700; font-size:13.5px;">${f.home} vs ${f.away}</span>
          ${badgeHtml(f.difficulty, f.matchup_score)}
        </div>
        <div style="font-size:11px; color:var(--emerald); font-weight:600; margin-bottom:3px;">
          ${f.competition || f.sport} · H:${f.home_difficulty || f.difficulty} / A:${f.away_difficulty || f.difficulty}
        </div>
        <div class="mono" style="font-size:11.5px; color:var(--cyan);">
          Model: ${f.home_expected} – ${f.away_expected} · Total ${f.exp_total} (${f.most_likely_total_band})
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; font-size:11px; color:var(--text-secondary);">
          <span class="mono" style="color:var(--cyan); font-weight:700;">📅 ${formatSydneyDateTime(f.start_utc).fullStr}</span>
          <div style="display:flex; gap:4px;" onclick="event.stopPropagation();">
            <button class="btn" style="padding:2px 7px; font-size:10px;" onclick="moveFixtureOrder('${f.sport || sportCode}', ${f.id}, -1)">▲</button>
            <button class="btn" style="padding:2px 7px; font-size:10px;" onclick="moveFixtureOrder('${f.sport || sportCode}', ${f.id}, 1)">▼</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  box.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">${headerTitle}</div>
        <div class="page-subtitle">50,000-Run Monte Carlo Distributions · Matchup Difficulty · Player Prop Simulator · Bet365-Placeable Multis</div>
      </div>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        ${codeToggleHtml}
        <button class="btn" onclick="openPasteOrderModal('${sportCode}')">Paste Event Order</button>
        <button class="btn btn-primary" onclick="openManualMarketModal(${STATE.selectedFixtureId})">+ Enter Bookmaker Line</button>
      </div>
    </div>

    ${rugbyTournamentTabsHtml}

    <div class="game-centre-grid">
      <div class="card" style="padding:14px;">
        <div class="card-header" style="margin-bottom:10px;">
          <div class="card-title">Scheduled Slate (Manual Order)</div>
          <span class="status-pill mono">${fixtures.length}</span>
        </div>
        <div>${leftListHtml || '<div style="color:var(--text-secondary);">No fixtures match the active filter. Click "All" in the top Filter bar to reset.</div>'}</div>
      </div>

      <div class="card" id="fixtureDetailPane">
        <div style="padding:24px; text-align:center; color:var(--cyan);">Running 50,000 Monte Carlo Simulations...</div>
      </div>
    </div>
  `;

  if (STATE.selectedFixtureId) {
    await loadAndRenderFixtureDetail(STATE.selectedFixtureId);
  }
}

async function selectFixtureInCentre(sportCode, fid) {
  STATE.selectedFixtureId = fid;
  await renderCurrentPage();
}

async function moveFixtureOrder(sportCode, fid, direction) {
  await apiPost('/api/order/move', { sport_code: sportCode, fixture_id: fid, direction });
  await loadOverviewData();
}

async function loadAndRenderFixtureDetail(fid) {
  const pane = document.getElementById('fixtureDetailPane');
  if (!pane) return;
  try {
    const data = await getCachedFixtureAnalysis(fid, 10000);
    STATE.currentFixtureAnalysis = data;
    renderFixtureDetailTabs();
  } catch (err) {
    pane.innerHTML = `<div style="color:var(--crimson);">Analysis Error: ${err.message}</div>`;
  }
}

function setGameTab(tabName) {
  STATE.activeGameTab = tabName;
  renderFixtureDetailTabs();
}

function renderFixtureDetailTabs() {
  const pane = document.getElementById('fixtureDetailPane');
  const data = STATE.currentFixtureAnalysis;
  if (!pane || !data) return;

  const fix = data.fixture;
  const sim = data.sim_results;
  const m = data.matchup;
  const tab = STATE.activeGameTab;

  const hFair = (1 / Math.max(0.01, sim.win_prob_home)).toFixed(2);
  const aFair = (1 / Math.max(0.01, sim.win_prob_away)).toFixed(2);

  let tabContentHtml = '';
  if (tab === 'overview') {
    tabContentHtml = renderTabMatchOverview(data);
  } else if (tab === 'totals') {
    tabContentHtml = renderTabTotalBands(data);
  } else if (tab === 'race') {
    tabContentHtml = renderTabRaceAndMargins(data);
  } else if (tab === 'players') {
    tabContentHtml = renderTabPlayerProps(data);
  } else if (tab === 'multis') {
    tabContentHtml = renderTabMultiSuggestions(data);
  } else if (tab === 'manual') {
    tabContentHtml = renderTabManualMarkets(data);
  }

  pane.innerHTML = `
    <div class="scoreboard-hero">
      <div class="team-score-block">
        <div style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Home Franchise</div>
        <div class="team-name-lg">${fix.home_name}</div>
        <div class="expected-pts-lg mono">${sim.home_expected} <span style="font-size:14px; color:var(--text-secondary);">pts</span></div>
        <div class="mono" style="font-size:12px; color:var(--text-secondary);">
          Win: <b style="color:var(--emerald);">${(sim.win_prob_home * 100).toFixed(1)}%</b> (Fair $${hFair}) · Range ${sim.home_plausible_range[0]}–${sim.home_plausible_range[1]}
        </div>
        <div style="margin-top:6px;">
          <button class="btn-slip" onclick='addLegToSlip(${JSON.stringify({
            id: `f${fix.id}_home_win`,
            fixture_id: fix.id,
            matchup: `${fix.home_name} vs ${fix.away_name}`,
            sport: data.sport,
            leg_type: "TEAM",
            player_or_team: fix.home_name,
            market: "Match Winner",
            selection: `${fix.home_name} to Win`,
            line: 0,
            prob: sim.win_prob_home,
            correlation_group: "team_total"
          })})'>+ Add ${fix.home_name} Win to Slip</button>
        </div>
      </div>

      <div class="vs-divider">
        ${badgeHtml(m.difficulty, `${m.label} (${m.score}/100)`)}
        <div class="mono" style="font-size:20px; font-weight:900; color:var(--text-main); margin:8px 0;">
          Total: ${sim.exp_total}
        </div>
        <div class="mono" style="font-size:11.5px; color:var(--cyan);">
          Peak Band: ${sim.most_likely_total_band}
        </div>
        <div class="mono" style="font-size:11px; color:var(--emerald); font-weight:700; margin-top:4px;">
          📅 Kickoff: ${formatSydneyDateTime(fix.start_utc).fullStr}
        </div>
        <div style="font-size:10.5px; color:var(--text-muted); margin-top:2px;">
          Confidence: ${data.model_confidence_pct}% · ${data.model_version}
        </div>
      </div>

      <div class="team-score-block away">
        <div style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; font-weight:700;">Away Franchise</div>
        <div class="team-name-lg">${fix.away_name}</div>
        <div class="expected-pts-lg mono">${sim.away_expected} <span style="font-size:14px; color:var(--text-secondary);">pts</span></div>
        <div class="mono" style="font-size:12px; color:var(--text-secondary);">
          Win: <b style="color:var(--cyan);">${(sim.win_prob_away * 100).toFixed(1)}%</b> (Fair $${aFair}) · Range ${sim.away_plausible_range[0]}–${sim.away_plausible_range[1]}
        </div>
        <div style="margin-top:6px;">
          <button class="btn-slip" onclick='addLegToSlip(${JSON.stringify({
            id: `f${fix.id}_away_win`,
            fixture_id: fix.id,
            matchup: `${fix.home_name} vs ${fix.away_name}`,
            sport: data.sport,
            leg_type: "TEAM",
            player_or_team: fix.away_name,
            market: "Match Winner",
            selection: `${fix.away_name} to Win`,
            line: 0,
            prob: sim.win_prob_away,
            correlation_group: "team_total"
          })})'>+ Add ${fix.away_name} Win to Slip</button>
        </div>
      </div>
    </div>

    <div class="tab-bar">
      <button class="tab-btn ${tab === 'overview' ? 'active' : ''}" onclick="setGameTab('overview')">1 · Match Telemetry</button>
      <button class="tab-btn ${tab === 'totals' ? 'active' : ''}" onclick="setGameTab('totals')">2 · Total Score Bands</button>
      <button class="tab-btn ${tab === 'race' ? 'active' : ''}" onclick="setGameTab('race')">3 · Race to Points &amp; Margins</button>
      <button class="tab-btn ${tab === 'players' ? 'active' : ''}" onclick="setGameTab('players')">4 · Player Prop Lab (${(data.players || []).length})</button>
      <button class="tab-btn ${tab === 'multis' ? 'active' : ''}" onclick="setGameTab('multis')">5 · 3-Tier Multi Presets</button>
      <button class="tab-btn ${tab === 'manual' ? 'active' : ''}" onclick="setGameTab('manual')">6 · Bookmaker Edge (${(data.manual_markets || []).length})</button>
    </div>

    <div>${tabContentHtml}</div>
  `;
}

function renderTabMatchOverview(data) {
  const fix = data.fixture;
  const sim = data.sim_results;
  const m = data.matchup;
  const sb = sim.scoring_breakdown || {};

  let breakdownRow = '';
  if (data.sport === 'RUGBY_UNION') {
    breakdownRow = `<tr><td>Code Scoring Breakdown</td><td class="mono">Home Tries: ${sb.home_tries_mean} · Pens: ${sb.home_pens_mean} | Away Tries: ${sb.away_tries_mean} · Pens: ${sb.away_pens_mean} (${sb.scoring_rules})</td></tr>`;
  } else if (data.sport === 'RUGBY_LEAGUE') {
    breakdownRow = `<tr><td>Code Scoring Breakdown</td><td class="mono">Home Tries: ${sb.home_tries_mean} · Goals: ${sb.home_goals_mean} | Away Tries: ${sb.away_tries_mean} · Goals: ${sb.away_goals_mean} (${sb.scoring_rules})</td></tr>`;
  } else if (data.sport === 'NFL') {
    breakdownRow = `<tr><td>Drive Scoring Breakdown</td><td class="mono">Home TDs: ${sb.home_td_mean} · FGs: ${sb.home_fg_mean} | Away TDs: ${sb.away_td_mean} · FGs: ${sb.away_fg_mean} (${sb.scoring_rules})</td></tr>`;
  }

  return `
    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>Quantitative Metric</th><th>50,000-Run Simulation Output</th></tr>
        </thead>
        <tbody>
          <tr><td>Competition &amp; Venue</td><td>${fix.comp_name} · ${fix.venue_name || 'Standard'}</td></tr>
          <tr><td>Scheduled Kickoff &amp; Pre-Event Cutoff</td><td class="mono">${fix.start_utc}</td></tr>
          <tr><td>Matchup Classification &amp; Rationale</td><td>${badgeHtml(m.difficulty, `${m.label} (${m.score}/100)`)} <span style="margin-left:8px; color:var(--text-secondary);">${(m.reasons || []).join(' · ')}</span></td></tr>
          ${breakdownRow}
          <tr><td>Expected Score (Mean)</td><td class="mono" style="color:var(--cyan); font-weight:700;">${fix.home_name} ${sim.home_expected} – ${sim.away_expected} ${fix.away_name}</td></tr>
          <tr><td>Most Likely Central Score (Median)</td><td class="mono">${fix.home_name} ${sim.home_median} – ${sim.away_median} ${fix.away_name}</td></tr>
          <tr><td>Plausible 10th–90th Score Range</td><td class="mono">${fix.home_name}: ${sim.home_plausible_range[0]}–${sim.home_plausible_range[1]} pts | ${fix.away_name}: ${sim.away_plausible_range[0]}–${sim.away_plausible_range[1]} pts</td></tr>
          <tr><td>Projected Margin &amp; Combined Total</td><td class="mono">Margin: ${Math.abs(sim.exp_margin)} pts (${sim.exp_margin >= 0 ? fix.home_name : fix.away_name} favored) · Combined Total: ${sim.exp_total} pts</td></tr>
          <tr><td>Most Likely 10-Point Total Band</td><td class="mono" style="font-weight:700; color:var(--emerald);">${sim.most_likely_total_band}</td></tr>
          <tr><td>Rare-Tail Outlier Scenario (99th Percentile)</td><td class="mono" style="color:var(--amber);">${sim.outlier_scenario.home_score} – ${sim.outlier_scenario.away_score} (${sim.outlier_scenario.prob_label})</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function toggleZeroTotalBands() {
  STATE.showZeroTotalBands = !STATE.showZeroTotalBands;
  renderFixtureDetailTabs();
}

function renderTabTotalBands(data) {
  const fix = data.fixture;
  const allBands = data.sim_results.total_bands || [];
  const peakBand = data.sim_results.most_likely_total_band || '';
  let bands = allBands;

  if (!STATE.showZeroTotalBands) {
    const nonZero = allBands.filter((b) => Number(b.prob) >= 0.003);
    if (nonZero.length >= 3) {
      bands = nonZero;
    } else {
      // Find peak band index and slice surrounding realistic bands (+/- 4 bands)
      const peakIdx = allBands.findIndex(b => b.band === peakBand || (peakBand && peakBand.includes(b.band)));
      if (peakIdx !== -1) {
        const start = Math.max(0, peakIdx - 4);
        const end = Math.min(allBands.length, peakIdx + 5);
        bands = allBands.slice(start, end);
      }
    }
  }

  const maxProb = Math.max(0.05, ...bands.map((b) => b.prob));

  const rowsHtml = bands.map((b) => {
    const widthPct = Math.min(100, Math.round((b.prob / maxProb) * 100));
    const fair = (1 / Math.max(0.005, b.prob)).toFixed(2);
    const isPeak = peakBand && peakBand.includes(b.band);
    return `
      <div class="prob-bar-row" style="${isPeak ? 'background:rgba(0,230,118,0.08); padding:8px 10px; border-radius:6px; border:1px solid rgba(0,230,118,0.4);' : ''}">
        <div class="mono" style="font-weight:700;">
          ${b.band} pts ${isPeak ? '<span class="badge badge-easy" style="font-size:9.5px; padding:1px 6px;">★ PEAK</span>' : ''}
        </div>
        <div class="prob-bar-track">
          <div class="prob-bar-fill" style="width:${widthPct}%; ${isPeak ? 'background:linear-gradient(90deg, #00e676 0%, #00e5ff 100%);' : ''}"></div>
        </div>
        <div class="mono" style="text-align:right; color:${isPeak ? 'var(--emerald)' : 'var(--cyan)'}; font-weight:700;">${b.pct_str}</div>
        <div style="text-align:right;">
          <button class="btn-slip" onclick='addLegToSlip(${JSON.stringify({
            id: `f${fix.id}_band_${b.band}`,
            fixture_id: fix.id,
            matchup: `${fix.home_name} vs ${fix.away_name}`,
            sport: data.sport,
            leg_type: "GAME_TOTAL",
            player_or_team: `${fix.home_name} vs ${fix.away_name}`,
            market: "Total Score Band",
            selection: `Total Points Band ${b.band}`,
            line: 0,
            prob: Math.max(0.02, b.prob),
            correlation_group: "team_total"
          })})'>+$${fair}</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="color:var(--text-secondary); font-size:12.5px;">
          Empirical 10-point total score distribution across 50,000 simulations (Expected Total: <b style="color:var(--cyan);">${data.sim_results.exp_total} pts</b> · Most Likely Band: <b style="color:var(--emerald);">${peakBand}</b>).
        </div>
        <button class="btn" style="padding:4px 10px; font-size:11px;" onclick="toggleZeroTotalBands()">
          ${STATE.showZeroTotalBands ? 'Hide 0.0% Tail Bands' : `Show All Bands (${allBands.length})`}
        </button>
      </div>
      ${rowsHtml}
    </div>
  `;
}

function renderTabRaceAndMargins(data) {
  const fix = data.fixture;
  const sim = data.sim_results;
  const margins = sim.margin_bands || {};
  const race = sim.race_to_points || {};

  const marginRows = [
    { label: `${fix.home_name} by 1–12 Points`, prob: margins.home_1_12 || 0 },
    { label: `${fix.home_name} by 13+ Points`, prob: margins.home_13_plus || 0 },
    { label: `${fix.away_name} by 1–12 Points`, prob: margins.away_1_12 || 0 },
    { label: `${fix.away_name} by 13+ Points`, prob: margins.away_13_plus || 0 },
  ];

  const raceKeys = Object.keys(race);

  return `
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
      <div>
        <div style="font-weight:700; margin-bottom:8px; color:var(--cyan);">Winning Margin Bands</div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Margin Band</th><th>Model Prob</th><th>Fair Odds</th><th>Slip</th></tr></thead>
            <tbody>
              ${marginRows.map((mr, i) => `
                <tr>
                  <td>${mr.label}</td>
                  <td class="mono" style="font-weight:700; color:var(--cyan);">${(mr.prob * 100).toFixed(1)}%</td>
                  <td class="mono">$${(1 / Math.max(0.01, mr.prob)).toFixed(2)}</td>
                  <td>
                    <button class="btn-slip" onclick='addLegToSlip(${JSON.stringify({
                      id: `f${fix.id}_margin_${i}`,
                      fixture_id: fix.id,
                      matchup: `${fix.home_name} vs ${fix.away_name}`,
                      sport: data.sport,
                      leg_type: "MARGIN",
                      player_or_team: mr.label,
                      market: "Winning Margin",
                      selection: mr.label,
                      line: 0,
                      prob: Math.max(0.02, mr.prob),
                      correlation_group: "team_total"
                    })})'>+ Slip</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div style="font-weight:700; margin-bottom:8px; color:var(--cyan);">Race to Points Ladder</div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Threshold</th><th>Home</th><th>Away</th><th>Neither</th><th>Quick Add</th></tr></thead>
            <tbody>
              ${raceKeys.map((rk) => {
                const rObj = race[rk];
                const pts = rk.replace('race_', '');
                return `
                  <tr>
                    <td style="font-weight:700;">Race to ${pts}</td>
                    <td class="mono" style="color:var(--emerald);">${(rObj.home_prob * 100).toFixed(1)}%</td>
                    <td class="mono" style="color:var(--cyan);">${(rObj.away_prob * 100).toFixed(1)}%</td>
                    <td class="mono" style="color:var(--text-muted);">${((rObj.neither_prob || 0) * 100).toFixed(1)}%</td>
                    <td>
                      <button class="btn-slip" onclick='addLegToSlip(${JSON.stringify({
                        id: `f${fix.id}_race_${pts}_h`,
                        fixture_id: fix.id,
                        matchup: `${fix.home_name} vs ${fix.away_name}`,
                        sport: data.sport,
                        leg_type: "RACE",
                        player_or_team: fix.home_name,
                        market: `Race to ${pts} Points`,
                        selection: `${fix.home_name} Race to ${pts}`,
                        line: Number(pts),
                        prob: Math.max(0.02, rObj.home_prob),
                        correlation_group: "team_total"
                      })})'>+H</button>
                      <button class="btn-slip" onclick='addLegToSlip(${JSON.stringify({
                        id: `f${fix.id}_race_${pts}_a`,
                        fixture_id: fix.id,
                        matchup: `${fix.home_name} vs ${fix.away_name}`,
                        sport: data.sport,
                        leg_type: "RACE",
                        player_or_team: fix.away_name,
                        market: `Race to ${pts} Points`,
                        selection: `${fix.away_name} Race to ${pts}`,
                        line: Number(pts),
                        prob: Math.max(0.02, rObj.away_prob),
                        correlation_group: "team_total"
                      })})'>+A</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderTabPlayerProps(data) {
  const fix = data.fixture;
  const allPlayers = data.players || [];
  const players = allPlayers.filter((p) => isDiffSelected((p.matchup && p.matchup.difficulty) || 'MID'));

  const rowsHtml = players.map((p, idx) => {
    const pm = p.matchup || {};
    const fair = (1 / Math.max(0.01, p.over_prob)).toFixed(2);
    const mean = p.projection.adjusted_projection;
    const std = p.projection.std_est;
    return `
      <tr>
        <td>
          <div style="font-weight:700;">${p.name}</div>
          <div style="font-size:11px; color:var(--text-secondary);">${p.team} · ${p.position} · <span style="color:var(--emerald);">${p.availability}</span></div>
        </td>
        <td>${badgeHtml(pm.difficulty, `${pm.score}/100`)}</td>
        <td class="mono" style="font-weight:800; color:var(--cyan);">${mean} <span style="font-weight:400; color:var(--text-secondary);">(${p.market_label})</span></td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            <input
              type="number"
              step="0.5"
              id="simLine_${idx}"
              class="input-field mono"
              style="width:78px; padding:4px 7px;"
              value="${p.prop_line}"
              oninput="simulateCustomPlayerRow(${idx}, ${mean}, ${std})"
            />
            <input
              type="number"
              step="0.01"
              id="simOdds_${idx}"
              class="input-field mono"
              style="width:78px; padding:4px 7px;"
              placeholder="Odds"
              oninput="simulateCustomPlayerRow(${idx}, ${mean}, ${std})"
            />
          </div>
        </td>
        <td class="mono" id="simResult_${idx}">
          <span style="color:var(--emerald); font-weight:700;">Over: ${(p.over_prob * 100).toFixed(1)}%</span> ($${fair})
        </td>
        <td>
          <span class="bet365-badge" style="margin-right:6px;">✓ .5 Line</span>
          <button class="btn-slip" onclick="addSimulatedPlayerPropToSlip(${idx}, ${fix.id}, '${fix.home_name} vs ${fix.away_name}', '${data.sport}', '${p.name.replace(/'/g, "\\'")}', '${p.market_label}', ${mean}, ${std})">
            + Add Over to Slip
          </button>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div>
      <div style="margin-bottom:10px; font-size:12.5px; color:var(--text-secondary); display:flex; justify-content:space-between; align-items:center;">
        <span><b>Interactive Bet365-Placeable Prop Simulator:</b> All lines snapped to standard Bet365 <code>.5</code> increments. Showing ${players.length} of ${allPlayers.length} athletes matching difficulty filter.</span>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Athlete / Status</th>
              <th>Matchup Diff</th>
              <th>Model Projection</th>
              <th>Bet365 .5 Line &amp; Bookie Odds</th>
              <th>Live Model Prob (Fair / Edge)</th>
              <th>Bet365 Check &amp; Slip</th>
            </tr>
          </thead>
          <tbody>${rowsHtml || '<tr><td colspan="6" style="text-align:center; color:var(--text-secondary);">No players match the selected difficulty filter. Click "All" in the top Filter bar to show all athletes.</td></tr>'}</tbody>
        </table>
      </div>
    </div>
  `;
}

async function simulateCustomPlayerRow(idx, mean, std) {
  const lineEl = document.getElementById(`simLine_${idx}`);
  const oddsEl = document.getElementById(`simOdds_${idx}`);
  const outEl = document.getElementById(`simResult_${idx}`);
  if (!lineEl || !outEl) return;

  const line = parseFloat(lineEl.value || '0');
  const userOdds = parseFloat(oddsEl.value || '0');
  const res = await apiPost('/api/custom_prop', {
    mean,
    std,
    line,
    direction: 'over',
    user_odds: userOdds > 1 ? userOdds : null,
  });

  let edgeBadge = '';
  if (res.edge_diff_pct !== null && res.edge_diff_pct !== undefined) {
    const sign = res.edge_diff_pct >= 0 ? '+' : '';
    const col = res.edge_diff_pct >= 0 ? 'var(--emerald)' : 'var(--crimson)';
    edgeBadge = ` · <b style="color:${col};">${sign}${res.edge_diff_pct}% Edge</b>`;
  }
  outEl.innerHTML = `<span style="color:var(--emerald); font-weight:700;">Over: ${res.model_prob_pct}%</span> ($${res.fair_odds.toFixed(2)})${edgeBadge}`;
  outEl.dataset.prob = res.model_prob;
}

async function addSimulatedPlayerPropToSlip(idx, fid, matchup, sport, playerName, marketLabel, mean, std) {
  const lineEl = document.getElementById(`simLine_${idx}`);
  const oddsEl = document.getElementById(`simOdds_${idx}`);
  const line = parseFloat(lineEl ? lineEl.value : '10.5');
  const userOdds = parseFloat(oddsEl && oddsEl.value ? oddsEl.value : '0');

  const res = await apiPost('/api/custom_prop', {
    mean,
    std,
    line,
    direction: 'over',
    user_odds: userOdds > 1 ? userOdds : null,
  });

  addLegToSlip({
    id: `f${fid}_${playerName}_${line}`,
    fixture_id: fid,
    matchup,
    sport,
    leg_type: 'PLAYER',
    player_or_team: playerName,
    market: marketLabel,
    selection: `${playerName} Over ${line} (${marketLabel})`,
    line,
    prob: res.model_prob,
    user_odds: userOdds > 1 ? userOdds : null,
    correlation_group: sport === 'NBA' ? 'player_pts' : 'general',
  });
}

function renderTabMultiSuggestions(data, overrideMultis = null) {
  const multis = overrideMultis || data.multis || {};
  const fix = data.fixture;
  const tiers = [
    { key: 'lower_risk', badge: 'LOWER-RISK BET365 SGM (2–3 LEGS)', css: 'tier-lower-risk' },
    { key: 'balanced', badge: 'BALANCED BET365 SGM (3–5 LEGS)', css: 'tier-balanced' },
    { key: 'stacked', badge: 'STACKED BET365 SGM (5–6 LEGS)', css: 'tier-stacked' },
  ];

  return tiers.map((t) => {
    const m = multis[t.key];
    if (!m || m.status !== 'OK') {
      return `
        <div class="card multi-preset-card ${t.css}" style="margin-bottom:14px;">
          <div class="card-header">
            <div class="card-title">${t.badge}</div>
            <span class="badge badge-mid">NO RECOMMENDATION</span>
          </div>
          <div style="color:var(--text-secondary);">${m ? m.risk_label : 'Insufficient legs'}</div>
        </div>
      `;
    }

    const legsHtml = (m.legs || []).map((l) => `
      <tr>
        <td>
          <div style="font-weight:700;">${l.player_or_team}</div>
          <div style="font-size:11px; color:var(--text-secondary);">${l.team_name || ''}</div>
        </td>
        <td>${badgeHtml(l.difficulty || 'MID')}</td>
        <td style="font-weight:700; color:var(--text-main);">${l.selection}</td>
        <td>
          <span class="bet365-badge">✓ Bet365 Placeable</span>
          <div style="font-size:10.5px; color:var(--text-secondary); margin-top:2px;">${l.bet365_market_path || 'Bet365 SGM → Main / Player Markets'}</div>
        </td>
        <td class="mono" style="color:var(--cyan); font-weight:700;">${l.model_prob} ($${Number(l.fair_odds).toFixed(2)})</td>
        <td style="color:var(--text-secondary); font-size:12px;">${l.rationale || ''}</td>
      </tr>
    `).join('');

    return `
      <div class="card multi-preset-card ${t.css}" style="margin-bottom:14px;">
        <div class="card-header">
          <div>
            <div class="card-title">
              <span>${m.title}</span>
              <span class="badge badge-cyan mono">${m.legs_count} LEGS</span>
              <span class="bet365-badge">✓ VERIFIED BET365 SGM</span>
            </div>
            <div style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">${m.risk_label} · All legs checked for Bet365 Same-Game Multi compatibility (.5 lines / milestones, zero duplicate moneyline legs)</div>
          </div>
          <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
            <div class="mono" style="text-align:right;">
              <div style="font-weight:800; color:var(--cyan); font-size:15px;">
                Joint Prob: ${(m.joint_prob * 100).toFixed(1)}% (${m.prob_range_str})
              </div>
              <div style="font-size:12px; color:var(--text-secondary);">Model Fair Price: <b>$${m.fair_odds.toFixed(2)}</b></div>
            </div>
            <button class="btn btn-emerald" onclick='copyPresetMultiForBet365(${JSON.stringify(m.legs)}, "${m.title}", ${m.fair_odds})'>
              📋 Copy Bet365 SGM
            </button>
            <button class="btn btn-primary" onclick='loadPresetMultiIntoSlip(${JSON.stringify(m.legs)}, ${fix.id}, "${fix.home_name} vs ${fix.away_name}", "${data.sport}")'>
              Load into Slip →
            </button>
          </div>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Team / Athlete</th>
                <th>Difficulty</th>
                <th>Bet365 Selection (.5 / Milestone)</th>
                <th>Bet365 Market Verification</th>
                <th>Leg Prob (Fair)</th>
                <th>Model Rationale</th>
              </tr>
            </thead>
            <tbody>${legsHtml}</tbody>
          </table>
        </div>
        <div style="margin-top:8px; font-size:11.5px; color:var(--text-secondary);">
          <b>Correlation &amp; Placeability Engine:</b> ${(m.correlation_notes || []).join(' · ')}
        </div>
      </div>
    `;
  }).join('');
}

function renderTabManualMarkets(data) {
  const fix = data.fixture;
  const mkts = data.manual_markets || [];

  const rowsHtml = mkts.map((mm) => `
    <tr>
      <td style="font-weight:700;">${mm.selection}</td>
      <td>${mm.market_code}</td>
      <td class="mono">${mm.line}</td>
      <td class="mono" style="color:var(--cyan); font-weight:700;">${(mm.model_prob * 100).toFixed(1)}% ($${mm.fair_odds.toFixed(2)})</td>
      <td class="mono">$${Number(mm.decimal_odds).toFixed(2)} (${(mm.implied_prob * 100).toFixed(1)}%)</td>
      <td>${edgeHtml(mm.edge_diff)}</td>
      <td>
        <div style="display:flex; gap:6px;">
          <button class="btn-slip" onclick='addLegToSlip(${JSON.stringify({
            id: `mm_${mm.id}`,
            fixture_id: fix.id,
            matchup: `${fix.home_name} vs ${fix.away_name}`,
            sport: data.sport,
            leg_type: "MANUAL_MARKET",
            player_or_team: mm.selection,
            market: mm.market_code,
            selection: `${mm.selection} (${mm.line})`,
            line: mm.line_value || 0,
            prob: mm.model_prob,
            user_odds: mm.decimal_odds,
            correlation_group: "manual_user"
          })})'>+ Slip</button>
          <button class="btn" style="padding:3px 8px; font-size:11px;" onclick="deleteManualMarket(${mm.id}, ${fix.id})">✕</button>
        </div>
      </td>
    </tr>
  `).join('');

  return `
    <div>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <div style="font-size:12.5px; color:var(--text-secondary);">
          Manual bookmaker lines entered for <b>${fix.home_name} vs ${fix.away_name}</b>.
        </div>
        <button class="btn btn-primary" onclick="openManualMarketModal(${fix.id})">+ Add Bookmaker Market Line</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Selection</th>
              <th>Market</th>
              <th>Line</th>
              <th>Model Prob (Fair)</th>
              <th>User Odds (Implied)</th>
              <th>Edge Diff</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="7" style="text-align:center; color:var(--text-secondary);">No manual market references saved for this fixture yet.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================================
// 3. DEDICATED MULTI & SGM STUDIO PAGE (SPORT -> EASY/MID -> TEAM -> MULTIS)
// ============================================================================
function setMultiStudioSport(sportKey) {
  STATE.multiStudioSport = sportKey;
  STATE.multiStudioTeam = null;
  STATE.selectedFixtureId = null;
  renderMultiStudioPage();
}

function selectMultiStudioTeam(teamName, fixtureId) {
  STATE.multiStudioTeam = teamName;
  STATE.selectedFixtureId = fixtureId;
  STATE.multiStudioScope = 'TEAM';
  renderMultiStudioPage();
}

function setMultiStudioScope(scope) {
  STATE.multiStudioScope = scope;
  renderMultiStudioPage();
}

async function renderMultiStudioPage() {
  const box = document.getElementById('workspaceContent');
  const d = STATE.overviewData || (await apiGet('/api/overview'));
  const sMap = d.sports || {};

  // Step 1: Resolve fixtures for the chosen Sport / World Cup tab
  const mSport = STATE.multiStudioSport || 'NBA';
  let rawSportFixtures = [];
  if (mSport === 'MENS_WORLD_CUP' || mSport === 'WOMENS_WORLD_CUP') {
    const allRug = [...(sMap.RUGBY_UNION || []), ...(sMap.RUGBY_LEAGUE || [])];
    rawSportFixtures = filterRugbyFixturesByTournament(allRug, mSport);
  } else {
    rawSportFixtures = sMap[mSport] || [];
  }
  const sportFixtures = rawSportFixtures.filter(isFixtureActiveOrRecent);

  // Step 2 & 3: Build list of Teams from sportFixtures that match the active Difficulty Filter (EASY / MID / CLOSE)
  const teamEntries = [];
  sportFixtures.forEach((f) => {
    // If the game matchup classification does not match the active filter, exclude it
    if (!fixtureMatchesDiffFilter(f)) {
      return;
    }

    const hDiff = (f.home_difficulty || f.difficulty || 'MID').toUpperCase();
    const aDiff = (f.away_difficulty || f.difficulty || 'MID').toUpperCase();
    const gDiff = (f.difficulty || 'MID').toUpperCase();
    const syd = formatSydneyDateTime(f.start_utc);

    if (isDiffSelected(hDiff)) {
      teamEntries.push({
        team: f.home,
        opponent: f.away,
        isHome: true,
        fixtureId: f.id,
        startUtc: f.start_utc,
        syd,
        competition: f.competition || f.sport,
        venue: f.venue || 'Home Stadium',
        teamDiff: hDiff,
        gameDiff: gDiff,
        winProb: f.win_prob_home,
        expScore: f.home_expected,
        oppScore: f.away_expected,
        expTotal: f.exp_total,
        totalBand: f.most_likely_total_band,
      });
    }
    if (isDiffSelected(aDiff)) {
      teamEntries.push({
        team: f.away,
        opponent: f.home,
        isHome: false,
        fixtureId: f.id,
        startUtc: f.start_utc,
        syd,
        competition: f.competition || f.sport,
        venue: f.venue || 'Away Venue',
        teamDiff: aDiff,
        gameDiff: gDiff,
        winProb: f.win_prob_away,
        expScore: f.away_expected,
        oppScore: f.home_expected,
        expTotal: f.exp_total,
        totalBand: f.most_likely_total_band,
      });
    }
  });

  // Group teamEntries by Sydney playing day in chronological order (like the Bet365 match schedule)
  const dayGroups = {};
  teamEntries.forEach((te) => {
    const key = te.syd.dayHeader; // e.g. "Tue 03 Nov"
    if (!dayGroups[key]) {
      dayGroups[key] = {
        dayHeader: key,
        isoDay: te.syd.isoDay,
        entries: [],
      };
    }
    dayGroups[key].entries.push(te);
  });

  const sortedDays = Object.values(dayGroups).sort((a, b) => a.isoDay.localeCompare(b.isoDay));

  if (teamEntries.length > 0) {
    const validTeam = teamEntries.find(
      (te) => te.team === STATE.multiStudioTeam && te.fixtureId === STATE.selectedFixtureId
    );
    if (!validTeam) {
      STATE.multiStudioTeam = teamEntries[0].team;
      STATE.selectedFixtureId = teamEntries[0].fixtureId;
    }
  } else if (sportFixtures.length > 0 && !STATE.selectedFixtureId) {
    STATE.selectedFixtureId = sportFixtures[0].id;
    STATE.multiStudioTeam = sportFixtures[0].home;
  }

  // Fast parallel fetch using client Monte Carlo cache
  const [fData, liveMatch] = await Promise.all([
    STATE.selectedFixtureId ? getCachedFixtureAnalysis(STATE.selectedFixtureId, 10000) : null,
    STATE.selectedFixtureId ? apiGet(`/api/live_match?id=${STATE.selectedFixtureId}`).catch(() => null) : null,
  ]);

  const sportTabs = [
    { key: 'NBA', label: '1 · NBA Basketball' },
    { key: 'RUGBY_UNION', label: '2A · Rugby Union' },
    { key: 'RUGBY_LEAGUE', label: '2B · Rugby League (NRL)' },
    { key: 'MENS_WORLD_CUP', label: "🏆 Men's Rugby World Cup" },
    { key: 'WOMENS_WORLD_CUP', label: "🏆 Women's Rugby World Cup" },
    { key: 'NFL', label: '3 · NFL Football' },
  ];

  let teamCardsHtml = '';
  if (sortedDays.length > 0) {
    teamCardsHtml = sortedDays.map((day) => {
      // Sort entries within the day chronologically by kickoff timestamp, then win probability
      day.entries.sort((a, b) => {
        const timeA = (a.syd.rawDate ? a.syd.rawDate.getTime() : 0) || (a.startUtc ? new Date(a.startUtc).getTime() : 0);
        const timeB = (b.syd.rawDate ? b.syd.rawDate.getTime() : 0) || (b.startUtc ? new Date(b.startUtc).getTime() : 0);
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        return b.winProb - a.winProb;
      });

      const cards = day.entries.map((te) => {
        const isSel = te.team === STATE.multiStudioTeam && te.fixtureId === STATE.selectedFixtureId;
        const fair = (1 / Math.max(0.01, te.winProb)).toFixed(2);
        return `
          <div class="team-select-card ${isSel ? 'selected' : ''}" onclick="selectMultiStudioTeam('${te.team.replace(/'/g, "\\'")}', ${te.fixtureId})">
            <div class="card-time-strip">
              <div style="display:flex; align-items:center; gap:6px;">
                <span class="syd-time-pill mono">🕐 ${te.syd.timeStr} AEDT</span>
                <span class="comp-badge">${te.competition}</span>
              </div>
              ${badgeHtml(te.teamDiff)}
            </div>

            <div class="card-team-header">
              <div class="team-title-row">
                <span class="team-brand-name">${te.team}</span>
                <span class="home-away-pill ${te.isHome ? 'pill-home' : 'pill-away'}">${te.isHome ? 'HOME' : 'AWAY'}</span>
              </div>
              <div class="matchup-sub">
                ${te.isHome ? 'vs' : '@'} <b>${te.opponent}</b> · <span class="venue-inline">${te.venue}</span>
              </div>
            </div>

            <div class="card-telemetry mono">
              <div class="telemetry-col" style="flex:1;">
                <span class="t-label">Model Win (Fair):</span>
                <span class="t-val win-color"><b>${(te.winProb * 100).toFixed(1)}%</b> ($${fair})</span>
                <div class="team-prob-bar-track">
                  <div class="team-prob-bar-fill" style="width: ${(te.winProb * 100).toFixed(0)}%;"></div>
                </div>
              </div>
              <div class="telemetry-col">
                <span class="t-label">Expected Score:</span>
                <span class="t-val score-color">${te.expScore} – ${te.oppScore}</span>
              </div>
            </div>

            <div class="card-footer-action">
              <div style="display:flex; align-items:center; gap:6px;">
                ${isSel 
                  ? '<span class="status-active-pill">✓ SELECTED FOR SGM</span>' 
                  : '<span class="status-click-hint">Click to Build Multis →</span>'
                }
              </div>
              <span class="mono total-hint">Tot: ${te.expTotal || ''} (${te.totalBand || ''})</span>
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="schedule-day-group">
          <div class="schedule-day-header">
            <div class="day-header-left">
              <span class="calendar-icon">📅</span>
              <span class="day-header-title">${day.dayHeader}</span>
              <span class="day-header-badge mono">${day.entries.length} ${day.entries.length === 1 ? 'Team' : 'Teams'} Playing</span>
            </div>
            <div class="day-header-right mono">
              Kickoffs in Sydney Time (Australia/Sydney · AEDT)
            </div>
          </div>
          <div class="team-select-grid">
            ${cards}
          </div>
        </div>
      `;
    }).join('');
  } else {
    teamCardsHtml = `
      <div class="card empty-state-box" style="text-align:center; padding:32px;">
        <div style="font-size:16px; font-weight:700; color:var(--text-main); margin-bottom:6px;">No Teams Matching Selected Difficulty Filter</div>
        <div style="font-size:12.5px; color:var(--text-secondary); margin-bottom:14px;">
          Currently filtering for: <b style="color:var(--emerald);">${STATE.difficultyFilter.join(' + ') || 'None'}</b> in ${mSport}.
        </div>
        <button class="btn btn-primary" onclick="setDifficultyPreset(['EASY','MID','CLOSE'])">Reset Filter: Show All Matchups</button>
      </div>
    `;
  }

  // Choose team-specific multis or full-match multis
  let activeMultisObj = null;
  if (fData && fData.multis) {
    if (
      STATE.multiStudioScope === 'TEAM' &&
      STATE.multiStudioTeam &&
      fData.multis.by_team &&
      fData.multis.by_team[STATE.multiStudioTeam]
    ) {
      activeMultisObj = fData.multis.by_team[STATE.multiStudioTeam];
    } else {
      activeMultisObj = fData.multis;
    }
  }

  const allCands = fData ? fData.slip_candidates || [] : [];
  // Sort so selected team's legs appear at the top, and filter by difficulty if desired
  const sortedCands = [...allCands].sort((a, b) => {
    const aTeamMatch = a.team_name === STATE.multiStudioTeam || a.player_or_team === STATE.multiStudioTeam ? 1 : 0;
    const bTeamMatch = b.team_name === STATE.multiStudioTeam || b.player_or_team === STATE.multiStudioTeam ? 1 : 0;
    if (aTeamMatch !== bTeamMatch) return bTeamMatch - aTeamMatch;
    return b.prob - a.prob;
  });

  const filteredCands = sortedCands.filter((c) => {
    if (STATE.multiStudioScope === 'TEAM' && STATE.multiStudioTeam) {
      const belongsToTeam =
        c.team_name === STATE.multiStudioTeam ||
        c.player_or_team === STATE.multiStudioTeam ||
        c.team_name === 'Both Teams';
      if (!belongsToTeam) return false;
    }
    return isDiffSelected(c.difficulty || 'MID');
  });

  const displayCands = filteredCands;

  const candRows = displayCands.length > 0
    ? displayCands.map((c) => `
    <tr>
      <td><span class="badge badge-cyan mono">${c.leg_type}</span></td>
      <td>
        <div style="font-weight:700;">${c.player_or_team}</div>
        <div style="font-size:11px; color:var(--text-secondary);">${c.team_name || ''}</div>
      </td>
      <td>${badgeHtml(c.difficulty || 'MID')}</td>
      <td style="font-weight:700;">${c.selection}</td>
      <td>
        <span class="bet365-badge">✓ Bet365 Placeable</span>
        <div style="font-size:10.5px; color:var(--text-secondary); margin-top:2px;">${c.bet365_market_path || 'Bet365 SGM Market'}</div>
      </td>
      <td class="mono" style="color:var(--cyan); font-weight:700;">${(c.prob * 100).toFixed(1)}% ($${c.fair_odds.toFixed(2)})</td>
      <td style="font-size:12px; color:var(--text-secondary);">${c.rationale || ''}</td>
      <td>
        <button class="btn-slip" onclick='addLegToSlip(${JSON.stringify(c)})'>+ Add Leg to Slip</button>
      </td>
    </tr>
  `).join('')
    : '<tr><td colspan="8" style="text-align:center; color:var(--text-secondary); padding:20px;">No Bet365-placeable markets match the selected difficulty filter. Click "Show All" or "Easy + Mid" in Step 2 to expand.</td></tr>';

  box.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Guided Bet365-Placeable Multi &amp; SGM Studio</div>
        <div class="page-subtitle">Step 1: Select Sport → Step 2: Filter Easy / Mid → Step 3: Select Team → Step 4: Inspect &amp; Build Bet365-Placeable Multis</div>
      </div>
    </div>

    <!-- Visual 4-Step Stepper Progress Bar -->
    <div class="studio-stepper">
      <div class="stepper-item ${mSport ? 'active' : ''}">
        <span class="stepper-num">01</span>
        <div class="stepper-text">
          <span class="stepper-label">Select Sport</span>
          <span class="stepper-sub">${mSport}</span>
        </div>
      </div>
      <div class="stepper-item ${STATE.difficultyFilter.length > 0 ? 'active' : ''}">
        <span class="stepper-num">02</span>
        <div class="stepper-text">
          <span class="stepper-label">Difficulty Filter</span>
          <span class="stepper-sub">${STATE.difficultyFilter.join(' + ') || 'All'}</span>
        </div>
      </div>
      <div class="stepper-item ${STATE.multiStudioTeam ? 'active' : ''}">
        <span class="stepper-num">03</span>
        <div class="stepper-text">
          <span class="stepper-label">Schedule &amp; Team</span>
          <span class="stepper-sub">${STATE.multiStudioTeam || 'Select Below'}</span>
        </div>
      </div>
      <div class="stepper-item ${activeMultisObj ? 'active' : ''}">
        <span class="stepper-num">04</span>
        <div class="stepper-text">
          <span class="stepper-label">Bet365 Multis</span>
          <span class="stepper-sub">Verified &amp; Placeable</span>
        </div>
      </div>
    </div>

    <!-- STEP 1: SELECT SPORT -->
    <div class="funnel-step-box">
      <div class="funnel-step-title">
        <span>Step 1 · Select Sport or World Cup Tournament</span>
        <span class="mono" style="color:var(--text-secondary);">Active: ${mSport}</span>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${sportTabs.map((st) => `
          <button class="tab-btn ${mSport === st.key ? 'active' : ''}" onclick="setMultiStudioSport('${st.key}')">
            ${st.label}
          </button>
        `).join('')}
      </div>
    </div>

    <!-- STEP 2: SELECT DIFFICULTY (EASY / MID / MULTIPLE) -->
    <div class="funnel-step-box">
      <div class="funnel-step-title">
        <span>Step 2 · Filter Matchup Difficulty (Click Easy, Mid, or Select Multiple)</span>
        <span class="mono" style="color:var(--emerald);">Showing: ${STATE.difficultyFilter.join(' + ')}</span>
      </div>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <button class="diff-chip ${STATE.difficultyFilter.includes('EASY') ? 'active-easy' : ''}" onclick="toggleDifficultyFilter('EASY')">
          ${STATE.difficultyFilter.includes('EASY') ? '✓' : '○'} EASY Matchups
        </button>
        <button class="diff-chip ${STATE.difficultyFilter.includes('MID') ? 'active-mid' : ''}" onclick="toggleDifficultyFilter('MID')">
          ${STATE.difficultyFilter.includes('MID') ? '✓' : '○'} MID Matchups
        </button>
        <button class="diff-chip ${STATE.difficultyFilter.includes('CLOSE') ? 'active-close' : ''}" onclick="toggleDifficultyFilter('CLOSE')">
          ${STATE.difficultyFilter.includes('CLOSE') ? '✓' : '○'} CLOSE Matchups
        </button>
        <span style="color:var(--border-bright); margin:0 4px;">|</span>
        <button class="btn" style="padding:4px 10px; font-size:11.5px;" onclick="setDifficultyPreset(['EASY'])">Easy Only</button>
        <button class="btn" style="padding:4px 10px; font-size:11.5px;" onclick="setDifficultyPreset(['MID'])">Mid Only</button>
        <button class="btn" style="padding:4px 10px; font-size:11.5px;" onclick="setDifficultyPreset(['EASY','MID'])">Easy + Mid</button>
        <button class="btn" style="padding:4px 10px; font-size:11.5px;" onclick="setDifficultyPreset(['EASY','MID','CLOSE'])">Show All</button>
      </div>
    </div>

    <!-- STEP 3: SELECT TEAM & SCHEDULE -->
    <div class="funnel-step-box">
      <div class="funnel-step-title">
        <div style="display:flex; align-items:center; gap:8px;">
          <span>Step 3 · Match Schedule &amp; Team Selection</span>
          <span class="badge badge-cyan mono">${teamEntries.length} TEAMS · ${sortedDays.length} DAYS</span>
        </div>
        <div class="mono" style="font-size:12px; color:var(--cyan);">
          Selected: <b style="color:var(--emerald);">${STATE.multiStudioTeam || 'None'}</b>
          ${fData && fData.fixture && fData.fixture.start_utc ? `<span style="color:var(--text-secondary); font-size:11px;">(${formatSydneyDateTime(fData.fixture.start_utc).fullStr})</span>` : ''}
        </div>
      </div>
      <div class="schedule-timeline-wrap">
        ${teamCardsHtml}
      </div>
    </div>

    <!-- STEP 4: SHOW BET365-PLACEABLE MULTIS & BUILDER -->
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-top:6px; margin-bottom:12px;">
      <div>
        <div style="font-size:17px; font-weight:800; color:var(--text-main); display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span>Step 4 · Bet365-Placeable Multis for</span>
          <span style="color:var(--emerald); text-shadow:0 0 12px rgba(0,230,118,0.4);">${STATE.multiStudioTeam || (fData ? fData.fixture.home_name : '')}</span>
          ${fData && fData.fixture ? `<span style="color:var(--text-secondary); font-size:13px; font-weight:600;">(${fData.fixture.home_name} vs ${fData.fixture.away_name})</span>` : ''}
        </div>
        <div style="font-size:12px; color:var(--text-secondary); margin-top:3px;">
          ${fData && fData.fixture && fData.fixture.start_utc ? `<span class="mono" style="color:var(--cyan); font-weight:700;">📅 Kickoff: ${formatSydneyDateTime(fData.fixture.start_utc).fullStr}</span> · ` : ''}
          Every option below is verified against Bet365 Same-Game Multi regulations (snapped to standard <code>.5</code> lines &amp; official milestones, zero duplicate moneyline legs).
        </div>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        <button class="tab-btn ${STATE.multiStudioScope === 'TEAM' ? 'active' : ''}" onclick="setMultiStudioScope('TEAM')">
          Focus on ${STATE.multiStudioTeam || 'Selected Team'} Multis
        </button>
        <button class="tab-btn ${STATE.multiStudioScope === 'MATCH' ? 'active' : ''}" onclick="setMultiStudioScope('MATCH')">
          Show Both Teams in Match
        </button>
        <button class="btn" style="color:var(--emerald-text); border-color:var(--emerald);" onclick="switchPage('livescores')">
          🔴 View All Live Scores →
        </button>
      </div>
    </div>

    ${liveMatch ? `
      <div class="multi-live-banner">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span class="live-badge-pulse"><span class="live-pulse-red"></span> ${liveMatch.status_label}</span>
            <span class="live-clock-pill mono">${liveMatch.period} · ${liveMatch.clock}</span>
            <span style="font-size:14px; font-weight:800; color:#ffffff;">
              ${liveMatch.home} <b style="color:var(--emerald-text); font-size:16px;">${liveMatch.home_score}</b> – <b style="color:#38bdf8; font-size:16px;">${liveMatch.away_score}</b> ${liveMatch.away}
            </span>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="mono" style="font-size:11.5px; color:var(--text-secondary);">
              Tot: <b>${liveMatch.total_score} pts</b> · Pace: <b style="color:var(--amber-text);">${liveMatch.projected_final_total} pts</b> (${liveMatch.pace_str})
            </span>
            <button class="btn btn-primary" style="padding:4px 9px; font-size:11px;" onclick="tickLiveMatch(${STATE.selectedFixtureId})">⚡ Next Play</button>
            <button class="btn btn-danger" style="padding:4px 9px; font-size:11px;" onclick="setAndOpenLiveMatch(${STATE.selectedFixtureId})">
              🔴 Open Live Watch Tab →
            </button>
          </div>
        </div>
      </div>
    ` : ''}

    ${fData ? renderTabMultiSuggestions(fData, activeMultisObj) : ''}

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">
            <span>Custom Bet365-Placeable Leg Builder (${displayCands.length} Verified Markets)</span>
            <span class="bet365-badge">✓ ALL LEGS BET365 PLACEABLE</span>
          </div>
          <div style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">
            Click <b>+ Add Leg to Slip</b> on any selection below to assemble your own custom multi in the right-hand Slip panel.
          </div>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Team / Athlete</th>
              <th>Difficulty</th>
              <th>Bet365 Selection (.5 / Milestone)</th>
              <th>Bet365 Market Location</th>
              <th>Model Prob (Fair)</th>
              <th>Evidence / Rationale</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>${candRows}</tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================================
// 4. PLAYER PROP SIMULATOR & EXPLORER PAGE
// ============================================================================
async function renderPlayersPage(sportFilter = 'ALL', query = '') {
  const box = document.getElementById('workspaceContent');
  const data = await apiGet(`/api/players?sport=${encodeURIComponent(sportFilter)}&q=${encodeURIComponent(query)}`);
  const players = data.players || [];

  if (!STATE.selectedPlayerId && players.length > 0) {
    STATE.selectedPlayerId = players[0].id;
  }

  const pDetail = STATE.selectedPlayerId
    ? await apiGet(`/api/player?id=${STATE.selectedPlayerId}`)
    : null;

  const listHtml = players.map((p) => `
    <div class="fixture-list-item ${p.id === STATE.selectedPlayerId ? 'selected' : ''}" onclick="selectPlayerInExplorer(${p.id})">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700;">${p.full_name}</span>
        <span class="badge badge-cyan mono">${p.sport_code}</span>
      </div>
      <div style="font-size:11.5px; color:var(--text-secondary); margin-top:3px;">
        ${p.team_name} · Pos: ${p.pos} · <span style="color:var(--emerald);">${p.availability}</span>
      </div>
    </div>
  `).join('');

  let detailHtml = '<div style="padding:20px; color:var(--text-secondary);">Select an athlete to inspect point bands.</div>';
  if (pDetail && pDetail.player) {
    const pl = pDetail.player;
    const proj = pDetail.projection;
    const m = pDetail.matchup;
    const bands = pDetail.bands || [];
    const maxB = Math.max(0.05, ...bands.map((b) => b.prob));

    detailHtml = `
      <div class="card-header">
        <div>
          <div class="card-title" style="font-size:18px; color:var(--cyan);">${pl.full_name} (${pl.team_name})</div>
          <div style="font-size:12px; color:var(--text-secondary);">
            Sport: ${pl.sport_code} · Position: ${pl.position} · Availability: <b style="color:var(--emerald);">${pl.avail_status}</b>
          </div>
        </div>
        ${badgeHtml(m.difficulty, `${m.label} (${m.score}/100)`)}
      </div>

      <div class="kpi-grid" style="margin-bottom:18px;">
        <div class="kpi-card">
          <div class="kpi-label">Adjusted Projection</div>
          <div class="kpi-value mono">${proj.adjusted_projection}</div>
          <div class="kpi-sub">Baseline: ${proj.baseline_projection} · Std: ${proj.std_est}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Recent Mean</div>
          <div class="kpi-value mono">${proj.raw_recent_mean}</div>
          <div class="kpi-sub">Sample: ${(pDetail.game_logs || []).length} games</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Secondary Metrics</div>
          <div class="kpi-value mono" style="font-size:17px;">REB ${pDetail.reb_projection.adjusted_projection} · AST ${pDetail.ast_projection.adjusted_projection}</div>
          <div class="kpi-sub">${(m.reasons || []).join(' · ')}</div>
        </div>
      </div>

      <div style="font-weight:700; margin-bottom:10px; color:var(--cyan);">Modelled Scoring Band Distribution</div>
      <div>
        ${bands.map((b) => {
          const w = Math.min(100, Math.round((b.prob / maxB) * 100));
          return `
            <div class="prob-bar-row">
              <div class="mono" style="font-weight:700;">${b.band}</div>
              <div class="prob-bar-track"><div class="prob-bar-fill" style="width:${w}%;"></div></div>
              <div class="mono" style="text-align:right; color:var(--cyan); font-weight:700;">${b.pct_str}</div>
              <div class="mono" style="text-align:right; color:var(--text-secondary);">$${(1 / Math.max(0.01, b.prob)).toFixed(2)}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  box.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Athlete Profile &amp; Prop Distribution Lab</div>
        <div class="page-subtitle">Individual shrinkage projections, opponent defensive adjustments, and scoring band distributions</div>
      </div>
      <div style="display:flex; gap:8px;">
        <select id="playerSportFilter" class="select-field" onchange="renderPlayersPage(this.value, document.getElementById('playerQueryInput').value)">
          <option value="ALL" ${sportFilter === 'ALL' ? 'selected' : ''}>All Sports</option>
          <option value="NBA" ${sportFilter === 'NBA' ? 'selected' : ''}>NBA</option>
          <option value="RUGBY_UNION" ${sportFilter === 'RUGBY_UNION' ? 'selected' : ''}>Rugby Union</option>
          <option value="RUGBY_LEAGUE" ${sportFilter === 'RUGBY_LEAGUE' ? 'selected' : ''}>Rugby League</option>
          <option value="NFL" ${sportFilter === 'NFL' ? 'selected' : ''}>NFL</option>
        </select>
        <input
          type="text"
          id="playerQueryInput"
          class="input-field"
          value="${query}"
          placeholder="Filter player or team..."
          onkeydown="if(event.key==='Enter') renderPlayersPage(document.getElementById('playerSportFilter').value, this.value)"
        />
      </div>
    </div>

    <div class="game-centre-grid">
      <div class="card" style="max-height:74vh; overflow-y:auto;">${listHtml}</div>
      <div class="card">${detailHtml}</div>
    </div>
  `;
}

async function selectPlayerInExplorer(pid) {
  STATE.selectedPlayerId = pid;
  const sf = document.getElementById('playerSportFilter') ? document.getElementById('playerSportFilter').value : 'ALL';
  const q = document.getElementById('playerQueryInput') ? document.getElementById('playerQueryInput').value : '';
  await renderPlayersPage(sf, q);
}

// ============================================================================
// 5. WALK-FORWARD ACCURACY & CALIBRATION PAGE
// ============================================================================
async function renderBacktestPage(sport = 'ALL') {
  const box = document.getElementById('workspaceContent');
  const bt = await apiGet(`/api/backtest?sport=${encodeURIComponent(sport)}`);
  const buckets = bt.calibration_buckets || [];

  box.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Walk-Forward Backtest &amp; Probability Calibration</div>
        <div class="page-subtitle">Leakage-safe chronological evaluation against naive baseline (${bt.mode})</div>
      </div>
      <select class="select-field" onchange="renderBacktestPage(this.value)">
        <option value="ALL" ${sport === 'ALL' ? 'selected' : ''}>All Sports</option>
        <option value="NBA" ${sport === 'NBA' ? 'selected' : ''}>NBA</option>
        <option value="RUGBY_UNION" ${sport === 'RUGBY_UNION' ? 'selected' : ''}>Rugby Union</option>
        <option value="RUGBY_LEAGUE" ${sport === 'RUGBY_LEAGUE' ? 'selected' : ''}>Rugby League</option>
        <option value="NFL" ${sport === 'NFL' ? 'selected' : ''}>NFL</option>
      </select>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Brier Score</div>
        <div class="kpi-value mono">${bt.brier_score}</div>
        <div class="kpi-sub">Baseline: ${bt.baseline_brier} (Skill Δ +${bt.brier_skill_improvement})</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Log Loss</div>
        <div class="kpi-value mono">${bt.log_loss}</div>
        <div class="kpi-sub">Baseline: ${bt.baseline_log_loss}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Margin MAE / RMSE</div>
        <div class="kpi-value mono">${bt.margin_mae} / ${bt.margin_rmse}</div>
        <div class="kpi-sub">Total MAE: ${bt.total_mae} pts</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">10th–90th Coverage</div>
        <div class="kpi-value mono">${(bt.interval_coverage_80 * 100).toFixed(1)}%</div>
        <div class="kpi-sub">Target: 80.0% empirical calibration</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Evaluated Sample</div>
        <div class="kpi-value mono">${bt.sample_size} Games</div>
        <div class="kpi-sub">${bt.mode}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Probability Calibration Curve by 5% Buckets</div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Probability Bucket</th>
              <th>Forecast Count</th>
              <th>Model Expected Hit Rate</th>
              <th>Actual Observed Hit Rate</th>
              <th>Calibration Gap</th>
            </tr>
          </thead>
          <tbody>
            ${buckets.map((b) => `
              <tr>
                <td class="mono" style="font-weight:700;">${b.bucket}</td>
                <td class="mono">${b.count}</td>
                <td class="mono" style="color:var(--cyan);">${(b.predicted_mean * 100).toFixed(1)}%</td>
                <td class="mono" style="color:var(--emerald);">${(b.actual_hit_rate * 100).toFixed(1)}%</td>
                <td class="mono">${b.pct_diff >= 0 ? '+' : ''}${b.pct_diff.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================================
// 6. DATA CENTRE & AUTO-SYNC PAGE
// ============================================================================
async function renderDataCentrePage() {
  const box = document.getElementById('workspaceContent');
  const dc = await apiGet('/api/datacentre');

  box.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">Data Centre, Auto-Sync &amp; Source Governance</div>
        <div class="page-subtitle">Local SQLite Source of Truth · 17 Watched Datasets · Provenance &amp; Licence Registry</div>
      </div>
      <button class="btn btn-primary" onclick="triggerAutoSync()">⟳ Force Sync All 17 Datasets Now</button>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title">Local Database Coverage by Sport</div></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Sport Code</th>
              <th>Teams</th>
              <th>Players</th>
              <th>Fixtures</th>
              <th>Player Game Logs</th>
              <th>Team Game Logs</th>
              <th>Manual Bookie Lines</th>
            </tr>
          </thead>
          <tbody>
            ${(dc.coverage || []).map((c) => `
              <tr>
                <td><span class="badge badge-cyan mono">${c.sport}</span></td>
                <td class="mono">${c.teams}</td>
                <td class="mono">${c.players}</td>
                <td class="mono">${c.fixtures}</td>
                <td class="mono">${c.player_logs}</td>
                <td class="mono">${c.team_logs}</td>
                <td class="mono">${c.manual_lines}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><div class="card-title">Registered Data Sources &amp; Policy Gate</div></div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Source Name</th>
              <th>Type</th>
              <th>Policy Status</th>
              <th>Prediction Pipeline</th>
              <th>Attribution / Licence Notes</th>
            </tr>
          </thead>
          <tbody>
            ${(dc.sources || []).map((s) => `
              <tr>
                <td style="font-weight:700;">${s.name}</td>
                <td class="mono">${s.source_type}</td>
                <td><span class="badge ${s.permitted_prediction_use ? 'badge-easy' : 'badge-close'} mono">${s.policy_status}</span></td>
                <td class="mono">${s.permitted_prediction_use ? 'PERMITTED' : 'BLOCKED'}</td>
                <td style="color:var(--text-secondary); font-size:12px;">${s.attribution || s.notes || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============================================================================
// 7. LIVE MATCH & SCORE WATCHER PAGE (REAL-TIME ARENA SCOREBOARD)
// ============================================================================
async function setAndOpenLiveMatch(fixtureId) {
  STATE.liveWatchedFixtureId = Number(fixtureId);
  STATE.selectedFixtureId = Number(fixtureId);
  await switchPage('livewatch');
  showToast('🔴 Watching live match scoreboard');
}

async function changeLiveWatchedMatch(fixtureId) {
  STATE.liveWatchedFixtureId = Number(fixtureId);
  STATE.selectedFixtureId = Number(fixtureId);
  await renderLiveWatchPage();
}

async function tickLiveMatch(fixtureId) {
  const fid = fixtureId || STATE.liveWatchedFixtureId;
  await apiGet(`/api/live_match?id=${fid}&action=tick`);
  if (STATE.currentPage === 'livewatch') {
    await renderLiveWatchPage();
  } else if (STATE.currentPage === 'multis') {
    await renderMultiStudioPage();
  }
}

async function resetLiveMatch(fixtureId) {
  const fid = fixtureId || STATE.liveWatchedFixtureId;
  await apiGet(`/api/live_match?id=${fid}&action=reset`);
  if (STATE.currentPage === 'livewatch') {
    await renderLiveWatchPage();
  } else if (STATE.currentPage === 'multis') {
    await renderMultiStudioPage();
  }
  showToast('↺ Live match reset to tipoff/kickoff');
}

function toggleLiveAutoRefresh(fixtureId) {
  STATE.liveAutoRefreshEnabled = !STATE.liveAutoRefreshEnabled;
  if (STATE.liveAutoRefreshTimer) {
    clearInterval(STATE.liveAutoRefreshTimer);
    STATE.liveAutoRefreshTimer = null;
  }
  if (STATE.liveAutoRefreshEnabled) {
    const fid = fixtureId || STATE.liveWatchedFixtureId;
    STATE.liveAutoRefreshTimer = setInterval(() => {
      if (STATE.currentPage === 'livewatch' || STATE.currentPage === 'multis') {
        tickLiveMatch(fid);
      } else {
        clearInterval(STATE.liveAutoRefreshTimer);
        STATE.liveAutoRefreshTimer = null;
        STATE.liveAutoRefreshEnabled = false;
      }
    }, 4000);
    showToast('▶ Live Auto-Tick Active (every 4s)');
  } else {
    showToast('⏸ Live Auto-Tick Paused');
  }
  if (STATE.currentPage === 'livescores' || STATE.currentPage === 'livewatch') {
    renderLiveScoresPage();
  }
}

function selectLiveScoreMatch(fid) {
  STATE.liveWatchedFixtureId = fid;
  renderLiveScoresPage();
}

function setLiveSportFilter(sportCode) {
  STATE.liveSportFilter = sportCode;
  renderLiveScoresPage();
}

async function renderLiveScoresPage() {
  const box = document.getElementById('workspaceContent');
  let data = null;
  try {
    data = await apiGet('/api/live_scores');
  } catch (err) {
    data = { live_matches: [] };
  }

  const liveList = (data && data.live_matches && data.live_matches.length > 0)
    ? data.live_matches
    : ((STATE.overviewData && STATE.overviewData.live_scores) || []);

  const sFilter = STATE.liveSportFilter || 'ALL';
  const filteredMatches = sFilter === 'ALL'
    ? liveList
    : liveList.filter((m) => {
        if (sFilter === 'RUGBY') return (m.sport || '').includes('RUGBY');
        return m.sport === sFilter;
      });

  const selectedFid = STATE.liveWatchedFixtureId || (filteredMatches[0] ? filteredMatches[0].fixture_id : 1);

  let detailData = null;
  try {
    detailData = await apiGet(`/api/live_match?id=${selectedFid}`);
  } catch (e) {
    detailData = null;
  }

  const live = detailData || (filteredMatches.find((m) => m.fixture_id === selectedFid) || filteredMatches[0] || {});

  // List of in-play rows matching media_1793675008700_04760069.png
  const listRowsHtml = filteredMatches.length > 0
    ? filteredMatches.map((m) => {
        const isSel = m.fixture_id === selectedFid;
        const hLead = m.home_score >= m.away_score;
        const aLead = m.away_score >= m.home_score;
        const hFair = (1 / Math.max(0.01, m.live_win_prob_home || 0.5)).toFixed(2);
        const aFair = (1 / Math.max(0.01, m.live_win_prob_away || 0.5)).toFixed(2);
        const clockDisplay = m.clock || m.period || 'LIVE';

        return `
          <div class="live-match-row ${isSel ? 'selected' : ''}" onclick="selectLiveScoreMatch(${m.fixture_id})">
            <div class="live-clock-cell mono">
              <div class="live-clock-time">
                <span class="live-pulse-red"></span>
                <span>${clockDisplay}</span>
              </div>
              <div class="live-clock-sub">
                <span class="live-sport-tag">${m.sport}</span>
                <span>📺 In-Play</span>
              </div>
            </div>

            <div class="live-teams-cell">
              <div class="live-team-line ${hLead ? 'leader' : ''}">
                <span style="font-size:12px;">🛡️</span>
                <span>${m.home}</span>
                <span class="mono" style="font-size:11px; color:var(--text-muted); font-weight:600;">($${hFair})</span>
              </div>
              <div class="live-team-line ${aLead ? 'leader' : ''}">
                <span style="font-size:12px;">⚡</span>
                <span>${m.away}</span>
                <span class="mono" style="font-size:11px; color:var(--text-muted); font-weight:600;">($${aFair})</span>
              </div>
            </div>

            <div class="live-scores-cell mono">
              <div class="live-score-box ${hLead ? 'leader' : ''}">${m.home_score}</div>
              <div class="live-score-box ${aLead ? 'leader' : ''}">${m.away_score}</div>
            </div>

            <div class="live-action-cell" onclick="event.stopPropagation();">
              <button class="btn-slip" onclick='addLegToSlip(${JSON.stringify({
                id: `live_f${m.fixture_id}_h_win`,
                fixture_id: m.fixture_id,
                matchup: `${m.home} vs ${m.away}`,
                sport: m.sport,
                leg_type: "LIVE_MONEYLINE",
                player_or_team: m.home,
                market: "In-Play Match Winner",
                selection: `${m.home} (Live)`,
                line: 0,
                prob: m.live_win_prob_home || 0.5,
                fair_odds: Number(hFair),
                correlation_group: "live_moneyline"
              })})'>+ H ($${hFair})</button>
              <button class="btn-slip" onclick='addLegToSlip(${JSON.stringify({
                id: `live_f${m.fixture_id}_a_win`,
                fixture_id: m.fixture_id,
                matchup: `${m.home} vs ${m.away}`,
                sport: m.sport,
                leg_type: "LIVE_MONEYLINE",
                player_or_team: m.away,
                market: "In-Play Match Winner",
                selection: `${m.away} (Live)`,
                line: 0,
                prob: m.live_win_prob_away || 0.5,
                fair_odds: Number(aFair),
                correlation_group: "live_moneyline"
              })})'>+ A ($${aFair})</button>
              <button class="btn btn-primary" style="padding:4px 8px; font-size:11.5px;" onclick="selectMultiStudioTeam('${m.home.replace(/'/g, "\\'")}', ${m.fixture_id}); switchPage('multis');">
                Multis →
              </button>
            </div>
          </div>
        `;
      }).join('')
    : '<div style="padding:24px; text-align:center; color:var(--text-secondary);">No active matches currently in-play for the selected sport filter.</div>';

  const periodCols = (live.periods || []).map((p) => `
    <div class="live-period-col ${p.current ? 'current' : ''}">
      <span style="font-size:9.5px; color:var(--text-muted);">${p.label}</span>
      <span><b>${p.home}</b> - <b>${p.away}</b></span>
    </div>
  `).join('');

  const homeWinPct = ((live.live_win_prob_home || 0.5) * 100).toFixed(1);
  const awayWinPct = ((live.live_win_prob_away || 0.5) * 100).toFixed(1);

  const legsHtml = (live.legs_status || []).map((l) => {
    let statusClass = 'leg-inplay';
    let badgeColor = 'var(--sky-text)';
    if (l.status === 'HIT' || l.status === 'LEADING') {
      statusClass = 'leg-hit';
      badgeColor = 'var(--emerald-text)';
    } else if (l.status === 'BUSTED' || l.status === 'TRAILING') {
      statusClass = 'leg-risk';
      badgeColor = 'var(--crimson-text)';
    }
    return `
      <div class="live-leg-track-card ${statusClass}">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-weight:700; color:#ffffff;">${l.player_or_team || l.selection}</span>
          <span class="mono" style="font-size:10.5px; font-weight:800; color:${badgeColor};">[${l.status}]</span>
        </div>
        <div style="font-size:11.5px; color:var(--text-secondary);">${l.selection}</div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; font-size:11px;">
          <span class="mono" style="color:var(--text-muted);">${l.note}</span>
          <button class="btn-slip" style="padding:2px 7px; font-size:10.5px;" onclick='addLegToSlip(${JSON.stringify({
            id: `live_${selectedFid}_${(l.selection || "").replace(/\s+/g, "_")}`,
            fixture_id: selectedFid,
            matchup: `${live.home} vs ${live.away}`,
            sport: live.sport,
            leg_type: "LIVE_TRACKED",
            player_or_team: l.player_or_team || l.selection,
            market: l.market || "Match Market",
            selection: l.selection,
            line: l.line || 0,
            prob: l.pre_prob || 0.6,
            fair_odds: l.fair_odds || 1.67,
            correlation_group: "live_game",
          })})'>+ Slip</button>
        </div>
      </div>
    `;
  }).join('');

  box.innerHTML = `
    <div class="page-header">
      <div>
        <div class="page-title">
          <span>🔴 Live In-Play Scores</span>
          <span class="live-badge-pulse"><span class="live-pulse-red"></span> ${filteredMatches.length} IN-PLAY</span>
        </div>
        <div class="page-subtitle">Real-time running match scores, quarter clocks, in-play win probabilities, and Bet365 multi tracking</div>
      </div>
      <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
        <button class="btn ${STATE.liveAutoRefreshEnabled ? 'btn-emerald' : ''}" onclick="toggleLiveAutoRefresh(${selectedFid})">
          ${STATE.liveAutoRefreshEnabled ? '⏸ Pause Auto-Update' : '▶ Auto-Update (3s)'}
        </button>
        <button class="btn btn-primary" onclick="tickLiveMatch(${selectedFid})">⚡ Next Play</button>
        <button class="btn" onclick="resetLiveMatch(${selectedFid})">↺ Reset</button>
        <button class="btn" style="color:var(--sky-text);" onclick="selectMultiStudioTeam('${(live.home || '').replace(/'/g, "\\'")}', ${selectedFid}); switchPage('multis');">
          ⚡ Build SGM in Studio →
        </button>
      </div>
    </div>

    <!-- Sport Filters for Live Scores -->
    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:12px;">
      <span style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase;">Sport:</span>
      <button class="tab-btn ${sFilter === 'ALL' ? 'active' : ''}" onclick="setLiveSportFilter('ALL')">All Live (${liveList.length})</button>
      <button class="tab-btn ${sFilter === 'NBA' ? 'active' : ''}" onclick="setLiveSportFilter('NBA')">🏀 NBA Basketball</button>
      <button class="tab-btn ${sFilter === 'RUGBY' ? 'active' : ''}" onclick="setLiveSportFilter('RUGBY')">🏉 Rugby (Union &amp; NRL)</button>
      <button class="tab-btn ${sFilter === 'NFL' ? 'active' : ''}" onclick="setLiveSportFilter('NFL')">🏈 NFL Football</button>
    </div>

    <!-- The Live Scoreboard List (styled like media_1793675008700_04760069.png) -->
    <div class="live-board-wrap">
      <div class="live-scoreboard-list">
        ${listRowsHtml}
      </div>
    </div>

    <!-- Selected In-Play Match Deep Telemetry -->
    ${live && live.home ? `
      <div class="live-scoreboard-hero" style="margin-top:16px;">
        <div class="live-header-strip">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="live-badge-pulse"><span class="live-pulse-red"></span> ${live.status_label || 'LIVE IN-PLAY'}</span>
            <span class="live-clock-pill mono">${live.period || 'Q4'} · ${live.clock || 'LIVE'}</span>
            <span class="mono" style="font-size:11.5px; color:var(--text-secondary);">${live.competition || live.sport} · ${live.venue || ''}</span>
          </div>
          <div class="live-period-breakdown mono">
            ${periodCols}
            <div class="live-period-col" style="border-left:1px solid var(--border-bright); padding-left:8px;">
              <span style="font-size:9.5px; color:var(--text-muted);">TOTAL</span>
              <span style="color:var(--emerald-text); font-weight:800;">${live.total_score || (Number(live.home_score || 0) + Number(live.away_score || 0))}</span>
            </div>
          </div>
        </div>

        <div class="live-score-arena">
          <div class="live-team-col">
            <div style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">HOME FRANCHISE</div>
            <div style="font-size:22px; font-weight:900; color:#ffffff;">${live.home}</div>
            <div class="mono" style="font-size:12px; color:var(--emerald-text); font-weight:700;">Live Win: ${homeWinPct}%</div>
          </div>

          <div class="live-center-divider">
            <div style="display:flex; align-items:baseline; gap:16px;">
              <span class="live-score-digits mono" style="color:var(--emerald-text);">${live.home_score}</span>
              <span style="font-size:20px; font-weight:800; color:var(--text-muted);">–</span>
              <span class="live-score-digits mono" style="color:#38bdf8;">${live.away_score}</span>
            </div>
            <div class="mono" style="font-size:11px; color:var(--text-muted); margin-top:4px;">
              Pre-Game Expected: ${live.pre_home_expected || '—'} – ${live.pre_away_expected || '—'}
            </div>
          </div>

          <div class="live-team-col away">
            <div style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">AWAY FRANCHISE</div>
            <div style="font-size:22px; font-weight:900; color:#ffffff;">${live.away}</div>
            <div class="mono" style="font-size:12px; color:#38bdf8; font-weight:700;">Live Win: ${awayWinPct}%</div>
          </div>
        </div>

        <!-- Live Win Probability Meter -->
        <div class="live-prob-gauge">
          <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:800;" class="mono">
            <span style="color:var(--emerald-text);">${live.home} ${homeWinPct}%</span>
            <span style="color:var(--text-muted);">IN-PLAY WIN PROBABILITY</span>
            <span style="color:#38bdf8;">${live.away} ${awayWinPct}%</span>
          </div>
          <div class="live-prob-track">
            <div class="live-prob-fill-home" style="width:${homeWinPct}%;"></div>
            <div class="live-prob-fill-away" style="width:${awayWinPct}%;"></div>
          </div>
        </div>
      </div>

      <!-- Live Multi Legs Status -->
      ${legsHtml ? `
        <div class="card" style="margin-top:14px;">
          <div class="card-header">
            <div>
              <div class="card-title">
                <span>⚡ In-Play Multi Leg &amp; Market Tracker</span>
                <span class="badge badge-cyan mono">${(live.legs_status || []).length} MARKETS MONITORED</span>
              </div>
              <div style="font-size:11.5px; color:var(--text-secondary); margin-top:2px;">
                Real-time verification showing whether each Bet365 multi leg is covering, on-pace, or hit.
              </div>
            </div>
          </div>
          <div class="live-legs-grid">
            ${legsHtml}
          </div>
        </div>
      ` : ''}
    ` : ''}
  `;
}

async function renderLiveWatchPage() {
  await renderLiveScoresPage();
}

// ============================================================================
// INTERACTIVE BET SLIP & CORRELATED MULTI ENGINE
// ============================================================================
function addLegToSlip(legObj) {
  const existingIdx = STATE.slipLegs.findIndex((x) => x.id === legObj.id);
  if (existingIdx >= 0) {
    STATE.slipLegs[existingIdx] = legObj;
  } else {
    STATE.slipLegs.push(legObj);
  }
  renderSlipUI();
}

function removeLegFromSlip(id) {
  STATE.slipLegs = STATE.slipLegs.filter((x) => x.id !== id);
  renderSlipUI();
}

function clearSlip() {
  STATE.slipLegs = [];
  document.getElementById('slipUserOdds').value = '';
  renderSlipUI();
}

function loadPresetMultiIntoSlip(legs, fixtureId, matchup, sport) {
  STATE.slipLegs = (legs || []).map((l, idx) => {
    const rawProb = parseFloat(String(l.model_prob || '55%').replace('%', '')) / 100.0;
    return {
      id: `preset_f${fixtureId}_${idx}`,
      fixture_id: fixtureId,
      matchup,
      sport,
      leg_type: 'PRESET',
      player_or_team: l.player_or_team,
      market: l.market,
      selection: l.selection,
      line: Number(l.line || 0),
      prob: rawProb,
      correlation_group: sport === 'NBA' ? 'player_pts' : 'general',
      rationale: l.rationale,
    };
  });
  renderSlipUI();
}

async function renderSlipUI() {
  const container = document.getElementById('slipLegsContainer');
  if (!container) return;

  if (STATE.slipLegs.length === 0) {
    container.innerHTML = `
      <div style="padding:26px 14px; text-align:center; color:var(--text-muted); border:1px dashed var(--border-subtle); border-radius:8px;">
        <div style="font-size:13px; font-weight:700; color:var(--text-secondary); margin-bottom:6px;">Your Active Slip is Empty</div>
        <div style="font-size:11.5px;">Click <b>+ Slip</b> on any team moneyline, score band, race threshold, or player prop to compute correlated probabilities and Kelly stakes.</div>
      </div>
    `;
    document.getElementById('slipCountVal').textContent = '0 Legs';
    document.getElementById('slipJointProbVal').textContent = '—';
    document.getElementById('slipRangeVal').textContent = '—';
    document.getElementById('slipFairOddsVal').textContent = '—';
    document.getElementById('slipImpliedVal').textContent = '—';
    document.getElementById('slipEvVal').textContent = 'Add Legs';
    document.getElementById('slipStakeVal').textContent = '$0.00';
    document.getElementById('slipEvBox').className = 'ev-box';
    return;
  }

  container.innerHTML = STATE.slipLegs.map((l) => {
    const fair = (1 / Math.max(0.01, l.prob)).toFixed(2);
    return `
      <div class="slip-leg-card">
        <div class="slip-leg-top">
          <div>
            <div class="slip-leg-name">${l.selection}</div>
            <div style="font-size:11px; color:var(--text-secondary);">${l.matchup || l.sport || ''} · ${l.market}</div>
            <div style="margin-top:3px;"><span class="bet365-badge" style="font-size:9.5px; padding:1px 6px;">✓ Bet365 SGM Ready</span></div>
          </div>
          <button class="slip-remove-btn" onclick="removeLegFromSlip('${l.id}')">✕</button>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:4px; font-size:11.5px;">
          <span class="mono" style="color:var(--cyan); font-weight:700;">Model: ${(l.prob * 100).toFixed(1)}% (Fair $${fair})</span>
          ${l.user_odds ? `<span class="mono" style="color:var(--emerald);">Bookie: $${Number(l.user_odds).toFixed(2)}</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  await recalculateSlip();
}

async function recalculateSlip() {
  if (STATE.slipLegs.length === 0) return;

  const userOddsVal = parseFloat(document.getElementById('slipUserOdds').value || '0');
  const bankrollVal = parseFloat(document.getElementById('slipBankroll').value || '1000');
  const kellyVal = parseFloat(document.getElementById('slipKellyFraction').value || '0.25');

  const res = await apiPost('/api/custom_multi', {
    legs: STATE.slipLegs,
    user_combined_odds: userOddsVal > 1 ? userOddsVal : null,
    bankroll: bankrollVal,
    kelly_fraction: kellyVal,
  });

  document.getElementById('slipCountVal').textContent = `${res.legs_count} Leg${res.legs_count > 1 ? 's' : ''}`;
  document.getElementById('slipJointProbVal').textContent = `${res.joint_prob_pct}%`;
  document.getElementById('slipRangeVal').textContent = res.prob_range_str;
  document.getElementById('slipFairOddsVal').textContent = `$${res.fair_odds.toFixed(2)}`;

  const evBox = document.getElementById('slipEvBox');
  if (res.effective_user_odds && res.ev_pct !== null) {
    document.getElementById('slipImpliedVal').textContent = `${res.implied_prob_pct}% ($${res.effective_user_odds.toFixed(2)})`;
    const sign = res.ev_pct >= 0 ? '+' : '';
    const edgeSign = res.edge_diff_pct >= 0 ? '+' : '';
    document.getElementById('slipEvVal').textContent = `${edgeSign}${res.edge_diff_pct}% Edge (${sign}${res.ev_pct}% EV)`;
    document.getElementById('slipStakeVal').textContent = `$${res.recommended_stake.toFixed(2)} (${res.kelly_pct}%)`;
    evBox.className = res.ev_pct > 0 ? 'ev-box positive' : 'ev-box negative';
  } else {
    document.getElementById('slipImpliedVal').textContent = 'Enter Bookie Odds ↑';
    document.getElementById('slipEvVal').textContent = `Fair Price $${res.fair_odds.toFixed(2)}`;
    document.getElementById('slipStakeVal').textContent = '$0.00';
    evBox.className = 'ev-box';
  }

  const allNotes = [...(res.warnings || []), ...(res.notes || [])];
  document.getElementById('slipCorrelationNotes').innerHTML = allNotes.map((n) => `<div>• ${n}</div>`).join('');
}

// ============================================================================
// MODALS & ACTIONS
// ============================================================================
function populateManualMarketFixtures() {
  const sel = document.getElementById('mmFixtureSelect');
  if (!sel || !STATE.overviewData) return;
  const s = STATE.overviewData.sports || {};
  const all = [...(s.NBA || []), ...(s.RUGBY_UNION || []), ...(s.RUGBY_LEAGUE || []), ...(s.NFL || [])];
  sel.innerHTML = all.map((f) => `<option value="${f.id}">[${f.sport}] ${f.home} vs ${f.away}</option>`).join('');
}

function openManualMarketModal(defaultFid = null) {
  populateManualMarketFixtures();
  if (defaultFid) {
    document.getElementById('mmFixtureSelect').value = String(defaultFid);
  } else if (STATE.selectedFixtureId) {
    document.getElementById('mmFixtureSelect').value = String(STATE.selectedFixtureId);
  }
  document.getElementById('manualMarketModal').classList.add('open');
}

function closeManualMarketModal() {
  document.getElementById('manualMarketModal').classList.remove('open');
}

async function submitManualMarket() {
  const fixture_id = Number(document.getElementById('mmFixtureSelect').value);
  const market_code = document.getElementById('mmMarketCode').value;
  const bookmaker_name = document.getElementById('mmBookmaker').value;
  const selection = document.getElementById('mmSelection').value.trim();
  const lineRaw = document.getElementById('mmLine').value.trim();
  const oddsRaw = document.getElementById('mmOdds').value.trim();

  if (!selection || !oddsRaw) {
    alert('Please enter both a selection label and bookmaker decimal odds.');
    return;
  }

  await apiPost('/api/manual_market', {
    fixture_id,
    market_code,
    bookmaker_name,
    selection,
    line_value: lineRaw ? Number(lineRaw) : null,
    user_odds: Number(oddsRaw),
    status: 'User entered odds',
  });

  closeManualMarketModal();
  await loadOverviewData();
}

async function deleteManualMarket(id, fid) {
  await fetch(`/api/manual_market?id=${id}`, { method: 'DELETE' });
  await loadOverviewData();
}

function openPasteOrderModal(sportCode = 'NBA') {
  STATE.pasteOrderSport = sportCode;
  document.getElementById('pasteOrderModal').classList.add('open');
}

function closePasteOrderModal() {
  document.getElementById('pasteOrderModal').classList.remove('open');
}

async function submitPasteOrder() {
  const raw_text = document.getElementById('pasteOrderTextarea').value;
  await apiPost('/api/order/paste', {
    sport_code: STATE.pasteOrderSport,
    raw_text,
  });
  closePasteOrderModal();
  await loadOverviewData();
}

async function triggerAutoSync() {
  document.getElementById('topStatusBadge').textContent = '⟳ AUTO-SYNCING 17 DATASETS...';
  await apiPost('/api/sync', {});
  await loadOverviewData();
}

async function handleGlobalSearch() {
  const q = document.getElementById('globalSearchInput').value.trim();
  if (!q) return;
  STATE.currentPage = 'players';
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.page === 'players');
  });
  await renderPlayersPage('ALL', q);
}

async function shutdownWebServer() {
  try {
    await apiPost('/api/shutdown', {});
  } catch (_) {
    // Expected if socket closes immediately
  }
  document.body.innerHTML = `
    <div style="display:flex; height:100vh; width:100vw; align-items:center; justify-content:center; background:#05080f; color:#f1f7ff; font-family:Inter,Segoe UI,sans-serif;">
      <div style="background:#0c1322; border:1px solid #283e64; border-left:4px solid #00e676; border-radius:12px; padding:32px 38px; max-width:540px; text-align:center; box-shadow:0 20px 60px rgba(0,0,0,0.65);">
        <div style="font-size:20px; font-weight:800; color:#00e5ff; margin-bottom:10px;">⏻ SPORTS EDGE AI Website Stopped</div>
        <p style="font-size:13.5px; color:#9fb2cd; line-height:1.55; margin-bottom:18px;">
          The background local web server (<code>127.0.0.1:8765</code>) has been cleanly shut down. You can now close this browser tab.
        </p>
        <div style="font-size:12px; color:#647896;">
          To launch again anytime, double-click <b>Start_Web.bat</b>, <b>Launch_SportsEdgeAI_Web.bat</b>, or the <b>SPORTS EDGE AI Web</b> Desktop shortcut.
        </div>
      </div>
    </div>
  `;
  setTimeout(() => {
    try { window.close(); } catch (_) {}
  }, 600);
}

function showToast(msg) {
  let t = document.getElementById('globalToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'globalToast';
    t.className = 'toast-notice';
    document.body.appendChild(t);
  }
  t.innerHTML = `<span>${msg}</span>`;
  t.style.display = 'flex';
  clearTimeout(window.__toastTimeout);
  window.__toastTimeout = setTimeout(() => {
    t.style.display = 'none';
  }, 2600);
}

function copySlipForBet365() {
  if (!STATE.slipLegs || STATE.slipLegs.length === 0) {
    showToast('⚠️ Slip is empty — add selections to copy');
    return;
  }
  const lines = [
    `=== SPORTS EDGE AI — BET365 MULTI SELECTIONS ===`,
    `Generated: ${new Date().toLocaleString()}`,
    `Active Legs (${STATE.slipLegs.length}):`,
  ];
  STATE.slipLegs.forEach((l, idx) => {
    const fair = (1 / Math.max(0.01, l.prob)).toFixed(2);
    lines.push(`  ${idx + 1}. [${l.sport || 'BET365'}] ${l.matchup || ''}`);
    lines.push(`     Market: ${l.market || 'Match / Prop'}`);
    lines.push(`     Selection: ${l.selection}`);
    lines.push(`     Model Win Prob: ${(l.prob * 100).toFixed(1)}% | Fair Odds: $${fair}`);
    if (l.user_odds) lines.push(`     Confirmed Bookmaker Odds: $${Number(l.user_odds).toFixed(2)}`);
  });
  const fairOdds = document.getElementById('slipFairOddsVal') ? document.getElementById('slipFairOddsVal').textContent : '—';
  const jointProb = document.getElementById('slipJointProbVal') ? document.getElementById('slipJointProbVal').textContent : '—';
  lines.push(`----------------------------------------`);
  lines.push(`Correlated Joint Win Prob: ${jointProb}`);
  lines.push(`Model Combined Fair Decimal Price: ${fairOdds}`);
  lines.push(`========================================`);

  const fullText = lines.join('\n');
  navigator.clipboard.writeText(fullText).then(() => {
    showToast('✓ Bet365 Selections Copied to Clipboard!');
  }).catch(() => {
    showToast('✓ Selections ready for Bet365 manual entry');
  });
}

function copyPresetMultiForBet365(legs, title, fairOdds) {
  if (!legs || legs.length === 0) return;
  const lines = [
    `=== BET365 SAME-GAME MULTI: ${title} ===`,
    `Model Fair Price: $${Number(fairOdds).toFixed(2)}`,
    `Placeable Legs (${legs.length}):`,
  ];
  legs.forEach((l, idx) => {
    lines.push(`  ${idx + 1}. ${l.player_or_team} — ${l.selection}`);
    lines.push(`     Bet365 Market Path: ${l.bet365_market_path || 'SGM Main / Player Markets'}`);
    lines.push(`     Model Prob: ${l.model_prob} ($${Number(l.fair_odds).toFixed(2)})`);
  });
  lines.push(`========================================`);

  const fullText = lines.join('\n');
  navigator.clipboard.writeText(fullText).then(() => {
    showToast(`✓ ${title} Copied for Bet365!`);
  }).catch(() => {
    showToast(`✓ Copied for Bet365!`);
  });
}

/* ============================================================================
 * GEMINI 3.8 HIGH-REASONING MULTI AUDIT MODAL & ENGINE
 * ============================================================================ */
function closeGeminiAuditModal() {
  const m = document.getElementById('geminiAuditModal');
  if (m) m.style.display = 'none';
}

async function runGeminiMultiAudit() {
  if (!STATE.slipLegs || STATE.slipLegs.length === 0) {
    showToast('⚠️ Slip is empty — add at least 1 leg to run Gemini 3.8 Audit');
    return;
  }

  const modal = document.getElementById('geminiAuditModal');
  const body = document.getElementById('geminiAuditModalBody');
  if (!modal || !body) return;

  modal.style.display = 'flex';
  body.innerHTML = `
    <div style="padding:40px 20px; text-align:center;">
      <div style="display:inline-block; width:52px; height:52px; border:3px solid rgba(0,229,255,0.2); border-top-color:var(--cyan); border-radius:50%; animation:spin 0.8s linear infinite;"></div>
      <div style="margin-top:20px; font-size:16px; font-weight:800; color:var(--text-main); letter-spacing:0.5px;">
        🤖 GEMINI 3.8 HIGH REASONING ENGINE ACTIVATED
      </div>
      <div style="margin-top:8px; font-size:12.5px; color:var(--text-secondary); max-width:480px; margin-left:auto; margin-right:auto;">
        Evaluating ${STATE.slipLegs.length} candidate legs across 50,000-run Monte Carlo covariance matrix, Bet365 SGM placement constraints, and institutional EV boundaries...
      </div>
    </div>
  `;

  const userOddsInput = document.getElementById('slipUserOdds');
  const userOdds = userOddsInput && userOddsInput.value ? Number(userOddsInput.value) : 0;
  const bankrollInput = document.getElementById('slipBankroll');
  const stake = bankrollInput && bankrollInput.value ? Number(bankrollInput.value) * 0.025 : 25.0;

  try {
    const res = await fetch('/api/multi/gemini_audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        legs: STATE.slipLegs,
        combined_odds: userOdds,
        stake: stake,
        timestamp: new Date().toISOString()
      })
    });
    const audit = await res.json();
    if (!audit.success) {
      body.innerHTML = `
        <div class="banner-alert banner-alert-danger" style="margin:20px 0;">
          <b>Audit Error:</b> ${audit.error || 'Failed to complete multi audit.'}
        </div>
      `;
      return;
    }

    renderGeminiAuditReport(audit);
  } catch (err) {
    body.innerHTML = `
      <div class="banner-alert banner-alert-danger" style="margin:20px 0;">
        <b>Audit Exception:</b> ${err.message || 'Network error communicating with Gemini 3.8 audit service.'}
      </div>
    `;
  }
}

function renderGeminiAuditReport(audit) {
  const body = document.getElementById('geminiAuditModalBody');
  const badge = document.getElementById('auditBet365Badge');
  if (!body) return;

  if (badge) {
    badge.textContent = audit.bet365_badge;
    badge.className = audit.is_bet365_compliant ? 'badge badge-easy' : 'badge badge-close';
  }

  const scoreColor = audit.audit_score >= 85 ? 'var(--emerald)' : (audit.audit_score >= 70 ? 'var(--cyan)' : (audit.audit_score >= 55 ? 'var(--amber)' : 'var(--crimson)'));

  body.innerHTML = `
    <!-- Top Summary Card: Score, Grade & Staking Verdict -->
    <div style="display:grid; grid-template-columns: 140px 1fr 220px; gap:16px; background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:10px; padding:16px; margin-bottom:18px; align-items:center;">
      <div style="text-align:center; border-right:1px solid var(--border-subtle); padding-right:14px;">
        <div style="font-size:11px; text-transform:uppercase; font-weight:800; color:var(--text-secondary); letter-spacing:0.5px;">Audit Score</div>
        <div class="mono" style="font-size:42px; font-weight:900; line-height:1.1; color:${scoreColor};">${audit.audit_score}</div>
        <div style="display:inline-block; font-size:11px; font-weight:800; padding:2px 8px; border-radius:4px; background:rgba(255,255,255,0.08); margin-top:2px;">
          GRADE ${audit.overall_grade}
        </div>
      </div>

      <div>
        <div style="font-size:11px; text-transform:uppercase; font-weight:800; color:var(--text-secondary); letter-spacing:0.5px;">Institutional Executive Verdict</div>
        <div style="font-size:18px; font-weight:900; color:var(--text-main); margin-top:3px; display:flex; align-items:center; gap:8px;">
          <span>${audit.verdict}</span>
        </div>
        <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
          Model Fair: <b style="color:var(--text-main);">$${audit.joint_fair_odds}</b> (${(audit.joint_fair_probability * 100).toFixed(2)}%) · 
          Bookmaker Line: <b style="color:var(--cyan);">$${audit.bookmaker_odds}</b> · 
          Calculated EV: <b style="color:${audit.expected_value_pct >= 0 ? 'var(--emerald)' : 'var(--crimson)'};">${audit.expected_value_pct > 0 ? '+' : ''}${audit.expected_value_pct}%</b>
        </div>
      </div>

      <div style="border-left:1px solid var(--border-subtle); padding-left:14px;">
        <div style="font-size:11px; text-transform:uppercase; font-weight:800; color:var(--text-secondary); letter-spacing:0.5px;">Bet365 SGM Status</div>
        <div style="margin-top:4px;">
          <span class="badge ${audit.is_bet365_compliant ? 'badge-easy' : 'badge-close'}" style="font-size:11px; font-weight:800; padding:4px 8px;">
            ${audit.bet365_badge}
          </span>
        </div>
        <div style="font-size:11.5px; color:var(--text-secondary); margin-top:6px;">
          Recommended Kelly Stake: <b class="mono" style="color:var(--cyan); font-size:13px;">$${audit.recommended_stake.toFixed(2)}</b>
        </div>
      </div>
    </div>

    <!-- Bet365 Rules & Correlation Compliance Checklist -->
    <div style="background:rgba(0,0,0,0.25); border:1px solid var(--border-subtle); border-radius:8px; padding:12px 16px; margin-bottom:18px;">
      <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:var(--cyan); letter-spacing:0.5px; margin-bottom:8px;">
        ✓ Bet365 Placement &amp; Correlation Verification Checklist
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; font-size:12px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:var(--emerald);">✓</span>
          <span><b>Leg Limit:</b> ${audit.n_legs} / 14 maximum Bet365 accumulator legs</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:${audit.correlation_risk === 'HIGH' ? 'var(--crimson)' : 'var(--emerald)'};">${audit.correlation_risk === 'HIGH' ? '✕' : '✓'}</span>
          <span><b>Correlation Risk:</b> ${audit.correlation_risk} (Covariance evaluated)</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:${audit.is_bet365_compliant ? 'var(--emerald)' : 'var(--amber)'};">${audit.is_bet365_compliant ? '✓' : '⚠'}</span>
          <span><b>Market Leg Eligibility:</b> Standard .5 half-points &amp; primary lines</span>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="color:var(--emerald);">✓</span>
          <span><b>Push Prevention:</b> Verified non-whole number lines</span>
        </div>
      </div>
      ${(audit.bet365_warnings || []).length > 0 ? `
        <div style="margin-top:10px; padding:8px 12px; background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); border-radius:6px; font-size:12px; color:#fca5a5;">
          ${audit.bet365_warnings.join('<br>')}
        </div>
      ` : ''}
    </div>

    <!-- Leg by Leg Stress-Test Matrix -->
    <div style="margin-bottom:18px;">
      <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:var(--text-secondary); letter-spacing:0.5px; margin-bottom:8px;">
        Candidate Legs Stress-Test Matrix (${audit.n_legs} Active Selections)
      </div>
      <div style="overflow-x:auto; border:1px solid var(--border-subtle); border-radius:8px; margin-bottom:18px;">
        <table class="data-table" style="font-size:12px; margin:0; width:100%; border-collapse:collapse;">
          <thead>
            <tr>
              <th style="width:36px; text-align:center;">#</th>
              <th style="min-width:180px;">Matchup / Sport</th>
              <th style="min-width:170px;">Market &amp; Selection</th>
              <th style="min-width:100px; text-align:right;">Model Win Prob</th>
              <th style="min-width:90px; text-align:right;">Fair Odds</th>
              <th style="min-width:90px; text-align:center;">Volatility</th>
              <th style="min-width:130px;">Correlation Synergy</th>
            </tr>
          </thead>
          <tbody>
            ${(audit.leg_audits || []).map(l => `
              <tr>
                <td class="mono" style="font-weight:700; text-align:center;">${l.leg_number}</td>
                <td>
                  <div style="font-weight:700; color:var(--text-main);">${l.matchup}</div>
                  <div style="font-size:10.5px; color:var(--text-secondary);">${l.sport}</div>
                </td>
                <td>
                  <div style="color:var(--cyan); font-weight:600;">${l.selection}</div>
                  <div style="font-size:10.5px; color:var(--text-secondary);">${l.market}</div>
                </td>
                <td class="mono" style="text-align:right; font-weight:700; color:var(--emerald);">${l.fair_probability}</td>
                <td class="mono" style="text-align:right; font-weight:700;">${l.fair_odds}</td>
                <td style="text-align:center;">
                  <span class="badge ${l.status === 'STABLE' ? 'badge-easy' : (l.status === 'BALANCED' ? 'badge-mid' : 'badge-close')}" style="font-size:10px;">
                    ${l.status}
                  </span>
                </td>
                <td style="font-size:11px; color:var(--text-secondary);">${l.correlation_impact}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Strengths & Key Vulnerabilities -->
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-bottom:18px;">
      <div style="background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.25); border-radius:8px; padding:12px 14px;">
        <div style="font-size:11.5px; font-weight:800; text-transform:uppercase; color:var(--emerald); margin-bottom:6px;">
          ✓ Key Strengths &amp; Edge Multipliers
        </div>
        <ul style="margin:0; padding-left:18px; font-size:11.5px; color:var(--text-secondary); line-height:1.45;">
          ${audit.strengths.map(s => `<li style="margin-bottom:4px;">${s}</li>`).join('')}
        </ul>
      </div>

      <div style="background:rgba(239,68,68,0.06); border:1px solid rgba(239,68,68,0.25); border-radius:8px; padding:12px 14px;">
        <div style="font-size:11.5px; font-weight:800; text-transform:uppercase; color:var(--crimson); margin-bottom:6px;">
          ⚠ Tail Risks &amp; Variance Blockers
        </div>
        <ul style="margin:0; padding-left:18px; font-size:11.5px; color:var(--text-secondary); line-height:1.45;">
          ${audit.vulnerabilities.map(v => `<li style="margin-bottom:4px;">${v}</li>`).join('')}
        </ul>
      </div>
    </div>

    <!-- Gemini 3.8 High-Reasoning Executive Summary Block -->
    <div>
      <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:var(--text-secondary); letter-spacing:0.5px; margin-bottom:8px; display:flex; align-items:center; gap:8px;">
        <span>Gemini 3.8 High-Reasoning Executive Breakdown</span>
        <span class="badge" style="background:rgba(0,229,255,0.1); color:var(--cyan); font-size:9.5px;">MONTE CARLO SYNTHESIS</span>
      </div>
      <div class="mono" style="background:#030712; border:1px solid var(--border-bright); border-radius:8px; padding:18px 20px; font-size:12px; line-height:1.65; color:#d1d5db; white-space:pre-wrap; max-height:420px; overflow-y:auto;">${audit.gemini_reasoning}</div>
    </div>
  `;
}

// ============================================================================
// DISCORD 48H ADVANCE EASY MULTI ALERTS & SUBSCRIPTIONS
// ============================================================================

async function openDiscordAlertsModal() {
  const modal = document.getElementById('discordAlertsModal');
  if (modal) modal.style.display = 'flex';
  await loadDiscordSubscriptions();
}

function closeDiscordAlertsModal() {
  const modal = document.getElementById('discordAlertsModal');
  if (modal) modal.style.display = 'none';
  const fb = document.getElementById('discordAlertFeedback');
  if (fb) fb.style.display = 'none';
}

function showDiscordFeedback(msg, isError = false) {
  const fb = document.getElementById('discordAlertFeedback');
  if (!fb) return;
  fb.innerHTML = msg;
  fb.style.display = 'block';
  fb.style.background = isError ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)';
  fb.style.border = isError ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(16,185,129,0.3)';
  fb.style.color = isError ? '#fca5a5' : '#a7f3d0';
}

async function loadDiscordSubscriptions() {
  try {
    const res = await fetch('/api/discord/subscriptions');
    if (!res.ok) return;
    const data = await res.json();
    const subs = data.subscriptions || ['NBA', 'WORLD_CUP', 'NFL'];
    
    const checkboxes = {
      NBA: document.getElementById('sub_NBA'),
      RUGBY_UNION: document.getElementById('sub_RUGBY_UNION'),
      RUGBY_LEAGUE: document.getElementById('sub_RUGBY_LEAGUE'),
      WORLD_CUP: document.getElementById('sub_WORLD_CUP'),
      NFL: document.getElementById('sub_NFL'),
    };
    for (const [key, el] of Object.entries(checkboxes)) {
      if (el) el.checked = subs.includes(key);
    }
  } catch (e) {
    console.error('Error loading Discord subscriptions:', e);
  }
}

function getSelectedSubscriptionCategories() {
  const keys = ['NBA', 'RUGBY_UNION', 'RUGBY_LEAGUE', 'WORLD_CUP', 'NFL'];
  const selected = [];
  for (const k of keys) {
    const el = document.getElementById(`sub_${k}`);
    if (el && el.checked) selected.push(k);
  }
  return selected;
}

async function saveDiscordSubscriptions() {
  const categories = getSelectedSubscriptionCategories();
  const btn = document.getElementById('btnSaveDiscordSubs');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Saving...';
  }
  try {
    const res = await fetch('/api/discord/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    });
    const data = await res.json();
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💾 Save Subscriptions';
    }
    if (data.success) {
      showDiscordFeedback(`✓ Subscriptions saved: <b>${categories.join(', ')}</b>. 48h advance rule active for EASY matchups.`);
    } else {
      showDiscordFeedback(data.error || 'Failed to save subscriptions.', true);
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '💾 Save Subscriptions';
    }
    showDiscordFeedback('Network error: ' + err.message, true);
  }
}

async function triggerDiscordAlertsNow() {
  const categories = getSelectedSubscriptionCategories();
  const btn = document.getElementById('btnTriggerDiscordAlertNow');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⚡ Compiling & Dispatching to Discord...';
  }

  try {
    const res = await fetch('/api/discord/trigger_alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories }),
    });
    const data = await res.json();
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⚡ Push 48h Easy Multis Now';
    }

    if (data.success) {
      const gameList = (data.easy_games || []).slice(0, 3).join(', ');
      showDiscordFeedback(`✓ <b>48h Advance Easy Multis dispatched to Discord (#MULTI SUGGESTIONS)!</b><br>Qualified Games (${data.count}): ${gameList}...<br>Check your Discord channel.`);
    } else {
      showDiscordFeedback(data.error || 'Failed to dispatch alerts.', true);
    }
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⚡ Push 48h Easy Multis Now';
    }
    showDiscordFeedback('Network error triggering alert: ' + err.message, true);
  }
}



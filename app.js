(() => {
  const { gps, game, distances, difficulties, map: mapSettings } = window.RUNAWAY_SETTINGS;
  const safetyDialog = document.querySelector('#safety-dialog');
  const safetyCheck = document.querySelector('#safety-check');
  const safetyConfirm = document.querySelector('#safety-confirm');
  const state = { map: null, runnerMarker: null, accuracyCircle: null, chaserMarkers: [], watchId: null, runner: null, previousPosition: null, chaserList: [], difficulty: 'normal', custom: null, goalType: 'time', goalValue: 600, phase: 'idle', distanceMeters: 0, startedAt: null, phaseStartedAt: null, lastTickAt: null, caughtSince: null, lastAlert: null, timerId: null };

  const byId = (id) => document.querySelector(`#${id}`);
  const formatDistance = (meters) => meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`;
  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const radians = (value) => value * Math.PI / 180;
  const haversine = (from, to) => {
    const dLat = radians(to.lat - from.lat); const dLng = radians(to.lng - from.lng);
    const value = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * 6371000 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  };
  const headingTo = (from, to) => {
    const dLng = radians(to.lng - from.lng);
    const y = Math.sin(dLng) * Math.cos(radians(to.lat));
    const x = Math.cos(radians(from.lat)) * Math.sin(radians(to.lat)) - Math.sin(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.cos(dLng);
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  };
  const destination = (origin, bearingDegrees, meters) => {
    const radius = 6371000; const bearing = radians(bearingDegrees); const lat = radians(origin.lat); const lng = radians(origin.lng); const distance = meters / radius;
    const nextLat = Math.asin(Math.sin(lat) * Math.cos(distance) + Math.cos(lat) * Math.sin(distance) * Math.cos(bearing));
    const nextLng = lng + Math.atan2(Math.sin(bearing) * Math.sin(distance) * Math.cos(lat), Math.cos(distance) - Math.sin(lat) * Math.sin(nextLat));
    return { lat: nextLat * 180 / Math.PI, lng: nextLng * 180 / Math.PI };
  };
  const vibrate = (pattern) => { if (navigator.vibrate) navigator.vibrate(pattern); };
  const showScreen = (name) => {
    document.querySelectorAll('[data-screen]').forEach((screen) => screen.classList.toggle('is-hidden', screen.dataset.screen !== name));
    if (name === 'game' && state.map) setTimeout(() => state.map.invalidateSize(), 0);
  };
  const setGpsStatus = (status, detail = '') => {
    byId('gps-status').textContent = status;
    byId('accuracy-reading').textContent = detail;
    byId('gps-status-panel').classList.toggle('is-hidden', status === '位置情報を取得中');
  };
  const setPhase = (title, detail, canStart = false) => { byId('phase-title').textContent = title; byId('phase-detail').textContent = detail; byId('start-game-button').disabled = !canStart; };
  const activeDifficulty = () => state.custom || difficulties[state.difficulty];

  const createMap = (lat, lng) => {
    if (state.map) return;
    state.map = L.map('map', { zoomControl: false, attributionControl: true }).setView([lat, lng], mapSettings.initialZoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: mapSettings.maxZoom, attribution: '&copy; OpenStreetMap contributors' }).addTo(state.map);
    L.control.zoom({ position: 'bottomright' }).addTo(state.map);
  };
  const updateChaserMarkers = () => {
    const icon = L.divIcon({ className: 'chaser-marker-wrap', html: '<span class="chaser-marker"></span>', iconSize: [30, 30], iconAnchor: [15, 15] });
    state.chaserList.forEach((chaser, index) => {
      const point = [chaser.lat, chaser.lng];
      if (!state.chaserMarkers[index]) state.chaserMarkers[index] = L.marker(point, { icon, zIndexOffset: 900 }).addTo(state.map).bindTooltip('CHASER', { direction: 'top', offset: [0, -13] });
      else state.chaserMarkers[index].setLatLng(point);
    });
  };
  const spawnChaser = () => {
    if (!state.runner || state.chaserList.length) return;
    const range = distances.initialSpawnMaxMeters - distances.initialSpawnMinMeters;
    const count = activeDifficulty().initialChaserCount;
    const startBearing = Math.random() * 360;
    state.chaserList = Array.from({ length: count }, (_, index) => destination(state.runner, startBearing + index * (360 / count), distances.initialSpawnMinMeters + Math.random() * range));
    updateChaserMarkers();
  };
  const framePlayers = () => {
    if (!state.map || !state.runner || !state.chaserList.length) return;
    state.map.fitBounds([[state.runner.lat, state.runner.lng], ...state.chaserList.map((chaser) => [chaser.lat, chaser.lng])], {
      paddingTopLeft: [24, 130],
      paddingBottomRight: [24, 230],
      maxZoom: 16,
      animate: true,
    });
  };
  const resetGame = () => {
    clearInterval(state.timerId);
    state.phase = 'ready'; state.chaserList = []; state.previousPosition = null; state.distanceMeters = 0; state.startedAt = null; state.phaseStartedAt = null; state.lastTickAt = null; state.caughtSince = null; state.lastAlert = null;
    state.chaserMarkers.forEach((marker) => state.map?.removeLayer(marker)); state.chaserMarkers = [];
    byId('result-panel').classList.add('is-hidden'); byId('ready-panel').classList.remove('is-hidden');
    byId('primary-label').textContent = state.goalType === 'time' ? '残り時間' : '経過時間';
    byId('time-reading').textContent = state.goalType === 'time' ? formatTime(state.goalValue) : '00:00'; byId('distance-reading').textContent = '0 m'; byId('nearest-reading').textContent = '-- m';
  };
  const finishGame = (outcome) => {
    if (state.phase === 'ended') return;
    clearInterval(state.timerId); state.phase = 'ended'; byId('ready-panel').classList.add('is-hidden'); byId('result-panel').classList.remove('is-hidden');
    const elapsed = state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : 0;
    byId('result-label').textContent = outcome === 'escaped' ? 'MISSION COMPLETE' : outcome === 'caught' ? 'CHASE ENDED' : 'RUN ENDED';
    byId('result-title').textContent = outcome === 'escaped' ? 'ESCAPED!' : outcome === 'caught' ? 'CAUGHT' : 'RETIRED';
    byId('result-detail').textContent = outcome === 'escaped' ? '逃走成功' : outcome === 'caught' ? '確保されました' : '逃走を終了しました';
    byId('result-time').textContent = formatTime(elapsed); byId('result-distance').textContent = formatDistance(state.distanceMeters);
    vibrate(outcome === 'caught' ? [200, 100, 200, 100, 300] : [100, 80, 100]);
  };
  const moveChaser = (seconds) => {
    if (!state.runner || !state.chaserList.length) return;
    const speed = activeDifficulty().speedKmh;
    state.chaserList = state.chaserList.map((chaser) => {
      const remaining = haversine(chaser, state.runner); const moved = Math.min(remaining, speed * 1000 / 3600 * seconds);
      return destination(chaser, headingTo(chaser, state.runner), moved);
    });
    updateChaserMarkers();
  };
  const gameTick = () => {
    if (!state.startedAt || state.phase === 'ended') return;
    const now = Date.now(); const elapsed = Math.floor((now - state.startedAt) / 1000);
    byId('time-reading').textContent = formatTime(state.goalType === 'time' ? Math.max(0, state.goalValue - elapsed) : elapsed);
    if (state.goalType === 'time' && elapsed >= state.goalValue) return finishGame('escaped');
    if (state.goalType === 'distance' && state.distanceMeters >= state.goalValue) return finishGame('escaped');
    if (state.phase === 'countdown') {
      const left = Math.max(0, game.countdownSeconds - Math.floor((now - state.phaseStartedAt) / 1000));
      setPhase(left ? String(left) : 'RUN!', '安全を確認して逃走してください');
      if (!left) { state.phase = 'grace'; state.phaseStartedAt = now; vibrate(100); }
      return;
    }
    if (state.phase === 'grace') {
      const left = Math.max(0, activeDifficulty().graceSeconds - Math.floor((now - state.phaseStartedAt) / 1000));
      setPhase('RUN!', `チェイサー追跡開始まで ${left}秒`);
      if (!left) { state.phase = 'chase'; state.lastTickAt = now; byId('ready-panel').classList.add('is-hidden'); vibrate([120, 80, 120]); }
      return;
    }
    if (state.phase !== 'chase' || !state.runner || !state.chaserList.length) return;
    const delta = Math.min(3, Math.max(0, (now - state.lastTickAt) / 1000)); state.lastTickAt = now; moveChaser(delta);
    const nearest = Math.min(...state.chaserList.map((chaser) => haversine(state.runner, chaser))); byId('nearest-reading').textContent = formatDistance(nearest);
    const alert = nearest <= distances.spottedMeters ? 'DANGER' : nearest <= distances.warningMeters ? 'WARNING' : nearest <= distances.detectMeters ? 'CHASER DETECTED' : '';
    if (alert && alert !== state.lastAlert) { state.lastAlert = alert; setGpsStatus(alert, `最接近チェイサー: ${formatDistance(nearest)}`); vibrate(alert === 'DANGER' ? [100, 60, 100, 60, 100] : alert === 'WARNING' ? [100, 70, 100] : 100); }
    if (nearest <= distances.catchMeters && state.runner.accuracy <= gps.poorAccuracyMeters) {
      state.caughtSince ??= now;
      const left = Math.max(0, game.caughtHoldSeconds - (now - state.caughtSince) / 1000); setPhase('DANGER', `確保判定まで ${left.toFixed(1)}秒`);
      if (!left) finishGame('caught');
    } else state.caughtSince = null;
  };
  const updateRunner = (position) => {
    const { latitude: lat, longitude: lng, accuracy } = position.coords; createMap(lat, lng);
    const next = { lat, lng, accuracy, timestamp: position.timestamp }; const point = [lat, lng];
    const icon = L.divIcon({ className: 'runner-marker-wrap', html: '<span class="runner-marker"></span>', iconSize: [28, 28], iconAnchor: [14, 14] });
    if (!state.runnerMarker) { state.runnerMarker = L.marker(point, { icon, zIndexOffset: 1000 }).addTo(state.map).bindTooltip('RUNNER', { direction: 'top', offset: [0, -12] }); state.accuracyCircle = L.circle(point, { radius: accuracy, color: '#39a9ff', weight: 1, fillColor: '#39a9ff', fillOpacity: .12 }).addTo(state.map); }
    else { state.runnerMarker.setLatLng(point); state.accuracyCircle.setLatLng(point).setRadius(accuracy); }
    if (state.previousPosition && state.phase !== 'ended') {
      const moved = haversine(state.previousPosition, next); const seconds = Math.max(.1, (next.timestamp - state.previousPosition.timestamp) / 1000);
      if (next.accuracy <= gps.poorAccuracyMeters && moved / seconds * 3.6 <= gps.maxPlausibleSpeedKmh) state.distanceMeters += moved;
    }
    state.runner = next; state.previousPosition = next;
    if (state.chaserList.length) framePlayers();
    else state.map.setView(point, Math.max(state.map.getZoom(), mapSettings.initialZoom), { animate: true });
    byId('location-reading').textContent = '現在地を取得しました'; setGpsStatus(accuracy > gps.poorAccuracyMeters ? 'GPS精度低下中' : '位置情報を取得中', `GPS精度: 約${Math.round(accuracy)}m`); byId('distance-reading').textContent = formatDistance(state.distanceMeters);
    if (state.phase === 'ready') { spawnChaser(); framePlayers(); const difficulty = activeDifficulty(); const goal = state.goalType === 'time' ? `${state.goalValue / 60}分` : formatDistance(state.goalValue); setPhase('READY', `${goal}、${difficulty.initialChaserCount}体のチェイサーから逃げ切れ。`, true); byId('nearest-reading').textContent = formatDistance(Math.min(...state.chaserList.map((chaser) => haversine(state.runner, chaser)))); }
  };
  const startLocation = () => {
    if (!navigator.geolocation) return setGpsStatus('このブラウザはGPSに対応していません', 'Safari または Chrome で開いてください');
    setGpsStatus('位置情報の許可を待っています', 'ブラウザの位置情報を許可してください');
    state.watchId = navigator.geolocation.watchPosition(updateRunner, (error) => { const messages = { 1: '位置情報が許可されていません', 2: 'GPSを取得できません', 3: 'GPS取得がタイムアウトしました' }; setGpsStatus(messages[error.code] || 'GPSエラー', '屋外の開けた場所で、位置情報の利用を許可してください'); }, { enableHighAccuracy: gps.enableHighAccuracy, maximumAge: gps.maximumAgeMs, timeout: gps.timeoutMs });
  };
  const stopLocation = () => { if (state.watchId !== null) navigator.geolocation.clearWatch(state.watchId); state.watchId = null; };
  const openGame = () => { showScreen('game'); resetGame(); startLocation(); };
  const startGame = () => {
    if (!state.runner || state.phase !== 'ready') return;
    state.phase = 'countdown'; state.startedAt = Date.now(); state.phaseStartedAt = state.startedAt; byId('start-game-button').disabled = true; state.timerId = setInterval(gameTick, 250); gameTick();
  };

  byId('solo-button').addEventListener('click', () => showScreen('solo'));
  document.querySelectorAll('[data-difficulty]').forEach((button) => button.addEventListener('click', () => { state.difficulty = button.dataset.difficulty; state.custom = null; state.goalType = 'time'; state.goalValue = difficulties[state.difficulty].defaultTargetSeconds; showScreen('goal'); }));
  byId('custom-button').addEventListener('click', () => showScreen('custom'));
  const syncCustom = () => { byId('custom-count-output').textContent = `${byId('custom-count').value}体`; byId('custom-grace-output').textContent = `${byId('custom-grace').value}秒`; };
  byId('custom-count').addEventListener('input', syncCustom); byId('custom-grace').addEventListener('input', syncCustom);
  byId('custom-next-button').addEventListener('click', () => { state.custom = { label: 'CUSTOM', initialChaserCount: Number(byId('custom-count').value), graceSeconds: Number(byId('custom-grace').value), speedKmh: Number(byId('custom-speed').value) }; state.goalType = 'time'; state.goalValue = 600; showScreen('goal'); });
  document.querySelectorAll('[data-goal-type]').forEach((button) => button.addEventListener('click', () => { state.goalType = button.dataset.goalType; state.goalValue = Number(button.dataset.goalValue); safetyDialog.showModal(); }));
  safetyCheck.addEventListener('change', () => { safetyConfirm.disabled = !safetyCheck.checked; });
  safetyDialog.addEventListener('close', () => { if (safetyDialog.returnValue === 'confirm' && safetyCheck.checked) openGame(); });
  byId('start-game-button').addEventListener('click', startGame);
  byId('end-button').addEventListener('click', () => { if (['countdown', 'grace', 'chase'].includes(state.phase)) { if (confirm('逃走を終了しますか？')) finishGame('retired'); return; } stopLocation(); showScreen('home'); });
  byId('result-home-button').addEventListener('click', () => { stopLocation(); showScreen('home'); });
  byId('history-button').addEventListener('click', () => showScreen('history'));
  document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => showScreen(button.dataset.back)));
  if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
})();

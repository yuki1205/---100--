(() => {
  const { gps, map: mapSettings } = window.RUNAWAY_SETTINGS;
  const app = document.querySelector('#app');
  const safetyDialog = document.querySelector('#safety-dialog');
  const safetyCheck = document.querySelector('#safety-check');
  const safetyConfirm = document.querySelector('#safety-confirm');
  const state = { screen: 'home', map: null, runnerMarker: null, accuracyCircle: null, watchId: null };

  const showScreen = (name) => {
    document.querySelectorAll('[data-screen]').forEach((screen) => screen.classList.toggle('is-hidden', screen.dataset.screen !== name));
    state.screen = name;
    if (name === 'game' && state.map) setTimeout(() => state.map.invalidateSize(), 0);
  };

  const formatDistance = (meters) => meters < 1_000 ? `${Math.round(meters)} m` : `${(meters / 1_000).toFixed(2)} km`;

  const setGpsStatus = (status, detail = '') => {
    document.querySelector('#gps-status').textContent = status;
    document.querySelector('#accuracy-reading').textContent = detail;
  };

  const createMap = (lat, lng) => {
    if (state.map) return;
    state.map = L.map('map', { zoomControl: false, attributionControl: true }).setView([lat, lng], mapSettings.initialZoom);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: mapSettings.maxZoom,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(state.map);
    L.control.zoom({ position: 'bottomright' }).addTo(state.map);
  };

  const updateRunner = (position) => {
    const { latitude: lat, longitude: lng, accuracy } = position.coords;
    createMap(lat, lng);
    const point = [lat, lng];
    const runnerIcon = L.divIcon({ className: 'runner-marker-wrap', html: '<span class="runner-marker"></span>', iconSize: [28, 28], iconAnchor: [14, 14] });
    if (!state.runnerMarker) {
      state.runnerMarker = L.marker(point, { icon: runnerIcon, zIndexOffset: 1000 }).addTo(state.map).bindTooltip('RUNNER', { direction: 'top', offset: [0, -12] });
      state.accuracyCircle = L.circle(point, { radius: accuracy, color: '#39a9ff', weight: 1, fillColor: '#39a9ff', fillOpacity: 0.12 }).addTo(state.map);
    } else {
      state.runnerMarker.setLatLng(point);
      state.accuracyCircle.setLatLng(point).setRadius(accuracy);
    }
    state.map.setView(point, Math.max(state.map.getZoom(), mapSettings.initialZoom), { animate: true });
    document.querySelector('#location-reading').textContent = `現在地を取得しました`;
    const accuracyText = `GPS精度: 約${Math.round(accuracy)}m`;
    setGpsStatus(accuracy > gps.poorAccuracyMeters ? 'GPS精度低下中' : '位置情報を取得中', accuracyText);
  };

  const startLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('このブラウザはGPSに対応していません', 'Safari または Chrome で開いてください');
      return;
    }
    setGpsStatus('位置情報の許可を待っています', 'ブラウザの位置情報を許可してください');
    state.watchId = navigator.geolocation.watchPosition(
      updateRunner,
      (error) => {
        const messages = { 1: '位置情報が許可されていません', 2: 'GPSを取得できません', 3: 'GPS取得がタイムアウトしました' };
        setGpsStatus(messages[error.code] || 'GPSエラー', '屋外の開けた場所で、位置情報の利用を許可してください');
      },
      { enableHighAccuracy: gps.enableHighAccuracy, maximumAge: gps.maximumAgeMs, timeout: gps.timeoutMs },
    );
  };

  const stopLocation = () => {
    if (state.watchId !== null) navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  };

  const openGame = () => {
    showScreen('game');
    startLocation();
  };

  document.querySelector('#solo-button').addEventListener('click', () => {
    if (localStorage.getItem('runaway-safety-confirmed') === 'true') openGame();
    else safetyDialog.showModal();
  });
  safetyCheck.addEventListener('change', () => { safetyConfirm.disabled = !safetyCheck.checked; });
  safetyDialog.addEventListener('close', () => {
    if (safetyDialog.returnValue === 'confirm' && safetyCheck.checked) {
      localStorage.setItem('runaway-safety-confirmed', 'true');
      openGame();
    }
  });
  document.querySelector('#end-button').addEventListener('click', () => { stopLocation(); showScreen('home'); });
  document.querySelector('#history-button').addEventListener('click', () => showScreen('history'));
  document.querySelectorAll('[data-back]').forEach((button) => button.addEventListener('click', () => showScreen(button.dataset.back)));

  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
  app.dataset.ready = 'true';
})();

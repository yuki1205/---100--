// Gameplay values live here so field-test tuning does not touch game logic.
window.RUNAWAY_SETTINGS = {
  map: { initialZoom: 17, minZoom: 14, maxZoom: 19 },
  gps: {
    maximumAgeMs: 2_000,
    timeoutMs: 15_000,
    enableHighAccuracy: true,
    poorAccuracyMeters: 50,
    maxPlausibleSpeedKmh: 35,
  },
  distances: {
    catchMeters: 20,
    spottedMeters: 50,
    warningMeters: 150,
    detectMeters: 300,
    initialSpawnMinMeters: 500,
    initialSpawnMaxMeters: 800,
  },
  chasers: { maxCount: 5, boostMultiplier: 2, boostDurationSeconds: 10, boostCooldownSeconds: 20 },
};

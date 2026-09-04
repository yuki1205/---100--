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
  game: {
    prototypeTargetSeconds: 10 * 60,
    normalGraceSeconds: 60,
    countdownSeconds: 3,
    caughtHoldSeconds: 3,
  },
  distances: {
    catchMeters: 20,
    spottedMeters: 50,
    warningMeters: 150,
    detectMeters: 300,
    initialSpawnMinMeters: 500,
    initialSpawnMaxMeters: 800,
  },
  chasers: {
    maxCount: 5,
    normalSpeedKmh: 10,
    maxSpeedKmh: 25,
    boostMultiplier: 2,
    boostDurationSeconds: 10,
    boostCooldownSeconds: 20,
  },
};

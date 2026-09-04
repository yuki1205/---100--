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
  difficulties: {
    easy: { label: 'EASY', initialChaserCount: 1, graceSeconds: 90, speedKmh: 8 },
    normal: { label: 'NORMAL', initialChaserCount: 2, graceSeconds: 60, speedKmh: 10, recommended: true },
    hard: { label: 'HARD', initialChaserCount: 3, graceSeconds: 30, speedKmh: 12 },
  },
  goals: {
    timeSeconds: [5 * 60, 10 * 60, 20 * 60, 30 * 60, 60 * 60],
    distanceMeters: [1000, 3000, 5000, 10000],
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

/**
 * AgriSync - Unified Siren & Hardware Deterrent Service
 * Features:
 *  - Automatic siren trigger upon animal intrusion detection
 *  - Configurable cooldown / debounce mechanism (SIREN_COOLDOWN_SECONDS) to prevent siren spam
 *  - Physical ESP32 HTTP trigger adapter with automatic software simulator fallback
 *  - Full database audit trail (siren_events)
 *  - Real-time Socket.IO status broadcast
 */

const http = require('http');
const localStore = require('../database/localStore');
const supabase = require('./supabaseClient');

let lastSirenTriggerTime = 0;
let activeSirenTimeout = null;
let currentSirenState = {
  active: false,
  animal: null,
  triggeredAt: null,
  expiresAt: null,
  cooldownUntil: null,
  mode: 'hardware_adapter',
};

const getCooldownSeconds = () => {
  const envVal = parseInt(process.env.SIREN_COOLDOWN_SECONDS, 10);
  return !isNaN(envVal) && envVal > 0 ? envVal : 30;
};

const getDefaultDurationMs = () => {
  const envVal = parseInt(process.env.SIREN_DURATION_MS, 10);
  return !isNaN(envVal) && envVal > 0 ? envVal : 5000;
};

/**
 * Trigger siren for a detected animal intrusion
 */
const triggerSiren = async ({
  detectionEventId = null,
  deviceId = 'ESP32-NODE-01',
  animal = 'wild_boar',
  confidence = 90,
  durationMs = null,
  io = null,
  force = false,
}) => {
  const now = Date.now();
  const cooldownSec = getCooldownSeconds();
  const cooldownMs = cooldownSec * 1000;
  const activeDuration = durationMs || getDefaultDurationMs();

  // 1. Cooldown & Debounce Check
  const timeSinceLast = now - lastSirenTriggerTime;
  if (!force && lastSirenTriggerTime > 0 && timeSinceLast < cooldownMs) {
    const remainingSec = Math.ceil((cooldownMs - timeSinceLast) / 1000);
    console.log(`[SIREN] Cooldown active (${remainingSec}s remaining). Skipping duplicate siren trigger for ${animal}.`);
    
    // Save cooldown skipped event
    saveSirenEvent({
      detectionEventId,
      deviceId,
      animal,
      status: 'cooldown_skipped',
      message: `Skipped due to active cooldown (${remainingSec}s remaining)`,
      triggeredAt: new Date(now).toISOString(),
    });

    return {
      triggered: false,
      reason: 'cooldown_active',
      remainingCooldownSeconds: remainingSec,
    };
  }

  // 2. Set new trigger time & activate siren
  lastSirenTriggerTime = now;
  currentSirenState = {
    active: true,
    animal,
    confidence,
    triggeredAt: new Date(now).toISOString(),
    expiresAt: new Date(now + activeDuration).toISOString(),
    cooldownUntil: new Date(now + cooldownMs).toISOString(),
    mode: process.env.ESP32_IP ? 'esp32_hardware' : 'software_simulator',
  };

  console.log(`[SIREN] Triggering automated deterrent siren for detected animal: ${animal} (${confidence}%) | Duration: ${activeDuration}ms`);

  // Clear existing timeout if any
  if (activeSirenTimeout) {
    clearTimeout(activeSirenTimeout);
  }

  activeSirenTimeout = setTimeout(() => {
    currentSirenState.active = false;
    if (io) {
      io.emit('siren-status', { ...currentSirenState, active: false });
    }
    console.log(`[SIREN] Siren cycle finished for ${animal}`);
  }, activeDuration);

  // 3. Send physical trigger to ESP32 device if IP configured
  const esp32Ip = process.env.ESP32_IP || '192.168.1.150';
  let hardwareResult = 'simulator_simulated';

  try {
    hardwareResult = await dispatchToEsp32(esp32Ip, animal, activeDuration);
  } catch (err) {
    console.log(`[SIREN] Physical ESP32 (${esp32Ip}) offline/unreachable. Deterrent processed via software simulator.`);
    hardwareResult = 'simulator_fallback';
  }

  // 4. Save siren event to database
  const sirenRecord = await saveSirenEvent({
    detectionEventId,
    deviceId,
    animal,
    durationMs: activeDuration,
    status: 'success',
    hardwareResult,
    triggeredAt: new Date(now).toISOString(),
    completedAt: new Date(now + activeDuration).toISOString(),
  });

  // 5. Broadcast real-time event via Socket.IO
  if (io) {
    io.emit('siren-triggered', {
      success: true,
      animal,
      confidence,
      durationMs: activeDuration,
      sirenEvent: sirenRecord,
      state: currentSirenState,
    });
  }

  return {
    triggered: true,
    sirenEvent: sirenRecord,
    hardwareResult,
    cooldownSeconds: cooldownSec,
  };
};

/**
 * Dispatch HTTP trigger to physical ESP32
 */
const dispatchToEsp32 = (ip, animal, duration) => {
  return new Promise((resolve, reject) => {
    const url = `http://${ip}/trigger?animal=${encodeURIComponent(animal)}&duration=${duration}`;
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(`esp32_ack: ${data || res.statusCode}`));
    });

    req.setTimeout(1500, () => {
      req.destroy();
      reject(new Error('ESP32 connection timeout'));
    });

    req.on('error', (err) => reject(err));
  });
};

/**
 * Save Siren Event in Supabase or LocalStore
 */
const saveSirenEvent = async (eventData) => {
  try {
    const payload = {
      detection_event_id: eventData.detectionEventId,
      device_id: eventData.deviceId || 'ESP32-DETERRENT-01',
      animal: eventData.animal,
      status: eventData.status,
      hardware_result: eventData.hardwareResult || 'success',
      duration_ms: eventData.durationMs || 5000,
      triggered_at: eventData.triggeredAt || new Date().toISOString(),
      completed_at: eventData.completedAt || null,
    };

    const { data, error } = await supabase.from('siren_events').insert([payload]).select();
    if (error || !data) {
      return localStore.insert('siren_events', payload);
    }
    return data[0];
  } catch (e) {
    return localStore.insert('siren_events', eventData);
  }
};

const getSirenState = () => {
  const now = Date.now();
  const cooldownSec = getCooldownSeconds();
  const cooldownMs = cooldownSec * 1000;
  const timeSinceLast = now - lastSirenTriggerTime;
  const inCooldown = lastSirenTriggerTime > 0 && timeSinceLast < cooldownMs;

  return {
    ...currentSirenState,
    inCooldown,
    cooldownRemainingSec: inCooldown ? Math.ceil((cooldownMs - timeSinceLast) / 1000) : 0,
    cooldownConfiguredSec: cooldownSec,
  };
};

module.exports = {
  triggerSiren,
  getSirenState,
  saveSirenEvent,
  getCooldownSeconds,
};

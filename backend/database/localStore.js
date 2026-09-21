const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('crypto');

const STORE_PATH = path.join(__dirname, 'agrisync_store.json');

const defaultData = {
  users: [
    {
      id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      name: 'Rajesh Patil',
      email: 'operator@intrusion.com',
      created_at: new Date().toISOString(),
    },
  ],
  farms: [
    {
      id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      user_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      name: 'AgriSync Main Farm (Niphad)',
      location: 'North Sector Field, Niphad Taluka',
      created_at: new Date().toISOString(),
    },
  ],
  cameras: [
    {
      id: 'cam_01',
      farm_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      name: 'North Perimeter Cam',
      zone: 'North Field - Onion Plot',
      status: true,
      lastSeenAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'cam_02',
      farm_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      name: 'East Boundary Cam',
      zone: 'East Boundary - Sugarcane',
      status: true,
      lastSeenAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
    {
      id: 'cam_03',
      farm_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      name: 'South Canal Node',
      zone: 'South Canal Perimeter',
      status: true,
      lastSeenAt: new Date().toISOString(),
      created_at: new Date().toISOString(),
    },
  ],
  field_captures: [],
  detections: [
    {
      id: 'det-001',
      camera_id: 'cam_01',
      field_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      animal: 'wild_boar',
      confidence: 91,
      image_url: '/uploads/detections/sample_wild_boar.jpg',
      processed_image_url: '/uploads/detections/sample_wild_boar.jpg',
      detected_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'det-002',
      camera_id: 'cam_02',
      field_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      animal: 'cow',
      confidence: 88,
      image_url: '/uploads/detections/sample_cow.jpg',
      processed_image_url: '/uploads/detections/sample_cow.jpg',
      detected_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
  ],
  siren_events: [],
  produce_lots: [
    {
      id: 'LOT-2024-098',
      user_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      farm_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      crop_type: 'Red Onion (Garwa)',
      quantity_kg: 24000,
      grade: 'A',
      moisture: '11.2%',
      harvest_date: '2026-09-12',
      status: 'Ready for Sale',
      created_at: new Date().toISOString(),
    },
    {
      id: 'LOT-2024-099',
      user_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      farm_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      crop_type: 'Soybean (JS-335)',
      quantity_kg: 12500,
      grade: 'B',
      moisture: '9.8%',
      harvest_date: '2026-09-08',
      status: 'In Storage',
      created_at: new Date().toISOString(),
    },
    {
      id: 'LOT-2024-102',
      user_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      farm_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      crop_type: 'Tomato (Hybrid)',
      quantity_kg: 5000,
      grade: 'A',
      moisture: '88.0%',
      harvest_date: '2026-09-18',
      status: 'Ready for Sale',
      created_at: new Date().toISOString(),
    },
  ],
  crop_loss_incidents: [
    {
      id: 'inc-001',
      farm_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      detection_id: 'det-001',
      crop_type: 'Wheat',
      affected_area_estimate: '0.4 acres',
      notes: 'Wheat damage along north boundary fence.',
      reported_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      confirmed_by_farmer: true,
    },
    {
      id: 'inc-002',
      farm_id: '29b9b72f-0d43-4a23-9b04-dc9e14180f2a',
      detection_id: 'det-002',
      crop_type: 'Corn',
      affected_area_estimate: '15%',
      notes: 'Wild boar entry near east barn corner.',
      reported_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      confirmed_by_farmer: true,
    },
  ],
};

function loadStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      saveStore(defaultData);
      return defaultData;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    // Ensure all default collections exist
    for (const key of Object.keys(defaultData)) {
      if (!parsed[key]) {
        parsed[key] = defaultData[key];
      }
    }
    return parsed;
  } catch (err) {
    console.warn(`[localStore notice] Could not parse local store (${err.message}). Resetting to default data.`);
    saveStore(defaultData);
    return defaultData;
  }
}

function saveStore(data) {
  try {
    const dir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`[localStore error] Failed to write local store: ${err.message}`);
  }
}

function generateUuid() {
  if (typeof uuidv4 === 'function') {
    try {
      return uuidv4();
    } catch {}
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const localStore = {
  getCollection(table) {
    const store = loadStore();
    return store[table] || [];
  },

  insert(table, row) {
    const store = loadStore();
    if (!store[table]) store[table] = [];
    const newRow = {
      id: row.id || generateUuid(),
      createdAt: row.createdAt || new Date().toISOString(),
      ...row,
    };
    store[table].unshift(newRow);
    saveStore(store);
    return newRow;
  },

  find(table, filterFn) {
    const items = this.getCollection(table);
    return filterFn ? items.filter(filterFn) : items;
  },

  findById(table, id) {
    const items = this.getCollection(table);
    return items.find((item) => item.id === id) || null;
  },

  update(table, id, updates) {
    const store = loadStore();
    if (!store[table]) return null;
    const index = store[table].findIndex((item) => item.id === id);
    if (index === -1) return null;
    store[table][index] = {
      ...store[table][index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveStore(store);
    return store[table][index];
  },

  upsert(table, row) {
    const store = loadStore();
    if (!store[table]) store[table] = [];
    const index = store[table].findIndex((item) => item.id === row.id);
    if (index !== -1) {
      store[table][index] = {
        ...store[table][index],
        ...row,
        updatedAt: new Date().toISOString(),
      };
      saveStore(store);
      return store[table][index];
    } else {
      const newRow = {
        id: row.id || generateUuid(),
        createdAt: row.createdAt || new Date().toISOString(),
        ...row,
      };
      store[table].unshift(newRow);
      saveStore(store);
      return newRow;
    }
  },

  delete(table, id) {
    const store = loadStore();
    if (!store[table]) return false;
    const initialLen = store[table].length;
    store[table] = store[table].filter((item) => item.id !== id);
    if (store[table].length !== initialLen) {
      saveStore(store);
      return true;
    }
    return false;
  },
};

module.exports = localStore;

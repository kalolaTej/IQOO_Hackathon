/**
 * AgriSync - Centralized Market, Buyer, and Logistics Mock Data
 * Tagged strictly as source: 'mock' for transparency and demo reliability.
 */

const getPastDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const MOCK_MANDI_PRICES = [
  // --- TOMATO (Across 14 Mandis & 12 States) ---
  { crop_type: 'Tomato', market_name: 'Somala APMC', state: 'Andhra Pradesh', min_price: 1200, max_price: 1450, modal_price: 1350, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Madanapalle APMC', state: 'Andhra Pradesh', min_price: 1250, max_price: 1500, modal_price: 1420, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Kolar APMC', state: 'Karnataka', min_price: 1400, max_price: 1700, modal_price: 1580, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Bangalore (Hoskote) APMC', state: 'Karnataka', min_price: 1450, max_price: 1750, modal_price: 1620, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Pimpalgaon APMC', state: 'Maharashtra', min_price: 1650, max_price: 2000, modal_price: 1850, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Nashik APMC', state: 'Maharashtra', min_price: 1700, max_price: 2050, modal_price: 1900, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Pune (Gultekdi) APMC', state: 'Maharashtra', min_price: 1900, max_price: 2300, modal_price: 2100, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Ganaur APMC', state: 'Haryana', min_price: 2500, max_price: 3000, modal_price: 2800, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Azadpur Mandi', state: 'Delhi', min_price: 2650, max_price: 3200, modal_price: 2950, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Agra APMC', state: 'Uttar Pradesh', min_price: 2150, max_price: 2600, modal_price: 2400, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Jaipur (Muhana) APMC', state: 'Rajasthan', min_price: 2350, max_price: 2850, modal_price: 2650, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Ahmedabad APMC', state: 'Gujarat', min_price: 1950, max_price: 2400, modal_price: 2200, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Gondal APMC', state: 'Gujarat', min_price: 1900, max_price: 2350, modal_price: 2150, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Indore APMC', state: 'Madhya Pradesh', min_price: 2050, max_price: 2500, modal_price: 2300, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Kolkata (Koley) APMC', state: 'West Bengal', min_price: 2800, max_price: 3350, modal_price: 3100, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Koyambedu APMC', state: 'Tamil Nadu', min_price: 1550, max_price: 1900, modal_price: 1750, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Tomato', market_name: 'Bowenpally APMC', state: 'Telangana', min_price: 1450, max_price: 1800, modal_price: 1650, price_date: getPastDate(0), source: 'mock' },

  // --- WHEAT (Across 13 Mandis & 8 States) ---
  { crop_type: 'Wheat', market_name: 'Indore APMC', state: 'Madhya Pradesh', min_price: 2450, max_price: 2650, modal_price: 2550, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Wheat', market_name: 'Ujjain APMC', state: 'Madhya Pradesh', min_price: 2480, max_price: 2680, modal_price: 2580, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Wheat', market_name: 'Kota APMC', state: 'Rajasthan', min_price: 2500, max_price: 2720, modal_price: 2620, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Wheat', market_name: 'Khanna APMC', state: 'Punjab', min_price: 2380, max_price: 2560, modal_price: 2480, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Wheat', market_name: 'Ludhiana APMC', state: 'Punjab', min_price: 2400, max_price: 2580, modal_price: 2490, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Wheat', market_name: 'Karnal APMC', state: 'Haryana', min_price: 2420, max_price: 2600, modal_price: 2510, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Wheat', market_name: 'Sirsa APMC', state: 'Haryana', min_price: 2430, max_price: 2620, modal_price: 2530, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Wheat', market_name: 'Agra APMC', state: 'Uttar Pradesh', min_price: 2350, max_price: 2540, modal_price: 2450, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Wheat', market_name: 'Kanpur APMC', state: 'Uttar Pradesh', min_price: 2380, max_price: 2560, modal_price: 2470, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Wheat', market_name: 'Rajkot APMC', state: 'Gujarat', min_price: 2580, max_price: 2780, modal_price: 2680, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Wheat', market_name: 'Gondal APMC', state: 'Gujarat', min_price: 2600, max_price: 2800, modal_price: 2700, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Wheat', market_name: 'Pune APMC', state: 'Maharashtra', min_price: 2720, max_price: 2950, modal_price: 2850, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Wheat', market_name: 'Gulabbagh APMC', state: 'Bihar', min_price: 2320, max_price: 2520, modal_price: 2420, price_date: getPastDate(0), source: 'mock' },

  // --- ONION (Across 13 Mandis & 8 States) ---
  { crop_type: 'Onion', market_name: 'Lasalgaon APMC', state: 'Maharashtra', min_price: 1800, max_price: 2200, modal_price: 2000, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Onion', market_name: 'Pimpalgaon APMC', state: 'Maharashtra', min_price: 1850, max_price: 2250, modal_price: 2050, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Onion', market_name: 'Pune APMC', state: 'Maharashtra', min_price: 1950, max_price: 2350, modal_price: 2150, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Onion', market_name: 'Solapur APMC', state: 'Maharashtra', min_price: 1750, max_price: 2150, modal_price: 1950, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Onion', market_name: 'Mahuva APMC', state: 'Gujarat', min_price: 1650, max_price: 2050, modal_price: 1850, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Onion', market_name: 'Gondal APMC', state: 'Gujarat', min_price: 1700, max_price: 2100, modal_price: 1900, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Onion', market_name: 'Neemuch APMC', state: 'Madhya Pradesh', min_price: 1780, max_price: 2180, modal_price: 1980, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Onion', market_name: 'Indore APMC', state: 'Madhya Pradesh', min_price: 1820, max_price: 2220, modal_price: 2020, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Onion', market_name: 'Alwar APMC', state: 'Rajasthan', min_price: 1900, max_price: 2300, modal_price: 2100, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Onion', market_name: 'Azadpur Mandi', state: 'Delhi', min_price: 2250, max_price: 2700, modal_price: 2500, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Onion', market_name: 'Hubli APMC', state: 'Karnataka', min_price: 1980, max_price: 2380, modal_price: 2200, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Onion', market_name: 'Kurnool APMC', state: 'Andhra Pradesh', min_price: 1700, max_price: 2100, modal_price: 1900, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Onion', market_name: 'Ottanchathiram APMC', state: 'Tamil Nadu', min_price: 2100, max_price: 2500, modal_price: 2300, price_date: getPastDate(0), source: 'mock' },

  // --- POTATO (Across 10 Mandis & 7 States) ---
  { crop_type: 'Potato', market_name: 'Agra APMC', state: 'Uttar Pradesh', min_price: 1500, max_price: 1800, modal_price: 1650, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Potato', market_name: 'Farrukhabad APMC', state: 'Uttar Pradesh', min_price: 1420, max_price: 1720, modal_price: 1580, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Potato', market_name: 'Aligarh APMC', state: 'Uttar Pradesh', min_price: 1480, max_price: 1760, modal_price: 1620, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Potato', market_name: 'Jalandhar APMC', state: 'Punjab', min_price: 1550, max_price: 1850, modal_price: 1700, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Potato', market_name: 'Deesa APMC', state: 'Gujarat', min_price: 1600, max_price: 1900, modal_price: 1750, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Potato', market_name: 'Indore APMC', state: 'Madhya Pradesh', min_price: 1650, max_price: 1950, modal_price: 1800, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Potato', market_name: 'Burdwan APMC', state: 'West Bengal', min_price: 1700, max_price: 2000, modal_price: 1850, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Potato', market_name: 'Siliguri APMC', state: 'West Bengal', min_price: 1750, max_price: 2100, modal_price: 1920, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Potato', market_name: 'Pune APMC', state: 'Maharashtra', min_price: 1800, max_price: 2150, modal_price: 1950, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Potato', market_name: 'Azadpur Mandi', state: 'Delhi', min_price: 1880, max_price: 2220, modal_price: 2050, price_date: getPastDate(0), source: 'mock' },

  // --- RICE / PADDY (Across 10 Mandis & 7 States) ---
  { crop_type: 'Rice', market_name: 'Karnal APMC', state: 'Haryana', min_price: 3200, max_price: 3500, modal_price: 3350, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Rice', market_name: 'Kurukshetra APMC', state: 'Haryana', min_price: 3180, max_price: 3460, modal_price: 3320, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Rice', market_name: 'Amritsar APMC', state: 'Punjab', min_price: 3250, max_price: 3550, modal_price: 3400, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Rice', market_name: 'Patiala APMC', state: 'Punjab', min_price: 3220, max_price: 3520, modal_price: 3380, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Rice', market_name: 'Guntur APMC', state: 'Andhra Pradesh', min_price: 2700, max_price: 2980, modal_price: 2850, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Rice', market_name: 'Nellore APMC', state: 'Andhra Pradesh', min_price: 2780, max_price: 3050, modal_price: 2920, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Rice', market_name: 'Nizamabad APMC', state: 'Telangana', min_price: 2740, max_price: 3020, modal_price: 2880, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Rice', market_name: 'Burdwan APMC', state: 'West Bengal', min_price: 2800, max_price: 3100, modal_price: 2950, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Rice', market_name: 'Sambalpur APMC', state: 'Odisha', min_price: 2620, max_price: 2880, modal_price: 2750, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Rice', market_name: 'Raipur APMC', state: 'Chhattisgarh', min_price: 2680, max_price: 2920, modal_price: 2800, price_date: getPastDate(0), source: 'mock' },

  // --- SOYBEAN (Across 8 Mandis & 4 States) ---
  { crop_type: 'Soybean', market_name: 'Ujjain APMC', state: 'Madhya Pradesh', min_price: 4600, max_price: 5000, modal_price: 4800, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Soybean', market_name: 'Indore APMC', state: 'Madhya Pradesh', min_price: 4650, max_price: 5050, modal_price: 4850, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Soybean', market_name: 'Dewas APMC', state: 'Madhya Pradesh', min_price: 4580, max_price: 4980, modal_price: 4780, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Soybean', market_name: 'Latur APMC', state: 'Maharashtra', min_price: 4750, max_price: 5150, modal_price: 4950, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Soybean', market_name: 'Akola APMC', state: 'Maharashtra', min_price: 4700, max_price: 5100, modal_price: 4900, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Soybean', market_name: 'Nagpur APMC', state: 'Maharashtra', min_price: 4720, max_price: 5120, modal_price: 4920, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Soybean', market_name: 'Kota APMC', state: 'Rajasthan', min_price: 4620, max_price: 5020, modal_price: 4820, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Soybean', market_name: 'Rajkot APMC', state: 'Gujarat', min_price: 4680, max_price: 5080, modal_price: 4880, price_date: getPastDate(0), source: 'mock' },

  // --- COTTON (Across 8 Mandis & 6 States) ---
  { crop_type: 'Cotton', market_name: 'Rajkot APMC', state: 'Gujarat', min_price: 7100, max_price: 7650, modal_price: 7400, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Cotton', market_name: 'Gondal APMC', state: 'Gujarat', min_price: 7150, max_price: 7700, modal_price: 7450, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Cotton', market_name: 'Amravati APMC', state: 'Maharashtra', min_price: 7000, max_price: 7550, modal_price: 7300, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Cotton', market_name: 'Yavatmal APMC', state: 'Maharashtra', min_price: 6950, max_price: 7500, modal_price: 7250, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Cotton', market_name: 'Warangal APMC', state: 'Telangana', min_price: 7050, max_price: 7600, modal_price: 7350, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Cotton', market_name: 'Guntur APMC', state: 'Andhra Pradesh', min_price: 6900, max_price: 7450, modal_price: 7200, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Cotton', market_name: 'Sirsa APMC', state: 'Haryana', min_price: 6850, max_price: 7400, modal_price: 7150, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Cotton', market_name: 'Abohar APMC', state: 'Punjab', min_price: 6880, max_price: 7420, modal_price: 7180, price_date: getPastDate(0), source: 'mock' },

  // --- CABBAGE (Across 6 Mandis & 5 States) ---
  { crop_type: 'Cabbage', market_name: 'Pune APMC', state: 'Maharashtra', min_price: 1200, max_price: 1550, modal_price: 1400, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Cabbage', market_name: 'Nashik APMC', state: 'Maharashtra', min_price: 1150, max_price: 1500, modal_price: 1350, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Cabbage', market_name: 'Kolar APMC', state: 'Karnataka', min_price: 1300, max_price: 1650, modal_price: 1500, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Cabbage', market_name: 'Ganaur APMC', state: 'Haryana', min_price: 1450, max_price: 1800, modal_price: 1650, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Cabbage', market_name: 'Agra APMC', state: 'Uttar Pradesh', min_price: 1250, max_price: 1600, modal_price: 1450, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Cabbage', market_name: 'Ahmedabad APMC', state: 'Gujarat', min_price: 1180, max_price: 1520, modal_price: 1380, price_date: getPastDate(0), source: 'mock' },

  // --- BITTER GOURD (Across 6 Mandis & 5 States) ---
  { crop_type: 'Bitter gourd', market_name: 'Nashik APMC', state: 'Maharashtra', min_price: 2300, max_price: 2850, modal_price: 2600, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Bitter gourd', market_name: 'Surat APMC', state: 'Gujarat', min_price: 2450, max_price: 3000, modal_price: 2750, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Bitter gourd', market_name: 'Bangalore APMC', state: 'Karnataka', min_price: 2600, max_price: 3150, modal_price: 2900, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Bitter gourd', market_name: 'Azadpur Mandi', state: 'Delhi', min_price: 2850, max_price: 3450, modal_price: 3200, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Bitter gourd', market_name: 'Varanasi APMC', state: 'Uttar Pradesh', min_price: 2500, max_price: 3050, modal_price: 2800, price_date: getPastDate(0), source: 'mock' },

  // --- GRAPES (Across 8 Mandis & 5 States) ---
  { crop_type: 'Grapes', market_name: 'Nashik APMC', state: 'Maharashtra', min_price: 6800, max_price: 8500, modal_price: 7600, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Grapes', market_name: 'Pimpalgaon APMC', state: 'Maharashtra', min_price: 7000, max_price: 8800, modal_price: 7900, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Grapes', market_name: 'Sangli APMC', state: 'Maharashtra', min_price: 6500, max_price: 8200, modal_price: 7400, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Grapes', market_name: 'Pune APMC', state: 'Maharashtra', min_price: 7200, max_price: 9000, modal_price: 8100, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Grapes', market_name: 'Bangalore APMC', state: 'Karnataka', min_price: 7400, max_price: 9200, modal_price: 8300, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Grapes', market_name: 'Azadpur Mandi', state: 'Delhi', min_price: 8500, max_price: 10500, modal_price: 9500, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Grapes', market_name: 'Ahmedabad APMC', state: 'Gujarat', min_price: 7500, max_price: 9300, modal_price: 8400, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Grapes', market_name: 'Bowenpally APMC', state: 'Telangana', min_price: 7800, max_price: 9600, modal_price: 8700, price_date: getPastDate(0), source: 'mock' },

  // --- POMEGRANATE (Across 7 Mandis & 4 States) ---
  { crop_type: 'Pomegranate', market_name: 'Yeola APMC', state: 'Maharashtra', min_price: 7500, max_price: 9800, modal_price: 8600, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Pomegranate', market_name: 'Solapur APMC', state: 'Maharashtra', min_price: 7800, max_price: 10200, modal_price: 9000, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Pomegranate', market_name: 'Nashik APMC', state: 'Maharashtra', min_price: 7600, max_price: 9900, modal_price: 8750, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Pomegranate', market_name: 'Ahmednagar APMC', state: 'Maharashtra', min_price: 7400, max_price: 9600, modal_price: 8500, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Pomegranate', market_name: 'Gondal APMC', state: 'Gujarat', min_price: 8000, max_price: 10500, modal_price: 9200, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Pomegranate', market_name: 'Azadpur Mandi', state: 'Delhi', min_price: 9500, max_price: 12500, modal_price: 11000, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Pomegranate', market_name: 'Bangalore APMC', state: 'Karnataka', min_price: 8200, max_price: 10800, modal_price: 9500, price_date: getPastDate(0), source: 'mock' },

  // --- BAJRA (Across 5 Mandis & 4 States) ---
  { crop_type: 'Bajra(Pearl Millet/Cumbu)', market_name: 'Jaipur APMC', state: 'Rajasthan', min_price: 2200, max_price: 2480, modal_price: 2350, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Bajra(Pearl Millet/Cumbu)', market_name: 'Jodhpur APMC', state: 'Rajasthan', min_price: 2150, max_price: 2420, modal_price: 2300, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Bajra(Pearl Millet/Cumbu)', market_name: 'Agra APMC', state: 'Uttar Pradesh', min_price: 2120, max_price: 2400, modal_price: 2280, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Bajra(Pearl Millet/Cumbu)', market_name: 'Banaskantha APMC', state: 'Gujarat', min_price: 2250, max_price: 2520, modal_price: 2400, price_date: getPastDate(0), source: 'mock' },
  { crop_type: 'Bajra(Pearl Millet/Cumbu)', market_name: 'Hisar APMC', state: 'Haryana', min_price: 2180, max_price: 2450, modal_price: 2320, price_date: getPastDate(0), source: 'mock' },
];

/**
 * Multi-day historical trajectory for trend charts
 */
const MOCK_PRICE_TRENDS = {
  Tomato: [
    { price_date: getPastDate(14), modal_price: 1100, source: 'mock' },
    { price_date: getPastDate(12), modal_price: 1150, source: 'mock' },
    { price_date: getPastDate(10), modal_price: 1200, source: 'mock' },
    { price_date: getPastDate(8), modal_price: 1240, source: 'mock' },
    { price_date: getPastDate(6), modal_price: 1280, source: 'mock' },
    { price_date: getPastDate(4), modal_price: 1320, source: 'mock' },
    { price_date: getPastDate(2), modal_price: 1340, source: 'mock' },
    { price_date: getPastDate(0), modal_price: 1350, source: 'mock' },
  ],
  Wheat: [
    { price_date: getPastDate(14), modal_price: 2450, source: 'mock' },
    { price_date: getPastDate(10), modal_price: 2480, source: 'mock' },
    { price_date: getPastDate(7), modal_price: 2500, source: 'mock' },
    { price_date: getPastDate(4), modal_price: 2520, source: 'mock' },
    { price_date: getPastDate(2), modal_price: 2540, source: 'mock' },
    { price_date: getPastDate(0), modal_price: 2550, source: 'mock' },
  ],
  Onion: [
    { price_date: getPastDate(14), modal_price: 2400, source: 'mock' },
    { price_date: getPastDate(10), modal_price: 2300, source: 'mock' },
    { price_date: getPastDate(7), modal_price: 2200, source: 'mock' },
    { price_date: getPastDate(4), modal_price: 2100, source: 'mock' },
    { price_date: getPastDate(2), modal_price: 2050, source: 'mock' },
    { price_date: getPastDate(0), modal_price: 2000, source: 'mock' },
  ],
  Potato: [
    { price_date: getPastDate(14), modal_price: 1550, source: 'mock' },
    { price_date: getPastDate(10), modal_price: 1580, source: 'mock' },
    { price_date: getPastDate(7), modal_price: 1600, source: 'mock' },
    { price_date: getPastDate(4), modal_price: 1620, source: 'mock' },
    { price_date: getPastDate(0), modal_price: 1650, source: 'mock' },
  ],
  Rice: [
    { price_date: getPastDate(14), modal_price: 3250, source: 'mock' },
    { price_date: getPastDate(10), modal_price: 3280, source: 'mock' },
    { price_date: getPastDate(7), modal_price: 3300, source: 'mock' },
    { price_date: getPastDate(4), modal_price: 3320, source: 'mock' },
    { price_date: getPastDate(0), modal_price: 3350, source: 'mock' },
  ],
  Soybean: [
    { price_date: getPastDate(14), modal_price: 4600, source: 'mock' },
    { price_date: getPastDate(10), modal_price: 4680, source: 'mock' },
    { price_date: getPastDate(7), modal_price: 4720, source: 'mock' },
    { price_date: getPastDate(4), modal_price: 4760, source: 'mock' },
    { price_date: getPastDate(0), modal_price: 4800, source: 'mock' },
  ],
  Cotton: [
    { price_date: getPastDate(14), modal_price: 7200, source: 'mock' },
    { price_date: getPastDate(10), modal_price: 7280, source: 'mock' },
    { price_date: getPastDate(7), modal_price: 7320, source: 'mock' },
    { price_date: getPastDate(4), modal_price: 7360, source: 'mock' },
    { price_date: getPastDate(0), modal_price: 7400, source: 'mock' },
  ],
  Grapes: [
    { price_date: getPastDate(14), modal_price: 7100, source: 'mock' },
    { price_date: getPastDate(10), modal_price: 7300, source: 'mock' },
    { price_date: getPastDate(7), modal_price: 7450, source: 'mock' },
    { price_date: getPastDate(4), modal_price: 7600, source: 'mock' },
    { price_date: getPastDate(2), modal_price: 7750, source: 'mock' },
    { price_date: getPastDate(0), modal_price: 7900, source: 'mock' },
  ],
  Pomegranate: [
    { price_date: getPastDate(14), modal_price: 8100, source: 'mock' },
    { price_date: getPastDate(10), modal_price: 8300, source: 'mock' },
    { price_date: getPastDate(7), modal_price: 8450, source: 'mock' },
    { price_date: getPastDate(4), modal_price: 8600, source: 'mock' },
    { price_date: getPastDate(2), modal_price: 8750, source: 'mock' },
    { price_date: getPastDate(0), modal_price: 8900, source: 'mock' },
  ],
};

const MOCK_LOGISTICS_FACILITIES = [
  {
    id: 'f1010101-0000-0000-0000-000000000001',
    facility_name: 'Mahafresh Cold Chain Hub',
    type: 'cold_storage',
    location: 'Nashik APMC Corridor',
    state: 'Maharashtra',
    capacity_kg: 50000,
    cost_per_day: 350.00,
    contact_phone: '+91-9823011223',
    perishable_compatible: true,
    rating: 4.8
  },
  {
    id: 'f1010101-0000-0000-0000-000000000002',
    facility_name: 'Kisan Agri Mega Warehouse',
    type: 'warehouse',
    location: 'Sanwer Road, Indore',
    state: 'Madhya Pradesh',
    capacity_kg: 200000,
    cost_per_day: 180.00,
    contact_phone: '+91-9876543210',
    perishable_compatible: false,
    rating: 4.6
  },
  {
    id: 'f1010101-0000-0000-0000-000000000003',
    facility_name: 'Godavari Cold Storage Depot',
    type: 'cold_storage',
    location: 'Rajahmundry Bypass',
    state: 'Andhra Pradesh',
    capacity_kg: 35000,
    cost_per_day: 290.00,
    contact_phone: '+91-9440123456',
    perishable_compatible: true,
    rating: 4.7
  },
  {
    id: 'f1010101-0000-0000-0000-000000000004',
    facility_name: 'Gujarat Agri Logistic Park',
    type: 'warehouse',
    location: 'Sachin GIDC, Surat',
    state: 'Gujarat',
    capacity_kg: 120000,
    cost_per_day: 210.00,
    contact_phone: '+91-9825098765',
    perishable_compatible: false,
    rating: 4.5
  },
  {
    id: 'f1010101-0000-0000-0000-000000000005',
    facility_name: 'Punjab Silo Storage Terminal',
    type: 'warehouse',
    location: 'GT Road, Ludhiana',
    state: 'Punjab',
    capacity_kg: 300000,
    cost_per_day: 150.00,
    contact_phone: '+91-9814054321',
    perishable_compatible: false,
    rating: 4.9
  },
  {
    id: 'f1010101-0000-0000-0000-000000000006',
    facility_name: 'Bangalore Rural Cold Hub',
    type: 'cold_storage',
    location: 'Hoskote Industrial Area',
    state: 'Karnataka',
    capacity_kg: 40000,
    cost_per_day: 320.00,
    contact_phone: '+91-9845012398',
    perishable_compatible: true,
    rating: 4.7
  },
  {
    id: 'f1010101-0000-0000-0000-000000000007',
    facility_name: 'TransKisan Fleet Logistics',
    type: 'transport_provider',
    location: 'Azadpur Mandi Hub, Delhi',
    state: 'Delhi',
    capacity_kg: 15000,
    cost_per_day: 1200.00,
    contact_phone: '+91-9911223344',
    perishable_compatible: true,
    rating: 4.6
  }
];

const MOCK_BUYER_PROFILES = [
  {
    id: 'b1010101-0000-0000-0000-000000000001',
    buyer_name: 'Reliance Retail Fresh Sourcing',
    company_name: 'Reliance Retail Ltd',
    crop_type: 'Tomato',
    min_quantity_kg: 1000,
    preferred_grade: 'A',
    location: 'Nashik',
    state: 'Maharashtra',
    contact_phone: '+91-9822019988'
  },
  {
    id: 'b1010101-0000-0000-0000-000000000002',
    buyer_name: 'BigBasket Direct Farm Sourcing',
    company_name: 'Supermarket Grocery Supplies',
    crop_type: 'Tomato',
    min_quantity_kg: 500,
    preferred_grade: 'any',
    location: 'Kollam',
    state: 'Keralam',
    contact_phone: '+91-9844098877'
  },
  {
    id: 'b1010101-0000-0000-0000-000000000003',
    buyer_name: 'AgroCorp Grain Exporters',
    company_name: 'AgroCorp International',
    crop_type: 'Wheat',
    min_quantity_kg: 5000,
    preferred_grade: 'A',
    location: 'Indore',
    state: 'Madhya Pradesh',
    contact_phone: '+91-9877023311'
  },
  {
    id: 'b1010101-0000-0000-0000-000000000004',
    buyer_name: 'Kisan Mitra FPO Federation',
    company_name: 'Kisan Mitra Producer Co.',
    crop_type: 'Onion',
    min_quantity_kg: 2000,
    preferred_grade: 'B',
    location: 'Lasalgaon',
    state: 'Maharashtra',
    contact_phone: '+91-9823045566'
  },
  {
    id: 'b1010101-0000-0000-0000-000000000005',
    buyer_name: 'ITC Agri-Business Division',
    company_name: 'ITC Limited',
    crop_type: 'Soybean',
    min_quantity_kg: 3000,
    preferred_grade: 'A',
    location: 'Ujjain',
    state: 'Madhya Pradesh',
    contact_phone: '+91-9893012233'
  }
];

const MOCK_PRODUCE_LOTS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    farm_id: 'farm-001',
    crop_type: 'Tomato',
    quantity_kg: 1200,
    grade: 'A',
    harvest_date: getPastDate(2),
    location: 'Somala',
    state: 'Andhra Pradesh',
    status: 'available'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    farm_id: 'farm-002',
    crop_type: 'Wheat',
    quantity_kg: 6000,
    grade: 'A',
    harvest_date: getPastDate(10),
    location: 'Indore',
    state: 'Madhya Pradesh',
    status: 'available'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    farm_id: 'farm-003',
    crop_type: 'Onion',
    quantity_kg: 2500,
    grade: 'B',
    harvest_date: getPastDate(5),
    location: 'Lasalgaon',
    state: 'Maharashtra',
    status: 'available'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    farm_id: 'farm-004',
    crop_type: 'Soybean',
    quantity_kg: 4000,
    grade: 'A',
    harvest_date: getPastDate(14),
    location: 'Ujjain',
    state: 'Madhya Pradesh',
    status: 'available'
  }
];

module.exports = {
  MOCK_MANDI_PRICES,
  MOCK_PRICE_TRENDS,
  MOCK_LOGISTICS_FACILITIES,
  MOCK_BUYER_PROFILES,
  MOCK_PRODUCE_LOTS,
  getPastDate
};

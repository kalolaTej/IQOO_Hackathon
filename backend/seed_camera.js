const dotenv = require('dotenv');
dotenv.config();

const supabase = require('./services/supabaseClient');

async function seedCamera() {
  try {
    // 1. Get user operator@intrusion.com
    const { data: users, error: uErr } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'operator@intrusion.com')
      .single();

    let userId;
    if (uErr || !users) {
      console.log('Inserting default user...');
      const { data: newUser, error: insertUserErr } = await supabase
        .from('users')
        .insert([{ name: 'Farm Operator', email: 'operator@intrusion.com' }])
        .select();
      if (insertUserErr || !newUser || newUser.length === 0) {
        console.error('❌ Failed to insert default user:', insertUserErr ? insertUserErr.message : 'No data returned');
        return;
      }
      userId = newUser[0].id;
    } else {
      userId = users.id;
    }

    // 2. Check or create farm
    const { data: farms } = await supabase
      .from('farms')
      .select('id')
      .limit(1);

    let farmId;
    if (!farms || farms.length === 0) {
      const { data: newFarm, error: insertFarmErr } = await supabase
        .from('farms')
        .insert([{ user_id: userId, name: 'North Perimeter Farm', location: 'Zone A' }])
        .select();
      if (insertFarmErr || !newFarm || newFarm.length === 0) {
        console.error('❌ Failed to insert farm:', insertFarmErr ? insertFarmErr.message : 'No data returned');
        return;
      }
      farmId = newFarm[0].id;
    } else {
      farmId = farms[0].id;
    }

    // 3. Check or create camera
    const { data: cameras } = await supabase
      .from('cameras')
      .select('id, name')
      .limit(1);

    let cameraId;
    if (!cameras || cameras.length === 0) {
      const { data: newCam, error: insertCamErr } = await supabase
        .from('cameras')
        .insert([{ farm_id: farmId, name: 'Cam 01 - North Gate', zone: 'North Perimeter', status: true }])
        .select();
      if (insertCamErr || !newCam || newCam.length === 0) {
        console.error('❌ Failed to insert camera:', insertCamErr ? insertCamErr.message : 'No data returned');
        return;
      }
      cameraId = newCam[0].id;
    } else {
      cameraId = cameras[0].id;
    }

    console.log(`✅ Valid Camera UUID: ${cameraId}`);
    return cameraId;
  } catch (err) {
    console.error('Error seeding camera:', err.message);
  }
}

seedCamera();

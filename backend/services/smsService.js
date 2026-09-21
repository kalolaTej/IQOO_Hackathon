/**
 * AgriSync Mock SMS Service
 * Module owner: Vasu
 * Exported function: sendSms(phoneNumberOrUserId, message)
 * Simulates SMS delivery for queue updates, slot bookings, gate pass OTPs, and price alerts.
 */

export const sendSms = async (recipient, message) => {
  const timestamp = new Date().toISOString();
  console.log(`[AgriSync SMS Service - MOCK] [${timestamp}]`);
  console.log(`  To: ${recipient}`);
  console.log(`  Message: "${message}"`);
  console.log(`  Status: Delivered (Simulated)\n`);

  return {
    success: true,
    mock: true,
    recipient,
    message,
    timestamp,
    messageId: `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  };
};

export default {
  sendSms
};

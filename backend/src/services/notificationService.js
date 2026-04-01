// Placeholder - replace with Twilio/SendGrid later
const sendNotification = async ({ to, subject, message }) => {
  console.log('NOTIFICATION (placeholder) ->', { to, subject, message });
  return { ok: true };
};

module.exports = { sendNotification };

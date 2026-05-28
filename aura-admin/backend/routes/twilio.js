// backend/routes/twilio.js
const express = require('express');
const router = express.Router();
const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

// ============================================
// SEND EMERGENCY SMS ALERT
// ============================================
router.post('/api/alerts/send-sms', async (req, res) => {
  try {
    const { phoneNumber, message, zoneName } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Default emergency message if none provided
    const alertMessage = message || 
      `🚨 AURA EMERGENCY ALERT 🚨\n\n` +
      `High risk detected in ${zoneName || 'your area'}.\n\n` +
      `Please follow safety instructions and evacuate if necessary.\n\n` +
      `Stay safe!`;

    console.log(`📱 Sending SMS to ${phoneNumber}:`, alertMessage);

    // Send SMS via Twilio
    const smsResult = await client.messages.create({
      body: alertMessage,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log('✅ SMS sent successfully:', smsResult.sid);

    res.json({
      success: true,
      message: 'SMS alert sent successfully',
      sid: smsResult.sid,
      to: phoneNumber
    });

  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    res.status(500).json({ 
      error: 'Failed to send SMS', 
      details: error.message 
    });
  }
});

// ============================================
// SEND BULK SMS TO MULTIPLE USERS
// ============================================
router.post('/api/alerts/send-bulk-sms', async (req, res) => {
  try {
    const { phoneNumbers, message, zoneName } = req.body;

    if (!phoneNumbers || phoneNumbers.length === 0) {
      return res.status(400).json({ error: 'Phone numbers array is required' });
    }

    const alertMessage = message || 
      `🚨 AURA EMERGENCY ALERT 🚨\n\n` +
      `High risk detected in ${zoneName || 'your area'}.\n\n` +
      `Please follow safety instructions and evacuate if necessary.\n\n` +
      `Stay safe!`;

    console.log(`📱 Sending bulk SMS to ${phoneNumbers.length} users`);

    const results = await Promise.all(
      phoneNumbers.map(async (phoneNumber) => {
        try {
          const smsResult = await client.messages.create({
            body: alertMessage,
            from: twilioPhoneNumber,
            to: phoneNumber
          });
          return { phoneNumber, success: true, sid: smsResult.sid };
        } catch (error) {
          return { phoneNumber, success: false, error: error.message };
        }
      })
    );

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`✅ SMS sent: ${successCount} success, ${failCount} failed`);

    res.json({
      success: true,
      message: `SMS sent to ${successCount} users`,
      results,
      successCount,
      failCount
    });

  } catch (error) {
    console.error('❌ Error sending bulk SMS:', error);
    res.status(500).json({ 
      error: 'Failed to send bulk SMS', 
      details: error.message 
    });
  }
});

module.exports = router;
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { sendBulkSMSAlert } from "../../services/api";
import { toast } from "react-toastify";

const EmergencyAlertButton = ({ zoneName = "Main Entrance" }) => {
  const [sending, setSending] = useState(false);

  // ✅ YOUR PHONE NUMBERS - ADD MORE HERE
  const emergencyContacts = [
    "+917019253374",
    // "+911234567890",  // Add more numbers
    // "+919876543210",
  ];

  const handleSendSOS = async () => {
    if (sending) return;

    try {
      setSending(true);
      
      // Simple emergency message
      const message = `🚨 AURA EMERGENCY ALERT 🚨\n\nHigh risk detected in ${zoneName}.\n\nImmediate attention required!\n\nTime: ${new Date().toLocaleString()}`;

      console.log('📱 Sending SOS to:', emergencyContacts);
      
      const result = await sendBulkSMSAlert(emergencyContacts, message, zoneName);
      
      toast.success(`📱 Emergency alert sent to ${result.successCount} contacts!`, {
        position: 'top-center',
        autoClose: 5000,
      });
      
    } catch (error) {
      console.error('❌ Failed to send SOS:', error);
      toast.error('Failed to send emergency alert: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleSendSOS}
      disabled={sending}
      className={`px-4 py-2 bg-red-600 text-white rounded-lg font-semibold shadow-md 
        hover:bg-red-700 flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed
        ${sending ? 'animate-pulse' : ''}`}
    >
      <Phone className="w-4 h-4" />
      {sending ? 'Sending...' : 'SOS'}
    </motion.button>
  );
};

export default EmergencyAlertButton;
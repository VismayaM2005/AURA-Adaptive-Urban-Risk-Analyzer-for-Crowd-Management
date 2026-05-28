const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
console.log("🔗 API URL:", API_URL);

// ==========================================
// METRICS & DASHBOARD DATA
// ==========================================

// Fetch main dashboard metrics (from zones.json + alerts.json)
export const fetchMetrics = async () => {
  try {
    console.log(`📡 Fetching metrics from: ${API_URL}/api/metrics`);
    const response = await fetch(`${API_URL}/api/metrics`);
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const data = await response.json();
    console.log("✅ Metrics loaded successfully");
    return data;
  } catch (error) {
    console.error("❌ Error loading metrics:", error);
    console.log("⚠ Make sure backend is running: cd backend && node server.js");
    throw error;
  }
};

// Fetch zones data (from zones.json)
export const fetchZones = async () => {
  try {
    const response = await fetch(`${API_URL}/api/zones`);
    if (!response.ok) throw new Error("Failed to fetch zones");
    const data = await response.json();
    return data.zones || [];
  } catch (error) {
    console.error("❌ Error loading zones:", error);
    return [];
  }
};

// Fetch alerts data
export const fetchAlerts = async () => {
  try {
    const response = await fetch(`${API_URL}/api/alerts`);
    if (!response.ok) throw new Error("Failed to fetch alerts");

    const data = await response.json();
    const alerts = data.alerts || data || [];

    return alerts.map((alert, idx) => ({
      alert_id: alert.id || alert.alert_id || idx + 1,
      zone_id: alert.zone_id || alert.zone || 1,
      zone: alert.zone || alert.zone_id,
      title: alert.title || alert.message?.slice(0, 50) + "...",
      message: alert.message || "Crowd alert triggered",
      severity: alert.severity || "low",
      type: alert.type || alert.alert_type || "crowd_risk",
      timestamp: alert.timestamp,
      status: alert.status || "active",
      resolved_at: alert.resolved_at,
      acknowledged_by: alert.acknowledged_by,
    }));
  } catch (error) {
    console.error("❌ Error loading alerts:", error);
    return [];
  }
};

// Fetch analytics data
export const fetchAnalytics = async () => {
  try {
    console.log(`📊 Fetching analytics from: ${API_URL}/api/analytics`);
    const response = await fetch(`${API_URL}/api/analytics`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    console.log("✅ Analytics loaded:", data);
    return data;
  } catch (error) {
    console.error("❌ Error loading analytics:", error);
    return { metrics: [], timeSeriesData: [] };
  }
};
// Fetch playback data
export const fetchPlayback = async () => {
  try {
    const response = await fetch(`${API_URL}/api/playback`);
    if (!response.ok) throw new Error("Failed to fetch playback");

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error loading playback:", error);
    return { history: [] };
  }
};
// ============================================
// SEND SMS ALERT
// ============================================
export const sendSMSAlert = async (phoneNumber, message, zoneName) => {
  try {
    console.log("📱 Sending SMS alert to:", phoneNumber);

    const response = await fetch(`${API_URL}/api/alerts/send-sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumber,
        message,
        zoneName,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send SMS");
    }

    const result = await response.json();
    console.log("✅ SMS sent:", result);
    return result;
  } catch (error) {
    console.error("❌ Error sending SMS:", error);
    throw error;
  }
};

// ============================================
// SEND BULK SMS ALERTS
// ============================================
export const sendBulkSMSAlert = async (phoneNumbers, message, zoneName) => {
  try {
    console.log("📱 Sending bulk SMS to:", phoneNumbers.length, "users");

    const response = await fetch(`${API_URL}/api/alerts/send-bulk-sms`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumbers,
        message,
        zoneName,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send bulk SMS");
    }

    const result = await response.json();
    console.log("✅ Bulk SMS sent:", result);
    return result;
  } catch (error) {
    console.error("❌ Error sending bulk SMS:", error);
    throw error;
  }
};
// ==========================================
// ALERT ACTIONS
// ==========================================

// Acknowledge alert
export const acknowledgeAlert = async (alertId, adminId) => {
  try {
    const response = await fetch(
      `${API_URL}/api/alerts/${alertId}/acknowledge`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: adminId }),
      }
    );

    if (!response.ok) throw new Error("Failed to acknowledge alert");
    return await response.json();
  } catch (error) {
    console.error("❌ Error acknowledging alert:", error);
    throw error;
  }
};

// ✅ Add this to your api.js file (at the bottom)
export const saveAcknowledgedAlert = async (alertData) => {
  try {
    console.log(`📡 Saving acknowledged alert: ${alertData.zone}`);

    const response = await fetch(`${API_URL}/api/save-acknowledged`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alertData),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    console.log("✅ Saved to backend/data/acknowledgedAlerts.json");
    return result;
  } catch (error) {
    console.error("❌ Failed to save acknowledged alert:", error);
    // Fallback to localStorage
    const existing = JSON.parse(
      localStorage.getItem("acknowledgedAlerts") || "[]"
    );
    localStorage.setItem(
      "acknowledgedAlerts",
      JSON.stringify([...existing, alertData])
    );
    return { success: false, local: true };
  }
};

// ==========================================
// SAFE ROUTES MANAGEMENT
// ==========================================

export const fetchSafeRoutes = async () => {
  try {
    const response = await fetch(`${API_URL}/api/safe-routes`);
    if (!response.ok) throw new Error("Failed to fetch safe routes");

    const data = await response.json();
    if (data.safeRoute) {
      return [
        {
          id: "route_" + Date.now(),
          from: data.safeRoute.from,
          to: data.safeRoute.to,
          path: data.safeRoute.path,
          riskLevel: data.safeRoute.riskLevel,
          status: "pending",
        },
      ];
    }
    return [];
  } catch (error) {
    console.error("❌ Error loading safe routes:", error);
    return [];
  }
};

export const approveSafeRoute = async (route, adminId = "admin") => {
  try {
    const response = await fetch(`${API_URL}/api/safe-routes/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ route, admin_id: adminId }),
    });

    if (!response.ok) throw new Error("Failed to approve route");
    return await response.json();
  } catch (error) {
    console.error("❌ Error approving route:", error);
    throw error;
  }
};

export const rejectSafeRoute = async () => {
  try {
    const response = await fetch(`${API_URL}/api/safe-routes/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error("Failed to reject route");
    return await response.json();
  } catch (error) {
    console.error("❌ Error rejecting route:", error);
    throw error;
  }
};

export const fetchApprovedRoutes = async () => {
  try {
    const response = await fetch(`${API_URL}/api/safe-routes/approved`);
    if (!response.ok) throw new Error("Failed to fetch approved routes");

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error loading approved routes:", error);
    return [];
  }
};

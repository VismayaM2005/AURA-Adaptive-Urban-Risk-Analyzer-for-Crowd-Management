// backend/routes/metrics.js
const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const fsSync = require("fs");

// Path to JSON data files
const DATA_DIR = path.join(__dirname, "../data");

// Helper function to read JSON file
const readJSON = async (filename) => {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    return null;
  }
};

// Helper to convert risk string to numeric value
const riskToNumeric = (risk) => {
  const riskMap = {
    safe: 0.2,
    low: 0.3,
    warning: 0.5,
    medium: 0.6,
    high: 0.75,
    critical: 0.9,
    danger: 0.95,
  };
  return riskMap[risk?.toLowerCase()] || 0.5;
};

// GET /api/metrics
router.get("/api/metrics", async (req, res) => {
  try {
    console.log("📊 /api/metrics called");

    const zonesData = await readJSON("zones.json");
    const alertsData = await readJSON("alerts.json");

    const zones = (zonesData.zones || []).map((zone) => {
      const riskValue = riskToNumeric(zone.risk);

      return {
        id: zone.id,
        name: zone.name,
        lat: zone.coordinates?.lat || 12.97 + Math.random() * 0.01,
        lng: zone.coordinates?.lng || 77.59 + Math.random() * 0.01,
        density: zone.density || 0,
        risk: riskValue,
        cpi: zone.cpi || (zone.density ? zone.density / 50 : 50),
        elbs: zone.elbs || 5.0,
        huddles: zone.huddles || Math.floor(Math.random() * 5),
      };
    });

    const alerts = (alertsData.alerts || []).map((alert, idx) => ({
      id: idx + 1,
      zone: alert.zone,
      message: alert.message,
      type: alert.severity === "high" ? "HIGH_RISK" : "MEDIUM_RISK",
      severity: alert.severity,
      timestamp: alert.timestamp,
    }));

    const response = {
      zones,
      alerts,
      totalBeacons: zones.reduce((sum, z) => sum + (z.density || 0), 0),
      overcrowdedZones: zones.filter((z) => z.risk > 0.6).length,
      visitorCount: zones.reduce((sum, z) => sum + (z.density || 0), 0),
    };

    console.log("✅ Sending metrics:", {
      zonesCount: zones.length,
      alertsCount: alerts.length,
    });

    res.json(response);
  } catch (error) {
    console.error("❌ Error in /api/metrics:", error);
    res.status(500).json({ error: "Failed to fetch metrics" });
  }
});

// GET /api/zones
router.get("/api/zones", async (req, res) => {
  try {
    const data = await readJSON("zones.json");
    res.json(data || { zones: [] });
  } catch (error) {
    console.error("Error fetching zones:", error);
    res.status(500).json({ error: "Failed to fetch zones" });
  }
});

// GET /api/alerts
router.get("/api/alerts", async (req, res) => {
  try {
    const data = await readJSON("alerts.json");

    const alerts =
      data?.alerts?.map((alert, idx) => ({
        alert_id: idx + 1,
        zone_id: getZoneIdFromName(alert.zone),
        title: getSeverityTitle(alert.severity),
        message: alert.message,
        severity: alert.severity,
        alert_type: "crowd_risk",
        status: "active",
        timestamp: alert.timestamp,
        resolved_at: null,
        acknowledged_by: null,
      })) || [];

    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

// GET /api/analytics ⭐ THIS WAS MISSING!
router.get("/api/analytics", async (req, res) => {
  try {
    console.log("📊 /api/analytics called");
    const data = await readJSON("analytics.json");

    if (!data || !data.metrics) {
      console.error("❌ No analytics data found");
      return res.json({ metrics: [], timeSeriesData: [] });
    }

    // Transform metrics for time series chart
    const timeSeriesData = data.metrics.map((metric) => ({
      time: new Date(metric.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      cpi: metric.cpi,
      density: metric.density,
      elbs: metric.elbs,
    }));

    console.log("✅ Analytics data loaded:", {
      metricsCount: data.metrics.length,
      timeSeriesCount: timeSeriesData.length,
    });

    res.json({
      metrics: data.metrics,
      timeSeriesData,
    });
  } catch (error) {
    console.error("❌ Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// GET /api/analytics/graph/:type (for images)
router.get("/api/analytics/graph/:type", (req, res) => {
  try {
    const { type } = req.params;
    const imagePath = path.join(DATA_DIR, `${type}.png`);

    console.log("📊 Attempting to serve image:", imagePath);

    if (fsSync.existsSync(imagePath)) {
      console.log("✅ Image found, sending:", type);
      res.sendFile(imagePath);
    } else {
      console.error(`❌ Image not found at: ${imagePath}`);
      res.status(404).json({ error: "Image not found", path: imagePath });
    }
  } catch (error) {
    console.error("❌ Error serving graph:", error);
    res.status(500).json({ error: "Failed to load graph" });
  }
});

// GET /api/playback
router.get("/api/playback", async (req, res) => {
  try {
    const data = await readJSON("playback.json");
    res.json(data || { history: [] });
  } catch (error) {
    console.error("Error fetching playback:", error);
    res.status(500).json({ error: "Failed to fetch playback" });
  }
});

// GET /api/safe-routes
router.get("/api/safe-routes", async (req, res) => {
  try {
    const data = await readJSON("safeRoute.json");
    res.json(data || { safeRoute: null });
  } catch (error) {
    console.error("Error fetching safe routes:", error);
    res.status(500).json({ error: "Failed to fetch safe routes" });
  }
});

// POST /api/safe-routes/approve
router.post("/api/safe-routes/approve", async (req, res) => {
  try {
    console.log("✅ Approve route request received:", req.body);

    const { route, admin_id } = req.body;

    if (!route) {
      return res.status(400).json({ error: "Route data is required" });
    }

    const approvedData = await readJSON("approvedRoutes.json");
    const approvedRoutes = approvedData?.approvedRoutes || [];

    const approvedRoute = {
      id: Date.now(),
      from: route.from,
      to: route.to,
      path: route.path,
      riskLevel: route.riskLevel,
      approvedBy: admin_id || "admin",
      approvedAt: new Date().toISOString(),
      status: "active",
      sentToMobile: true,
    };

    approvedRoutes.push(approvedRoute);

    await fs.writeFile(
      path.join(DATA_DIR, "approvedRoutes.json"),
      JSON.stringify({ approvedRoutes }, null, 2),
      "utf8"
    );

    console.log("✅ Route approved and saved:", approvedRoute.id);

    res.json({
      success: true,
      message: "Route approved and sent to mobile users",
      approvedRoute,
    });
  } catch (error) {
    console.error("❌ Error approving route:", error);
    res.status(500).json({ error: "Failed to approve route" });
  }
});

// GET /api/safe-routes/approved
router.get("/api/safe-routes/approved", async (req, res) => {
  try {
    const data = await readJSON("approvedRoutes.json");
    res.json(data?.approvedRoutes || []);
  } catch (error) {
    console.error("Error fetching approved routes:", error);
    res.status(500).json({ error: "Failed to fetch approved routes" });
  }
});

// POST /api/safe-routes/reject
router.post("/api/safe-routes/reject", async (req, res) => {
  try {
    console.log("❌ Route rejected");
    res.json({ success: true, message: "Route rejected" });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject route" });
  }
});

// Helper functions
const getZoneIdFromName = (zoneName) => {
  const zoneMap = {
    "Main Entrance": 1,
    "Food Court": 2,
    "Stage Area": 3,
    "Exit Gate A": 4,
    "Parking Zone": 5,
  };
  return zoneMap[zoneName] || 1;
};

const getSeverityTitle = (severity) => {
  const titles = {
    high: "High Risk Alert",
    critical: "Critical Density Warning",
    medium: "Moderate Crowding",
    low: "Low Risk Notice",
  };
  return titles[severity?.toLowerCase()] || "Alert Notification";
};
// ... all your other routes above ...

// POST /api/acknowledged-alerts - Save acknowledged alert
router.post("/api/acknowledged-alerts", async (req, res) => {
  try {
    console.log("✅ Saving acknowledged alert:", req.body);

    const alert = req.body;
    const filePath = path.join(DATA_DIR, "acknowledgedAlerts.json");

    // Read existing data
    let data = { acknowledgedAlerts: [] };
    try {
      if (fsSync.existsSync(filePath)) {
        const fileData = await fs.readFile(filePath, "utf8");
        data = JSON.parse(fileData);
      }
    } catch (readError) {
      console.log("Creating new acknowledgedAlerts.json file");
    }

    // Add new alert
    data.acknowledgedAlerts.push({
      ...alert,
      savedAt: new Date().toISOString(),
    });

    // Write back to file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");

    console.log(`✅ Alert saved! Total: ${data.acknowledgedAlerts.length}`);

    res.json({
      success: true,
      total: data.acknowledgedAlerts.length,
    });
  } catch (error) {
    console.error("❌ Error saving acknowledged alert:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save alert",
      error: error.message,
    });
  }
});

module.exports = router;

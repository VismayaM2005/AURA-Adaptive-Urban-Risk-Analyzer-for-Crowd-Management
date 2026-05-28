require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const authRoutes = require("./routes/auth");
const metricsRoutes = require("./routes/metrics");
const twilioRoutes = require("./routes/twilio");
const db = require("./database");
const app = express();
const PORT = process.env.PORT || 5000;
const path = require("path");
const fs = require("fs");
app.use("/data", express.static(path.join(__dirname, "data")));
// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/auth", authRoutes);
app.use(metricsRoutes);
app.use(twilioRoutes);
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "AURA Backend is running" });
});
// Notifications
app.post("/api/notifications/create", (req, res) => {
  const { type, title, message, zone, priority } = req.body;

  db.run(
    "INSERT INTO notifications (type, title, message, zone, priority) VALUES (?, ?, ?, ?, ?)",
    [type, title, message, zone, priority || "medium"],
    function (err) {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Incidents
app.get("/api/incidents", (req, res) => {
  db.all(
    "SELECT * FROM incidents ORDER BY created_at DESC LIMIT 100",
    (err, incidents) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(incidents);
    }
  );
});

// Alert history
app.get("/api/alerts/history/:zoneId", (req, res) => {
  const { zoneId } = req.params;

  db.all(
    `SELECT * FROM alerts WHERE zone_id = ? ORDER BY timestamp DESC LIMIT 20`,
    [zoneId],
    (err, alerts) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      res.json(alerts);
    }
  );
});

// Send to mobile
app.post("/api/alerts/send-to-mobile", async (req, res) => {
  const { alert_id, zone_id, message, severity } = req.body;

  try {
    db.run(
      `INSERT INTO mobile_notifications (alert_id, zone_id, message, severity, sent_at) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [alert_id, zone_id, message, severity]
    );

    res.json({ success: true, message: "Alert sent to mobile users" });
  } catch (error) {
    console.error("Error sending to mobile:", error);
    res.status(500).json({ error: "Failed to send alert to mobile" });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 AURA Backend running on http://localhost:${PORT}`);
  console.log(`\n📊 API Endpoints:`);
  console.log(`   ✅ /api/auth/*`);
  console.log(`   ✅ /api/metrics`);
  console.log(`   ✅ /api/zones`);
  console.log(`   ✅ /api/alerts`);
  console.log(`   ✅ /api/analytics`);
  console.log(`   ✅ /api/playback`);
  console.log(`   ✅ /api/safe-routes\n`);
  console.log(`   ✅ /api/alerts/send-sms`);
  console.log(`   ✅ /api/alerts/send-bulk-sms\n`);
});

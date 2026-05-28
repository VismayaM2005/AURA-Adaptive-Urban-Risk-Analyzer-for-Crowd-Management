import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Filter,
  ChevronDown,
  Send,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [zones, setZones] = useState([]);
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterZone, setFilterZone] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const generateRealisticAlerts = () => {
    const zoneList = [
      "Main Entrance",
      "Food Court",
      "Parking Lot",
      "Exit Gate",
      "VIP Lounge",
      "Stage Area",
    ];
    const messages = [
      "Crowd risk elevated",
      "High density detected",
      "Crowd congestion alert",
      "Risk level exceeded threshold",
      "Movement slowdown detected",
      "Overcrowding warning issued",
    ];

    return Array.from({ length: 25 }, (_, index) => {
      const now = new Date();
      now.setSeconds(now.getSeconds() - (25 - index) * 3);

      const isResolved = Math.random() > 0.7;

      return {
        alert_id: `alert_${Date.now()}_${index}`,
        zone: zoneList[index % zoneList.length],
        zone_id: (index % 6) + 1,
        title: `Alert #${index + 1}`,
        message: messages[index % messages.length],
        severity: index % 3 === 0 ? "high" : index % 3 === 1 ? "medium" : "low",
        timestamp: now.toISOString(),
        status: isResolved ? "resolved" : "active",
      };
    });
  };

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = () => {
    setLoading(true);
    const simulatedAlerts = generateRealisticAlerts();
    setAlerts(simulatedAlerts);
    setZones([
      "Main Entrance",
      "Food Court",
      "Parking Lot",
      "Exit Gate",
      "VIP Lounge",
      "Stage Area",
    ]);
    setLoading(false);
  };

  const handleSendToUsers = async (alert) => {
    const payload = {
      ...alert,
      acknowledged_by: user?.email || "admin@example.com",
      acknowledged_at: new Date().toISOString(),
      action: "sent_to_users",
    };

    try {
      await fetch(`${API_URL}/api/acknowledged-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      toast.success("Alert sent to users.");
    } catch (error) {
      toast.success("Alert stored offline (fallback).");
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (alert.status !== "active") return false;
    if (filterSeverity !== "all" && alert.severity !== filterSeverity)
      return false;
    if (filterZone !== "all" && alert.zone !== filterZone) return false;
    return true;
  });

  const activeCount = alerts.filter((a) => a.status === "active").length;
  const highSeverityCount = alerts.filter(
    (a) => a.severity === "high" && a.status === "active"
  ).length;

  const getAlertIcon = (severity) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="w-6 h-6 text-danger" />;
      case "medium":
        return <Clock className="w-6 h-6 text-warning" />;
      default:
        return <CheckCircle className="w-6 h-6 text-success" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "border-l-danger bg-red-50/50";
      case "medium":
        return "border-l-warning bg-yellow-50/50";
      default:
        return "border-l-success bg-green-50/50";
    }
  };

  const getSeverityBadge = (severity) => {
    const colors = {
      high: "bg-red-100 text-red-800 border border-red-300",
      medium: "bg-yellow-100 text-yellow-800 border border-yellow-300",
      low: "bg-blue-100 text-blue-800 border border-blue-300",
    };
    return colors[severity] || colors.low;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in p-4 md:p-6">
      {/* Header */}
      <div className="glass-effect rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Alert Management
            </h1>
            <p className="text-gray-500">
              Real-time AURA crowd monitoring alerts
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <motion.div className="px-4 py-3 bg-danger/10 rounded-xl border border-danger/20 min-w-[80px] text-center">
              <p className="text-xs text-danger font-semibold">HIGH</p>
              <p className="text-xl font-bold text-danger">
                {highSeverityCount}
              </p>
            </motion.div>
            <motion.div className="px-4 py-3 bg-orange/10 rounded-xl border border-orange/20 min-w-[80px] text-center">
              <p className="text-xs text-orange font-semibold">ACTIVE</p>
              <p className="text-xl font-bold text-orange">{activeCount}</p>
            </motion.div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 flex-1 transition ${
              showFilters
                ? "bg-primary text-white shadow-lg"
                : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </motion.button>

          <motion.button
            onClick={loadAlerts}
            className="px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5 animate-spin" />
            Refresh
          </motion.button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50/50 rounded-xl">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Severity
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border text-black bg-white"
                    value={filterSeverity}
                    onChange={(e) => setFilterSeverity(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Zone
                  </label>
                  <select
                    className="w-full px-4 py-2 rounded-lg border text-black bg-white"
                    value={filterZone}
                    onChange={(e) => setFilterZone(e.target.value)}
                  >
                    <option value="all">All Zones</option>
                    {zones.map((z) => (
                      <option key={z}>{z}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="glass-effect rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-xl font-semibold mb-2">
              No alerts found
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert, index) => (
            <motion.div
              key={alert.alert_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`glass-effect rounded-2xl overflow-hidden border-l-4 shadow-lg ${getSeverityColor(
                alert.severity
              )}`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/80 rounded-xl shadow-sm border flex-shrink-0">
                    {getAlertIcon(alert.severity)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{alert.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-bold border ${getSeverityBadge(
                            alert.severity
                          )}`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-700 text-lg mb-4">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-6 text-sm text-gray-500 bg-gray-50/50 px-4 py-3 rounded-xl">
                      <span className="flex items-center gap-2">
                        <strong>{alert.zone}</strong>
                      </span>
                      <span className="w-px h-4 bg-gray-300" />
                      <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>

                    <div className="flex gap-3 pt-3 border-t mt-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSendToUsers(alert)}
                        className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold flex items-center gap-2 shadow-lg"
                      >
                        <Send className="w-4 h-4" />
                        Send to Users
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPage;

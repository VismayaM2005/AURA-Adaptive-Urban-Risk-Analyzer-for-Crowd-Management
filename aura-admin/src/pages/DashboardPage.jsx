import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  MapPin,
  AlertTriangle,
  Activity,
  RefreshCw,
} from "lucide-react";
import StatCard from "../components/Dashboard/StatCard";
import HeatMap from "../components/Dashboard/HeatMap";
import RecommendedRoute from "../components/Dashboard/RecommendedRoute";
import EmergencyAlertButton from "../components/Dashboard/EmergencyAlertButton";
import { fetchMetrics } from "../services/api";
import { toast } from "react-toastify";

const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMetrics();

    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await fetchMetrics();

      if (!data) throw new Error("No data received from API");

      setMetrics(data);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      toast.error("Failed to load data: " + err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-danger mx-auto mb-4" />
          <p className="text-gray-600 font-semibold mb-4">Error: {error}</p>
          <button
            onClick={loadMetrics}
            className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-600 font-semibold mb-4">
            No metrics data available
          </p>
          <button
            onClick={loadMetrics}
            className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary/90"
          >
            Load Data
          </button>
        </div>
      </div>
    );
  }

  // Safe risk calculation
  const highRiskCount = metrics.zones
    ? metrics.zones.filter((z) => Number(z.risk) > 0.6).length
    : 0;

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="glass-effect rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Live Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {metrics.zones?.length || 0} zones monitored • Last updated:{" "}
              {new Date().toLocaleTimeString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <EmergencyAlertButton zoneName="Main Entrance" />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={loadMetrics}
              className="p-3 bg-primary text-white rounded-xl shadow-lg hover:shadow-xl transition"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Active Beacons"
          value={metrics.totalBeacons || 0}
          trend={5.2}
          icon={Activity}
          color="primary"
        />
        <StatCard
          title="Overcrowded Zones"
          value={metrics.overcrowdedZones || 0}
          trend={-12.5}
          icon={AlertTriangle}
          color="danger"
        />
        <StatCard
          title="Visitor Count"
          value={metrics.visitorCount || 0}
          trend={8.3}
          icon={Users}
          color="success"
        />
        <StatCard
          title="High Risk Zones"
          value={highRiskCount}
          trend={-3.1}
          icon={MapPin}
          color="warning"
        />
      </div>

      {/* Heatmap */}
      {metrics.zones?.length > 0 ? (
        <HeatMap zones={metrics.zones} />
      ) : (
        <div className="glass-effect rounded-2xl p-8 text-center">
          <p className="text-gray-500">No zones data available</p>
        </div>
      )}

      {/* Route */}
      <RecommendedRoute />
    </div>
  );
};

export default DashboardPage;

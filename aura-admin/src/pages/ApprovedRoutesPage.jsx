import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Navigation, Clock, User, RefreshCw } from "lucide-react";
import { fetchApprovedRoutes } from "../services/api";
import { toast } from "react-toastify";

const ApprovedRoutesPage = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const data = await fetchApprovedRoutes();
      setRoutes(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to load approved routes:", error);
      toast.error("Failed to load approved routes");
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk === "CRITICAL") return "bg-red-100 text-danger border-danger";
    if (risk === "HIGH") return "bg-yellow-100 text-warning border-warning";
    return "bg-green-100 text-success border-success";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-semibold">
            Loading approved routes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Approved Routes History
          </h1>
          <p className="text-gray-500">
            View all routes approved and sent to mobile users
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={loadRoutes}
          className="p-3 bg-primary text-white rounded-xl shadow-lg hover:shadow-xl transition"
        >
          <RefreshCw className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-6 h-6 text-success" />
            <h3 className="text-gray-500 text-sm font-semibold">
              Total Approved
            </h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">{routes.length}</p>
        </div>

        <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Navigation className="w-6 h-6 text-primary" />
            <h3 className="text-gray-500 text-sm font-semibold">
              Active Routes
            </h3>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {routes.filter((r) => r.status === "active").length}
          </p>
        </div>

        <div className="glass-effect rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-6 h-6 text-warning" />
            <h3 className="text-gray-500 text-sm font-semibold">
              Last Approved
            </h3>
          </div>
          <p className="text-lg font-bold text-gray-800">
            {routes.length > 0
              ? new Date(
                  routes[routes.length - 1].approvedAt
                ).toLocaleTimeString()
              : "N/A"}
          </p>
        </div>
      </div>

      {/* Routes List */}
      {routes.length === 0 ? (
        <div className="glass-effect rounded-2xl p-12 text-center">
          <Navigation className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">
            No Approved Routes Yet
          </h3>
          <p className="text-gray-500">Approved routes will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {routes.reverse().map((route, index) => (
            <motion.div
              key={route.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-effect rounded-2xl p-6 hover:shadow-xl transition"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-success to-emerald-500 rounded-xl">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">
                      {route.from} → {route.to}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>Approved by {route.approvedBy}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(route.approvedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getRiskColor(
                    route.riskLevel
                  )}`}
                >
                  {route.riskLevel} RISK
                </span>
              </div>

              {/* Route Path */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 font-semibold mb-2">
                  ROUTE PATH
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {route.path.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-3 py-1 bg-white rounded-lg text-sm font-semibold text-gray-700 shadow-sm">
                        {step}
                      </span>
                      {idx < route.path.length - 1 && (
                        <span className="text-gray-400">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="mt-4 flex items-center gap-2">
                <span className="px-3 py-1 bg-success/20 text-success rounded-full text-xs font-bold">
                  ✓ Sent to Mobile Users
                </span>
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold">
                  {route.status.toUpperCase()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApprovedRoutesPage;

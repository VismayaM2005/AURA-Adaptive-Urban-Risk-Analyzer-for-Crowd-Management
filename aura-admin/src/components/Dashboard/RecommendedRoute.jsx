import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigation, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import {
  fetchSafeRoutes,
  approveSafeRoute,
  rejectSafeRoute,
} from "../../services/api";
import { toast } from "react-toastify";

const RecommendedRoute = () => {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoute();
    const interval = setInterval(loadRoute, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadRoute = async () => {
    try {
      const routes = await fetchSafeRoutes();
      if (routes && routes.length > 0) {
        setRoute(routes[0]);
      } else {
        setRoute(null);
      }
      setLoading(false);
    } catch (error) {
      console.error("Failed to load safe route:", error);
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      console.log("Sending approval request...");

      const result = await approveSafeRoute(route);

      if (result.success) {
        toast.success("Safe route approved and sent to mobile users!", {
          position: "top-center",
          autoClose: 5000,
        });

        console.log("Approved route saved:", result.approvedRoute);

        setRoute(null);
        loadRoute();
      } else {
        toast.error("Failed to approve route");
      }
    } catch (error) {
      console.error("Error approving route:", error);
      toast.error("Error approving route: " + error.message);
    }
  };
  const handleReject = async () => {
    try {
      await rejectSafeRoute(route.id);
      toast.info("Route rejected");
      setRoute(null);
    } catch (error) {
      toast.error("Error rejecting route");
    }
  };

  if (loading) {
    return (
      <div className="glass-effect rounded-2xl p-6 shadow-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="glass-effect rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Navigation className="w-6 h-6 text-success" />
          <h2 className="text-xl font-bold text-gray-800">AI Safe Route</h2>
        </div>
        <p className="text-gray-500">
          No pending safe route recommendations at this time.
        </p>
      </div>
    );
  }

  const getRiskColor = (risk) => {
    if (risk === "CRITICAL") return "text-danger bg-red-50 border-danger";
    if (risk === "HIGH") return "text-warning bg-yellow-50 border-warning";
    return "text-success bg-green-50 border-success";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-2xl p-6 shadow-lg border-l-4 border-primary"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-xl">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              🤖 AI Recommended Safe Route
            </h2>
            <p className="text-sm text-gray-600">
              Approve to send to mobile users
            </p>
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

      {/* Route Details */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">FROM</p>
            <p className="text-lg font-bold text-gray-800">{route.from}</p>
          </div>
          <div className="flex items-center justify-center">
            <div className="text-3xl">→</div>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold mb-1">TO</p>
            <p className="text-lg font-bold text-gray-800">{route.to}</p>
          </div>
        </div>

        <div>
          <p className="text-xs text-gray-500 font-semibold mb-2">ROUTE PATH</p>
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
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleApprove}
          className="flex-1 py-3 bg-gradient-to-r from-success to-emerald-500 text-white rounded-xl font-bold hover:shadow-xl transition flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Approve & Send to Mobile
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleReject}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition flex items-center justify-center gap-2"
        >
          <XCircle className="w-5 h-5" />
          Reject
        </motion.button>
      </div>

      {/* Warning */}
      <div className="mt-4 p-3 bg-warning/10 rounded-xl flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
        <p className="text-xs text-gray-600">
          Approving this route will send push notifications to all mobile users
          in the affected zones with navigation instructions.
        </p>
      </div>
    </motion.div>
  );
};

export default RecommendedRoute;

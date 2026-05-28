import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

const StatCard = ({ title, value, trend, icon: Icon, color = "primary" }) => {
  const isPositive = trend >= 0;

  const colorClasses = {
    primary: "from-blue-500 to-indigo-500",
    success: "from-green-500 to-emerald-500",
    danger: "from-red-500 to-rose-500",
    warning: "from-yellow-500 to-orange-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-effect rounded-2xl p-6 stat-card shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]}`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${
            isPositive ? "text-success" : "text-danger"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span>{Math.abs(trend)}%</span>
        </div>
      </div>

      {/* Content */}
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800">
          {(value || 0).toLocaleString()}
        </h3>
      </div>

      {/* Mini Trend Line */}
      <div className="mt-4 h-12">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          <path
            d="M 0,20 Q 25,10 50,25 T 100,15"
            fill="none"
            stroke={`url(#gradient-${color})`}
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          <defs>
            <linearGradient
              id={`gradient-${color}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop
                offset="0%"
                stopColor={
                  color === "primary"
                    ? "#6366f1"
                    : color === "success"
                    ? "#10b981"
                    : color === "danger"
                    ? "#ef4444"
                    : "#f59e0b"
                }
              />
              <stop
                offset="100%"
                stopColor={
                  color === "primary"
                    ? "#8b5cf6"
                    : color === "success"
                    ? "#34d399"
                    : color === "danger"
                    ? "#f87171"
                    : "#fbbf24"
                }
              />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </motion.div>
  );
};

export default StatCard;

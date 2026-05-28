import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Download,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { toast } from "react-toastify";
import { fetchPlayback } from "../services/api";
import HeatMap from "../components/Dashboard/HeatMap";

const PlaybackPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [playbackData, setPlaybackData] = useState([]);
  const [currentSnapshot, setCurrentSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  const maxTime = playbackData.length > 0 ? playbackData.length - 1 : 359; // 6min default

  // Production-ready data loader: Real data first, smart simulation fallback
  const loadPlaybackData = async () => {
    try {
      setLoading(true);
      const data = await fetchPlayback();
      const history = data.history || data || [];

      // ✅ PRIORITY 1: Use real data when available
      let extendedHistory = [...history];

      // ✅ PRIORITY 2: Extend to 6+ minutes (360 snapshots) with realistic simulation
      if (history.length < 360) {
        const zones = ["Main Entrance", "Food Court", "Parking Lot", "Exit Gate", "VIP Lounge"];
        for (let i = history.length; i < 360; i++) {
          const simulatedDensity = Math.max(50, Math.floor(300 + 150 * Math.sin(i / 8) + 100 * Math.cos(i / 12)));
          const zoneIndex = i % zones.length;
          extendedHistory.push({
            zone: zones[zoneIndex],
            density: simulatedDensity,
            risk: simulatedDensity > 350 ? "high" : simulatedDensity > 200 ? "medium" : "low",
            // Preserve real data patterns when available
            ...history[i % history.length]
          });
        }
      }

      const transformedData = extendedHistory.map((entry, index) => {
        // Use real density if available, otherwise simulate
        const density = entry.density || Math.max(50, Math.floor(300 + 150 * Math.sin(index / 8)));
        const zoneName = entry.zone || `Zone ${index % 5 + 1}`;
        const riskLevel = entry.risk || (density > 350 ? "high" : density > 200 ? "medium" : "low");

        return {
          timestamp: index,
          zones: [{
            id: index % 10 + 1,
            name: zoneName,
            lat: 12.9716 + (Math.random() - 0.5) * 0.02,
            lng: 77.5946 + (Math.random() - 0.5) * 0.02,
            density,
            risk: riskLevel === "low" ? 0.2 : riskLevel === "medium" ? 0.5 : 0.8,
            cpi: 30 + density / 10,
            elbs: 3 + Math.floor(density / 500),
            huddles: Math.floor(density / 1000),
          }],
          peakZone: {
            id: index % 10 + 1,
            name: zoneName,
            lat: 12.9716 + (Math.random() - 0.5) * 0.02,
            lng: 77.5946 + (Math.random() - 0.5) * 0.02,
          },
          maxDensity: density,
          avgSpeed: Math.max(1, 3.5 - density / 2000),
          overallRisk: riskLevel === "low" ? 0.2 : riskLevel === "medium" ? 0.5 : 0.8,
        };
      });

      setPlaybackData(transformedData);
      if (transformedData.length > 0) {
        setCurrentSnapshot(transformedData[0]);
      }
      
      // ✅ Smart toast: Shows if using real OR extended data
      const realCount = history.length;
      const totalCount = transformedData.length;
      if (realCount === totalCount) {
        toast.success(`✅ Loaded ${totalCount} real snapshots`);
      } else {
        toast.success(`✅ Loaded ${realCount} real + ${totalCount - realCount} simulated snapshots (${Math.floor(totalCount/60)}min)`);
      }
    } catch (error) {
      console.error("Backend failed, using production demo data:", error);
      // ✅ Pure production demo data as last resort
      const demoData = generateProductionDemo(360);
      setPlaybackData(demoData);
      setCurrentSnapshot(demoData[0]);
      toast.warning("⚠️ Using production demo data (6min simulation)");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Production demo data generator (used only on backend failure)
  const generateProductionDemo = (count) => {
    const zones = ["Main Entrance", "Food Court", "Parking Lot", "Exit Gate", "VIP Lounge"];
    return Array.from({ length: count }, (_, index) => {
      const density = Math.max(50, Math.floor(300 + 150 * Math.sin(index / 8) + 100 * Math.cos(index / 12)));
      const zone = zones[index % zones.length];
      const riskLevel = density > 350 ? "high" : density > 200 ? "medium" : "low";
      
      return {
        timestamp: index,
        zones: [{
          id: index % 10 + 1,
          name: zone,
          lat: 12.9716 + (Math.random() - 0.5) * 0.02,
          lng: 77.5946 + (Math.random() - 0.5) * 0.02,
          density,
          risk: riskLevel === "low" ? 0.2 : riskLevel === "medium" ? 0.5 : 0.8,
          cpi: 30 + density / 10,
          elbs: 3 + Math.floor(density / 500),
          huddles: Math.floor(density / 1000),
        }],
        peakZone: { id: index % 10 + 1, name: zone, lat: 12.9716, lng: 77.5946 },
        maxDensity: density,
        avgSpeed: Math.max(1, 3.5 - density / 2000),
        overallRisk: riskLevel === "low" ? 0.2 : riskLevel === "medium" ? 0.5 : 0.8,
      };
    });
  };

  useEffect(() => {
    loadPlaybackData();
  }, []);

  // Auto-play functionality
  useEffect(() => {
    let interval;
    if (isPlaying && currentTime < maxTime) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const newTime = prev + speed;
          if (newTime >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, currentTime, maxTime]);

  // Update snapshot based on current time
  useEffect(() => {
    if (playbackData.length > 0) {
      const index = Math.floor((currentTime / maxTime) * (playbackData.length - 1));
      setCurrentSnapshot(playbackData[Math.min(index, playbackData.length - 1)]);
    }
  }, [currentTime, playbackData, maxTime]);

  const handlePlayPause = () => {
    if (currentTime >= maxTime) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
    toast.info(isPlaying ? "⏸️ Playback paused" : "▶️ Playback started");
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
    toast.success("🔄 Playback reset");
  };

  const handleRefresh = () => {
    loadPlaybackData();
    toast.info("🔄 Refreshed");
  };

  const handleDownload = () => {
    if (!playbackData.length) return;

    const peakSnapshot = playbackData.reduce((max, snap) => {
      return snap.overallRisk > max.overallRisk ? snap : max;
    }, playbackData[0]);

    const report = {
      duration: `${Math.floor(maxTime / 60)}:${(maxTime % 60).toString().padStart(2, '0')}`,
      totalSnapshots: playbackData.length,
      peakRiskTime: formatTime(peakSnapshot.timestamp),
      peakZone: peakSnapshot.peakZone.name,
      maxDensity: Math.round(peakSnapshot.maxDensity),
      timeline: playbackData.map((snap) => ({
        time: formatTime(snap.timestamp),
        peakZone: snap.peakZone.name,
        maxDensity: Math.round(snap.maxDensity),
        avgSpeed: snap.avgSpeed.toFixed(1),
        overallRisk: (snap.overallRisk * 100).toFixed(0) + "%",
        zones: snap.zones.map((z) => ({
          id: z.id,
          name: z.name,
          density: Math.round(z.density),
          risk: z.risk.toFixed(2),
          cpi: z.cpi.toFixed(1),
          elbs: z.elbs,
          huddles: z.huddles,
        })),
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aura-playback-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("📥 Playback report downloaded!");
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getRiskColor = (risk) => {
    if (risk > 0.6) return "text-danger";
    if (risk > 0.3) return "text-warning";
    return "text-success";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading playback data...</p>
        </div>
      </div>
    );
  }

  // ... rest of your JSX remains EXACTLY THE SAME ...
  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Playback Mode ({playbackData.length} snapshots)
          </h1>
          <p className="text-gray-500">
            Replay historical crowd metrics from backend data
          </p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            disabled={!playbackData.length}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            Download Report
          </motion.button>
        </div>
      </div>

      {/* Heatmap Viewer - PERFECT RECTANGLE FIT */}
      <div className="glass-effect rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            🗺️ Live Heatmap Playback
          </h2>
          <div className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-mono font-bold text-lg">
            {formatTime(currentTime)}
          </div>
        </div>
        <div className="w-full h-[500px] rounded-xl overflow-hidden bg-gray-50 border-2 border-gray-200">
          {currentSnapshot ? (
            <HeatMap zones={currentSnapshot.zones} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <p className="text-gray-500 text-lg">No snapshot data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="glass-effect rounded-2xl p-8 shadow-lg">
        <div className="mb-6">
          <input
            type="range"
            min="0"
            max={maxTime}
            value={currentTime}
            onChange={(e) => setCurrentTime(parseInt(e.target.value))}
            disabled={!playbackData.length}
            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary disabled:cursor-not-allowed"
            style={{
              background: playbackData.length
                ? `linear-gradient(to right, #6366f1 0%, #6366f1 ${
                    (currentTime / maxTime) * 100
                  }%, #e5e7eb ${(currentTime / maxTime) * 100}%, #e5e7eb 100%)`
                : "#e5e7eb",
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2 font-mono">
            <span>00:00</span>
            <span>02:00</span>
            <span>04:00</span>
            <span>06:00</span>
            <span>{formatTime(maxTime)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
            disabled={!playbackData.length || currentTime === 0}
            className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
          >
            <SkipBack className="w-6 h-6 text-gray-700" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePlayPause}
            disabled={!playbackData.length}
            className="p-6 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl hover:shadow-2xl transition shadow-lg disabled:opacity-50"
          >
            {isPlaying ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8" />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCurrentTime(Math.min(maxTime, currentTime + 10))}
            disabled={!playbackData.length || currentTime === maxTime}
            className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
          >
            <SkipForward className="w-6 h-6 text-gray-700" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            disabled={!playbackData.length}
            className="p-4 bg-gray-100 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
          >
            <RotateCcw className="w-6 h-6 text-gray-700" />
          </motion.button>
        </div>

        <div className="flex items-center justify-center gap-3">
          <span className="text-sm text-gray-600 font-semibold">Playback Speed:</span>
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              disabled={!playbackData.length}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                speed === s
                  ? "bg-primary text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } disabled:opacity-50`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Snapshot Metadata Panel */}
      {currentSnapshot && (
        <div className="glass-effect rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-7 h-7 text-primary" />
            <h2 className="text-xl font-bold text-gray-800">📊 Snapshot Metadata</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
              <p className="text-xs text-blue-600 font-semibold mb-1">Peak Zone</p>
              <p className="text-2xl font-bold text-blue-900">{currentSnapshot.peakZone.name}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border-2 border-purple-200">
              <p className="text-xs text-purple-600 font-semibold mb-1">Max Density</p>
              <p className="text-2xl font-bold text-purple-900">{Math.round(currentSnapshot.maxDensity)}</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
              <p className="text-xs text-green-600 font-semibold mb-1">Avg Movement Speed</p>
              <p className="text-2xl font-bold text-green-900">{currentSnapshot.avgSpeed.toFixed(1)} m/s</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
              <p className="text-xs text-orange-600 font-semibold mb-1">Overall Risk Level</p>
              <p className={`text-2xl font-bold ${getRiskColor(currentSnapshot.overallRisk)}`}>
                {(currentSnapshot.overallRisk * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Events */}
      <div className="glass-effect rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">⏱️ Data Timeline</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {playbackData.slice(0, 50).map((snap, idx) => {
            const isPassed = currentTime >= snap.timestamp;
            const severity = snap.overallRisk > 0.6 ? "high" : snap.overallRisk > 0.3 ? "medium" : "low";
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0.5 }}
                animate={{
                  opacity: isPassed ? 1 : 0.5,
                  scale: isPassed && currentTime < snap.timestamp + 5 ? 1.02 : 1,
                }}
                className={`p-4 rounded-xl border-l-4 transition-all ${
                  severity === "high"
                    ? "border-l-danger bg-red-50"
                    : severity === "medium"
                    ? "border-l-warning bg-yellow-50"
                    : "border-l-success bg-green-50"
                } ${isPassed ? "" : "grayscale"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-gray-800">
                      {formatTime(snap.timestamp)}
                    </span>
                    <p className="text-sm text-gray-700 mt-1">
                      {snap.peakZone.name}: {Math.round(snap.maxDensity)} density
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPassed && (
                      <span className="text-xs text-gray-500 font-semibold">✓ PASSED</span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        severity === "high"
                          ? "bg-danger/20 text-danger"
                          : severity === "medium"
                          ? "bg-warning/20 text-warning"
                          : "bg-success/20 text-success"
                      }`}
                    >
                      {severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlaybackPage;

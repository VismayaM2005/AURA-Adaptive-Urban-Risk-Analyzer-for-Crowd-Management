import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, RotateCcw } from 'lucide-react';

const WhatIfModal = ({ isOpen, onClose, onRunScenario }) => {
  const [density, setDensity] = useState(50);
  const [blockedExits, setBlockedExits] = useState(0);
  const [redirectFlow, setRedirectFlow] = useState(false);

  const handleRun = () => {
    onRunScenario({ density, blockedExits, redirectFlow });
  };

  const handleReset = () => {
    setDensity(50);
    setBlockedExits(0);
    setRedirectFlow(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl"
          >
            <div className="glass-effect rounded-2xl p-8 shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">What-If Scenario</h2>
                  <p className="text-sm text-gray-500">Adjust parameters and predict outcomes</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Controls */}
              <div className="space-y-6 mb-6">
                {/* Density Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-gray-700">Crowd Density</label>
                    <span className="text-primary font-bold">{density}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={density}
                    onChange={(e) => setDensity(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Empty</span>
                    <span>Critical</span>
                  </div>
                </div>

                {/* Blocked Exits */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-semibold text-gray-700">Blocked Exits</label>
                    <span className="text-danger font-bold">{blockedExits}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={blockedExits}
                    onChange={(e) => setBlockedExits(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-danger"
                  />
                </div>

                {/* Redirect Flow Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <h4 className="font-semibold text-gray-800">Enable Crowd Redirection</h4>
                    <p className="text-sm text-gray-500">Simulate automatic flow control</p>
                  </div>
                  <label className="relative inline-block w-14 h-8">
                    <input
                      type="checkbox"
                      checked={redirectFlow}
                      onChange={(e) => setRedirectFlow(e.target.checked)}
                      className="opacity-0 w-0 h-0 peer"
                    />
                    <span className="absolute cursor-pointer inset-0 bg-gray-300 rounded-full transition peer-checked:bg-primary">
                      <span className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform peer-checked:translate-x-6"></span>
                    </span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
                <button
                  onClick={handleRun}
                  className="flex-1 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Run Simulation
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default WhatIfModal;
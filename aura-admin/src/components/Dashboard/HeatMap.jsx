import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import { RISK_LEVELS } from '../../utils/constants';

const HeatMap = ({ zones = [] }) => {
  const center = [12.9716, 77.5946]; // Bangalore coordinates

  const getRiskColor = (risk) => {
    if (risk < 0.3) return RISK_LEVELS.LOW.color;
    if (risk < 0.6) return RISK_LEVELS.MEDIUM.color;
    return RISK_LEVELS.HIGH.color;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="glass-effect rounded-2xl p-6 shadow-lg h-[600px]"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Live Heat Map</h2>
        <div className="flex gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span className="text-xs text-gray-600">Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span className="text-xs text-gray-600">Moderate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-danger"></div>
            <span className="text-xs text-gray-600">Critical</span>
          </div>
        </div>
      </div>

      <div className="h-[calc(100%-60px)] rounded-xl overflow-hidden">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="rounded-xl"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          
          {zones.map((zone) => (
            <Circle
              key={zone.id}
              center={[zone.lat || center[0], zone.lng || center[1]]}
              radius={200 + zone.density / 10}
              pathOptions={{
                fillColor: getRiskColor(zone.risk),
                color: getRiskColor(zone.risk),
                fillOpacity: 0.5,
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg mb-2">{zone.name}</h3>
                  <p className="text-sm"><strong>Density:</strong> {Math.round(zone.density)} people</p>
                  <p className="text-sm"><strong>CPI:</strong> {zone.cpi.toFixed(1)}</p>
                  <p className="text-sm"><strong>Risk:</strong> {(zone.risk * 100).toFixed(0)}%</p>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>
      </div>
    </motion.div>
  );
};

export default HeatMap;
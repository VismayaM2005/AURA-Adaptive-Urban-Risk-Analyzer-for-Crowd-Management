export const RISK_LEVELS = {
  LOW: { color: '#10b981', label: 'Safe', threshold: 0.3 },
  MEDIUM: { color: '#f59e0b', label: 'Moderate', threshold: 0.6 },
  HIGH: { color: '#ef4444', label: 'Critical', threshold: 1.0 },
};

export const ZONES = [
  { id: 'Z1', name: 'Main Entrance', lat: 12.9716, lng: 77.5946 },
  { id: 'Z2', name: 'Food Court', lat: 12.9726, lng: 77.5956 },
  { id: 'Z3', name: 'Stage Area', lat: 12.9706, lng: 77.5936 },
  { id: 'Z4', name: 'Exit Gate', lat: 12.9696, lng: 77.5926 },
];

export const DRILL_SCENARIOS = [
  { id: 'evacuation', name: 'Full Evacuation', icon: '🚨' },
  { id: 'gate_block', name: 'Gate Blockage', icon: '🚧' },
  { id: 'surge', name: 'Crowd Surge', icon: '⚠️' },
];

export const API_ENDPOINTS = {
  METRICS: '/api/metrics',
  SIMULATION: '/api/simulation',
  ALERTS: '/api/alerts',
  COMMANDS: '/api/commands',
};
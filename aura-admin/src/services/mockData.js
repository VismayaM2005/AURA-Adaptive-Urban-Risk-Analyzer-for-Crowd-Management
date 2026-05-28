// Mock data generator for development
export const generateMockMetrics = () => ({
  zones: [
    {
      id: 'Z1',
      name: 'Main Entrance',
      cpi: Math.random() * 100,
      elbs: Math.random() * 10,
      density: Math.random() * 5000,
      risk: Math.random(),
      huddles: Math.floor(Math.random() * 5),
    },
    {
      id: 'Z2',
      name: 'Food Court',
      cpi: Math.random() * 100,
      elbs: Math.random() * 10,
      density: Math.random() * 3000,
      risk: Math.random(),
      huddles: Math.floor(Math.random() * 3),
    },
    {
      id: 'Z3',
      name: 'Stage Area',
      cpi: Math.random() * 100,
      elbs: Math.random() * 10,
      density: Math.random() * 8000,
      risk: Math.random(),
      huddles: Math.floor(Math.random() * 7),
    },
  ],
  totalBeacons: 276,
  overcrowdedZones: 34,
  visitorCount: 23364,
  alerts: [
    {
      id: 1,
      zone: 'Z3',
      type: 'HIGH_RISK',
      message: 'Critical density in Stage Area',
      timestamp: new Date(),
    },
  ],
});

export const generateTimeSeriesData = () => {
  const data = [];
  for (let i = 0; i < 20; i++) {
    data.push({
      time: `${i}:00`,
      cpi: Math.random() * 100,
      elbs: Math.random() * 10,
      density: Math.random() * 5000,
    });
  }
  return data;
};

// NEW: Analytics Mock Data
export const generateAnalyticsData = () => {
  // Overview Stats
  const overviewStats = {
    peakDensity: 8547,
    peakDensityTime: '2:30 PM',
    highRiskAlerts: 23,
    avgClearTime: 12, // minutes
    totalVisitorsToday: 45678,
    predictedPeakTime: '6:45 PM',
    predictedPeakDensity: 9200
  };

  // Crowd Density Over Time (Last 12 hours)
  const densityOverTime = [];
  const zones = ['Main Entrance', 'Food Court', 'Stage Area', 'Exit Gate A', 'Parking Zone'];
  const currentHour = new Date().getHours();
  
  for (let i = 12; i >= 0; i--) {
    const hour = (currentHour - i + 24) % 24;
    const timeLabel = `${hour}:00`;
    
    const dataPoint = {
      time: timeLabel,
      'Main Entrance': 2000 + Math.random() * 3000,
      'Food Court': 1500 + Math.random() * 2000,
      'Stage Area': 3000 + Math.random() * 5000,
      'Exit Gate A': 1000 + Math.random() * 2500,
      'Parking Zone': 500 + Math.random() * 1500,
    };
    densityOverTime.push(dataPoint);
  }

  // Risk Level Timeline (Last 12 hours)
  const riskTimeline = [];
  for (let i = 12; i >= 0; i--) {
    const hour = (currentHour - i + 24) % 24;
    const riskLevel = Math.random();
    riskTimeline.push({
      time: `${hour}:00`,
      risk: riskLevel < 0.3 ? 'safe' : riskLevel < 0.6 ? 'warning' : 'danger',
      riskValue: riskLevel
    });
  }

  // Zone-Wise Analytics Table
  const zoneAnalytics = [
    {
      zone: 'Main Entrance',
      avgDensity: 3245,
      peakDensity: 4890,
      avgCPI: 67.5,
      riskScore: 0.62,
      dangerTime: 45
    },
    {
      zone: 'Food Court',
      avgDensity: 2134,
      peakDensity: 3210,
      avgCPI: 52.3,
      riskScore: 0.41,
      dangerTime: 23
    },
    {
      zone: 'Stage Area',
      avgDensity: 5678,
      peakDensity: 8547,
      avgCPI: 84.2,
      riskScore: 0.87,
      dangerTime: 78
    },
    {
      zone: 'Exit Gate A',
      avgDensity: 1876,
      peakDensity: 2954,
      avgCPI: 48.9,
      riskScore: 0.38,
      dangerTime: 18
    },
    {
      zone: 'Parking Zone',
      avgDensity: 987,
      peakDensity: 1654,
      avgCPI: 28.4,
      riskScore: 0.19,
      dangerTime: 5
    }
  ];

  // AI Predictions
  const aiPredictions = {
    nextCongestionZone: 'Stage Area',
    nextCongestionTime: '30 minutes',
    expectedLoad: 7800,
    riskForecast: 'high',
    recommendedAction: 'Deploy additional staff to Zone 3 and open emergency exit B'
  };

  // Incident History (Alerts per hour)
  const incidentHistory = [];
  for (let i = 12; i >= 0; i--) {
    const hour = (currentHour - i + 24) % 24;
    incidentHistory.push({
      time: `${hour}:00`,
      high: Math.floor(Math.random() * 5),
      medium: Math.floor(Math.random() * 8),
      low: Math.floor(Math.random() * 10),
      resolved: Math.floor(Math.random() * 15)
    });
  }

  // Zone Movement Flow
  const movementFlow = [
    { from: 'Main Entrance', to: 'Food Court', count: 4523 },
    { from: 'Main Entrance', to: 'Stage Area', count: 6789 },
    { from: 'Food Court', to: 'Stage Area', count: 3421 },
    { from: 'Food Court', to: 'Exit Gate A', count: 2345 },
    { from: 'Stage Area', to: 'Exit Gate A', count: 8901 },
    { from: 'Stage Area', to: 'Parking Zone', count: 1234 },
  ];
  
  return {
    overviewStats,
    densityOverTime,
    riskTimeline,
    zoneAnalytics,
    aiPredictions,
    incidentHistory,
    movementFlow
  };
};
// Add to existing mockData.js

// Drill Mode Simulation Data
export const generateDrillSimulation = (scenario) => {
  const baseZones = [
    { zone_id: 1, zone_name: 'Main Entrance', density_before: 2500, risk_before: 0.35 },
    { zone_id: 2, zone_name: 'Food Court', density_before: 1800, risk_before: 0.28 },
    { zone_id: 3, zone_name: 'Stage Area', density_before: 4200, risk_before: 0.55 },
    { zone_id: 4, zone_name: 'Exit Gate A', density_before: 1300, risk_before: 0.22 },
    { zone_id: 5, zone_name: 'Parking Zone', density_before: 900, risk_before: 0.15 }
  ];

  let affectedZones = [];
  let triggeredAlerts = [];

  switch (scenario) {
    case 'gate_blockage':
      affectedZones = [
        {
          ...baseZones[3],
          density_now: 4200,
          risk_now: 0.85,
          affected: true
        },
        {
          ...baseZones[2],
          density_now: 6800,
          risk_now: 0.78,
          affected: true
        },
        ...baseZones.slice(0, 2).map(z => ({ ...z, density_now: z.density_before, risk_now: z.risk_before, affected: false })),
        { ...baseZones[4], density_now: baseZones[4].density_before, risk_now: baseZones[4].risk_before, affected: false }
      ];
      
      triggeredAlerts = [
        {
          id: Date.now(),
          zone: 'Exit Gate A',
          severity: 'high',
          message: 'Gate blockage detected - Crowd pressure rising rapidly',
          timestamp: new Date().toISOString(),
          icon: '🚧'
        },
        {
          id: Date.now() + 1,
          zone: 'Stage Area',
          severity: 'high',
          message: 'Congestion spillover from blocked exit',
          timestamp: new Date().toISOString(),
          icon: '⚠️'
        }
      ];
      break;

    case 'mass_influx':
      affectedZones = [
        {
          ...baseZones[0],
          density_now: 7500,
          risk_now: 0.92,
          affected: true
        },
        {
          ...baseZones[1],
          density_now: 4200,
          risk_now: 0.68,
          affected: true
        },
        ...baseZones.slice(2).map(z => ({ ...z, density_now: z.density_before * 1.3, risk_now: z.risk_before * 1.4, affected: true }))
      ];
      
      triggeredAlerts = [
        {
          id: Date.now(),
          zone: 'Main Entrance',
          severity: 'high',
          message: 'Sudden mass influx detected - Entry bottleneck forming',
          timestamp: new Date().toISOString(),
          icon: '👥'
        },
        {
          id: Date.now() + 1,
          zone: 'Food Court',
          severity: 'medium',
          message: 'Crowd overflow from entrance area',
          timestamp: new Date().toISOString(),
          icon: '⚠️'
        }
      ];
      break;

    case 'evacuation':
      affectedZones = baseZones.map((z, idx) => ({
        ...z,
        density_now: z.density_before * 1.5,
        risk_now: Math.min(z.risk_before * 2, 0.95),
        affected: true
      }));
      
      triggeredAlerts = [
        {
          id: Date.now(),
          zone: 'All Zones',
          severity: 'high',
          message: 'Controlled evacuation initiated - All exits activated',
          timestamp: new Date().toISOString(),
          icon: '🚪'
        },
        {
          id: Date.now() + 1,
          zone: 'Exit Gate A',
          severity: 'medium',
          message: 'High evacuation flow - Monitor for bottlenecks',
          timestamp: new Date().toISOString(),
          icon: '🚨'
        }
      ];
      break;

    case 'stampede':
      affectedZones = [
        {
          ...baseZones[2],
          density_now: 8900,
          risk_now: 0.98,
          affected: true
        },
        {
          ...baseZones[3],
          density_now: 5400,
          risk_now: 0.88,
          affected: true
        },
        ...baseZones.slice(0, 2).map(z => ({ ...z, density_now: z.density_before * 1.2, risk_now: z.risk_before * 1.3, affected: false })),
        { ...baseZones[4], density_now: baseZones[4].density_before, risk_now: baseZones[4].risk_before, affected: false }
      ];
      
      triggeredAlerts = [
        {
          id: Date.now(),
          zone: 'Stage Area',
          severity: 'high',
          message: 'CRITICAL: High-speed movement + compression detected',
          timestamp: new Date().toISOString(),
          icon: '⚠️'
        },
        {
          id: Date.now() + 1,
          zone: 'Exit Gate A',
          severity: 'high',
          message: 'Stampede risk - Immediate intervention required',
          timestamp: new Date().toISOString(),
          icon: '🚨'
        }
      ];
      break;

    default:
      affectedZones = baseZones.map(z => ({ ...z, density_now: z.density_before, risk_now: z.risk_before, affected: false }));
      triggeredAlerts = [];
  }

  return {
    affectedZones,
    triggeredAlerts,
    scenario,
    timestamp: new Date().toISOString()
  };
};
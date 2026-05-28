import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const IncidentTimeline = ({ incidents = [] }) => {
  const defaultIncidents = [
    {
      id: 1,
      zone: 'Zone 3',
      type: 'crowd_surge',
      severity: 'high',
      description: 'Sudden crowd surge detected near stage area',
      status: 'active',
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      zone: 'Zone 1',
      type: 'gate_blockage',
      severity: 'medium',
      description: 'Main entrance temporarily blocked',
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 1800000).toISOString(),
    },
  ];

  const displayIncidents = incidents.length > 0 ? incidents : defaultIncidents;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <AlertTriangle className="w-5 h-5 text-danger" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <Clock className="w-5 h-5 text-warning" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'bg-danger/10 border-danger text-danger';
      case 'medium':
        return 'bg-warning/10 border-warning text-warning';
      default:
        return 'bg-primary/10 border-primary text-primary';
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    return `${diffHours} hours ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-2xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Incident Timeline</h2>
        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
          {displayIncidents.filter(i => i.status === 'active').length} Active
        </span>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {displayIncidents.map((incident, index) => (
          <motion.div
            key={incident.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative pl-8 pb-4 ${
              index !== displayIncidents.length - 1 ? 'border-l-2 border-gray-200' : ''
            }`}
          >
            {/* Timeline Dot */}
            <div className="absolute left-0 top-0 transform -translate-x-1/2">
              <div className={`p-2 rounded-full bg-white shadow-lg ${
                incident.status === 'active' ? 'ring-2 ring-danger animate-pulse' : ''
              }`}>
                {getStatusIcon(incident.status)}
              </div>
            </div>

            {/* Content */}
            <div className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-gray-800">{incident.zone}</h4>
                  <p className="text-sm text-gray-600">{incident.description}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(incident.severity)}`}>
                  {incident.severity}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{getTimeAgo(incident.created_at)}</span>
                {incident.status === 'resolved' && (
                  <span className="text-success font-semibold">✓ Resolved</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default IncidentTimeline;
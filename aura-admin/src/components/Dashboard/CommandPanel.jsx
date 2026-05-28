/*import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Navigation, DoorOpen, AlertCircle } from 'lucide-react';

const CommandPanel = ({ recommendations = [] }) => {
  const defaultRecommendations = [
    {
      id: 1,
      type: 'routing',
      icon: Navigation,
      title: 'Redirect Traffic',
      description: 'Route crowds from Zone 3 to Zone 1',
      priority: 'high',
    },
    {
      id: 2,
      type: 'exit',
      icon: DoorOpen,
      title: 'Open Additional Exits',
      description: 'Activate emergency exits in Stage Area',
      priority: 'medium',
    },
    {
      id: 3,
      type: 'alert',
      icon: AlertCircle,
      title: 'Issue Warning',
      description: 'Send alert to overcrowded zones',
      priority: 'low',
    },
  ];

  const displayRecommendations = recommendations.length > 0 ? recommendations : defaultRecommendations;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-danger bg-red-50';
      case 'medium':
        return 'border-l-warning bg-yellow-50';
      default:
        return 'border-l-primary bg-blue-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-effect rounded-2xl p-6 shadow-lg"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">AI Recommendations</h2>
        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
          Live
        </span>
      </div>

      <div className="space-y-4">
        {displayRecommendations.map((rec, index) => {
          const Icon = rec.icon;
          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border-l-4 ${getPriorityColor(rec.priority)} transition-all hover:shadow-md cursor-pointer group`}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Icon className="w-5 h-5 text-gray-700" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1">{rec.title}</h4>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
                <button className="p-2 rounded-lg bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-primary hover:text-white">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <button className="w-full mt-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold hover:shadow-lg transition-all">
        View All Recommendations
      </button>
    </motion.div>
  );
};

export default CommandPanel;
*/
export default function CommandPanel() {
  return null;
}

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const TrendChart = ({ data = [], title = 'Trends' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-effect rounded-2xl p-6 shadow-lg"
    >
      <h2 className="text-xl font-bold text-gray-800 mb-6">{title}</h2>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="time" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          />
          <Legend 
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '14px',
            }}
          />
          <Line 
            type="monotone" 
            dataKey="cpi" 
            stroke="#6366f1" 
            strokeWidth={3}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6 }}
            name="CPI"
          />
          <Line 
            type="monotone" 
            dataKey="elbs" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="ELBS"
          />
          <Line 
            type="monotone" 
            dataKey="density" 
            stroke="#f59e0b" 
            strokeWidth={3}
            dot={{ fill: '#f59e0b', r: 4 }}
            activeDot={{ r: 6 }}
            name="Density"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export default TrendChart;
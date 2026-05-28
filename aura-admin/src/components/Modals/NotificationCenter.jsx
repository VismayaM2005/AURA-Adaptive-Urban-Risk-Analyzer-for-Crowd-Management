import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle, AlertTriangle, Info, Trash2, Check } from 'lucide-react';
import { markNotificationRead } from '../../services/auth';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const NotificationCenter = ({ isOpen, onClose, notifications, onRefresh }) => {
  const { token } = useAuth();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'HIGH_RISK':
      case 'CRITICAL':
        return <AlertTriangle className="w-5 h-5 text-danger" />;
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'INFO':
        return <Info className="w-5 h-5 text-primary" />;
      default:
        return <Bell className="w-5 h-5 text-warning" />;
    }
  };

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

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId, token);
      onRefresh();
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      for (const notification of notifications.filter(n => !n.read)) {
        await markNotificationRead(notification.id, token);
      }
      onRefresh();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffMs = now - notifTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
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
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-full max-w-md z-50"
          >
            <div className="glass-effect h-full shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-lg">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
                      <p className="text-sm text-gray-500">
                        {notifications.filter(n => !n.read).length} unread
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                {notifications.filter(n => !n.read).length > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="w-full py-2 px-4 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto p-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-xl border-l-4 ${getPriorityColor(notification.priority)} ${
                          notification.read ? 'opacity-60' : ''
                        } transition-all hover:shadow-md group`}
                      >
                        <div className="flex items-start gap-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-semibold text-gray-800 text-sm">
                                {notification.title}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {getTimeAgo(notification.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            {notification.zone && (
                              <span className="inline-block px-2 py-1 bg-white rounded text-xs font-semibold text-gray-700">
                                Zone: {notification.zone}
                              </span>
                            )}
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded transition"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4 text-success" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationCenter;
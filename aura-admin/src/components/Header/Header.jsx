import React, { useState, useEffect } from "react";
import { Bell, User, LogOut, ChevronDown, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import NotificationCenter from "../Modals/NotificationCenter";
import { getNotifications } from "../../services/auth";

const Header = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user && token) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, token]);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications(user.id, token);
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="glass-effect rounded-2xl p-6 mb-6 shadow-lg relative overflow-visible z-50">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-purple-500/5 animate-pulse rounded-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <motion.div
              className="flex items-center gap-4 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate("/dashboard")}
            >
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-xl">
                  <motion.span
                    className="text-white font-bold text-3xl"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    A
                  </motion.span>
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-white"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-purple-600 bg-clip-text text-transparent">
                  AURA
                </h1>
                <p className="text-sm text-gray-600 font-semibold">
                  AI-Powered Crowd Management
                </p>
              </div>
            </motion.div>

            <div className="flex items-center gap-4">
              <div className="px-6 py-3 bg-white/50 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-500 font-semibold">
                  CURRENT TIME
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="f lex items-center gap-4">
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 pl-4 border-l-2 border-gray-200 transition"
                >
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-800">
                      {user?.username || "Admin"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email || "admin@aura.com"}
                    </p>
                  </div>
                  <div className="w-11 h-11 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      showProfileMenu ? "rotate-180" : ""
                    }`}
                  />
                </motion.button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowProfileMenu(false)}
                      />

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-56 glass-effect rounded-xl shadow-2xl overflow-hidden border border-gray-200 z-50"
                      >
                        <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-secondary/5">
                          <p className="font-bold text-gray-800 text-sm">
                            {user?.username}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </p>
                        </div>

                        <div className="p-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-50 transition text-left text-danger"
                          >
                            <LogOut className="w-5 h-5" />
                            <span className="font-semibold text-sm">
                              Logout
                            </span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs text-gray-600">All Systems Active</span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs text-gray-600">
                Real-time Monitoring
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-warning rounded-full animate-pulse" />
              <span className="text-xs text-gray-600">AI Analytics Active</span>
            </div>
          </div>
        </div>
      </header>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onRefresh={loadNotifications}
      />
    </>
  );
};

export default Header;

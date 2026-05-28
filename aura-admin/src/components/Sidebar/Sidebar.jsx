import React from "react";
import {
  LayoutDashboard,
  Map,
  AlertTriangle,
  TrendingUp,
  //Settings,
  Play,
  Zap,
  CheckCircle,
} from "lucide-react";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "alerts", icon: AlertTriangle, label: "Alerts" },
    { id: "analytics", icon: TrendingUp, label: "Analytics" },
    //{ id: "approved-routes", icon: CheckCircle, label: "Approved Routes" },
    // { id: 'drill', icon: Zap, label: 'Drill Mode' },
    { id: "playback", icon: Play, label: "Playback" },
    //{ id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="glass-effect rounded-2xl p-4 shadow-lg h-fit sticky top-6">
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Activity, 
  UtensilsCrossed, 
  MessageCircle, 
  Users, 
  Bell,
  User,
  Crown
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/records', icon: FileText, label: 'Health Records' },
    { path: '/fitness', icon: Activity, label: 'Fitness Tracker' },
    { path: '/diet', icon: UtensilsCrossed, label: 'Diet Planner' },
    { path: '/coaching', icon: MessageCircle, label: 'AI Coach' },
    { path: '/community', icon: Users, label: 'Community' },
    { path: '/reminders', icon: Bell, label: 'Reminders' },
    { path: '/subscription', icon: Crown, label: 'Subscription' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-4rem)] sticky top-16">
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-sm mb-1 text-gray-900 dark:text-gray-100">
            Need Help?
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Chat with our AI Health Coach anytime
          </p>
          <button className="w-full bg-primary-600 text-white text-sm py-2 rounded-lg hover:bg-primary-700 transition">
            Start Chatting
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

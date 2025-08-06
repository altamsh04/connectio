import React from 'react';
import AppCard from './AppCard';
import { Clock } from 'lucide-react';

const AppsGrid = ({ apps, connectedApps, onToggleApp }) => {
  const availableApps = apps.filter(app => !app.comingSoon);
  const comingSoonApps = apps.filter(app => app.comingSoon);

  return (
    <div className="w-full space-y-6">
      {/* Available Apps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableApps.map((app) => (
          <AppCard
            key={app.id}
            app={app}
            isConnected={connectedApps.has(app.id)}
            onToggle={() => onToggleApp(app.id)}
          />
        ))}
      </div>

      {/* Coming Soon Section */}
      {comingSoonApps.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
            <Clock size={16} className="text-gray-500" />
            <h2 className="text-sm font-medium text-gray-500">Coming Soon</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comingSoonApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                isConnected={connectedApps.has(app.id)}
                onToggle={() => onToggleApp(app.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AppsGrid;

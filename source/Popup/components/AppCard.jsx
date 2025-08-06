import React from 'react';
import { Plus, Check, ExternalLink, Clock } from 'lucide-react';

const AppCard = ({ app, isConnected, onToggle }) => {
  const isComingSoon = app.comingSoon;
  
  return (
    <div className={`app-card ${isComingSoon ? 'coming-soon' : ''}`} onClick={!isComingSoon ? onToggle : undefined}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center flex-grow min-w-0 mr-3">
          <img 
            src={app.logo} 
            alt={`${app.name} logo`} 
            className={`w-12 h-12 rounded-lg object-cover bg-gray-50 border border-gray-200 flex-shrink-0 ${isComingSoon ? 'opacity-50' : ''}`}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div 
            className={`hidden w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 items-center justify-center text-lg text-gray-500 flex-shrink-0 ${isComingSoon ? 'opacity-50' : ''}`}
          >
            {app.name.charAt(0)}
          </div>
          <div className="ml-3 min-w-0 flex-grow">
            <div className="flex items-center gap-1">
              <h3 className={`text-base font-semibold truncate ${isComingSoon ? 'text-gray-500' : 'text-gray-800'}`}>
                {app.name}
              </h3>
              <ExternalLink size={12} className={`flex-shrink-0 ${isComingSoon ? 'text-gray-300' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>
        {isComingSoon ? (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium flex-shrink-0">
            <Clock size={12} />
            Coming Soon
          </div>
        ) : (
          <button 
            className={`add-button ${isConnected ? 'added' : ''} flex-shrink-0`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isConnected ? <Check size={16} /> : <Plus size={16} />}
          </button>
        )}
      </div>
      <p className={`text-sm leading-relaxed line-clamp-3 pl-15 ${isComingSoon ? 'text-gray-400' : 'text-gray-600'}`}>
        {app.description}
      </p>
    </div>
  );
};

export default AppCard;


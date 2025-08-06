import * as React from 'react';

import './tailwind.css';

const Options = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 min-h-screen">
      <div className="bg-white rounded-3xl p-8 shadow-2xl backdrop-blur-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Connect.IO Settings</h1>
        <form className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="username"
              name="username"
              spellCheck="false"
              autoComplete="off"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
            />
          </div>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              id="logging" 
              name="logging"
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="logging" className="ml-3 text-sm text-gray-700">
              Show the features enabled on each page in the console
            </label>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Options;

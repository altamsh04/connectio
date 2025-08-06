import React from 'react';
import { Loader2 } from 'lucide-react';

const SaveLoader = ({ message }) => (
  <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#e23744', color: 'white', padding: '10px 20px', borderRadius: '8px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '10px' }}>
    <Loader2 className="animate-spin" size={20} />
    {message}
  </div>
);

export default SaveLoader;
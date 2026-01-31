import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ isActive }) => {
  const bars = 5;
  
  return (
    <div className="flex items-center justify-center space-x-2 h-16">
      {isActive ? (
        Array.from({ length: bars }).map((_, i) => (
          <div
            key={i}
            className="w-3 bg-blue-500 rounded-full animate-pulse"
            style={{
              height: '100%',
              animationDuration: `${0.4 + i * 0.1}s`,
              animationIterationCount: 'infinite'
            }}
          />
        ))
      ) : (
        <div className="text-slate-400 font-medium text-sm">Waiting for input...</div>
      )}
    </div>
  );
};

export default Visualizer;
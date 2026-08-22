import React from 'react';

interface ParticleBackgroundProps {
  theme?: 'hh-goa' | 'rose-white';
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  theme = 'hh-goa',
}) => {
  const isHHGoa = theme === 'hh-goa';

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {isHHGoa ? (
        /* Authentic HH Goa Tropical Sun & Ocean Horizon */
        <div className="relative w-full h-full">
          {/* Golden Rising Sun Ambient Halo at top center */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#ffe600]/15 blur-[120px] pointer-events-none" />

          {/* Tropical Palm Wave Flares */}
          <div className="absolute top-1/4 -right-32 w-96 h-96 rounded-full bg-[#007a48]/40 blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 -left-32 w-96 h-96 rounded-full bg-[#ff0080]/10 blur-3xl pointer-events-none" />

          {/* Clean Subtle Ocean Horizon Line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#ffe600]/30 to-transparent" />
        </div>
      ) : (
        /* Soft Rose Pearl Ambient Halo */
        <div className="relative w-full h-full">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-[#ff70a6]/15 blur-[110px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#ffb7c5]/25 blur-3xl pointer-events-none" />
        </div>
      )}
    </div>
  );
};

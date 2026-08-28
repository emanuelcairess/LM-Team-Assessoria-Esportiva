import React from 'react';

interface TeamLmBrandProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  className?: string;
  animated?: boolean;
}

export const TeamLmBrand: React.FC<TeamLmBrandProps> = ({
  size = 'md',
  showText = true,
  className = '',
  animated = false
}) => {
  // Dimension definitions
  const dimensions = {
    xs: { icon: 28, textMain: 'text-xs font-black', textSub: 'text-[8px] tracking-wider' },
    sm: { icon: 40, textMain: 'text-sm font-black', textSub: 'text-[9px] tracking-widest' },
    md: { icon: 56, textMain: 'text-lg font-black', textSub: 'text-[10px] tracking-widest' },
    lg: { icon: 76, textMain: 'text-2xl font-black', textSub: 'text-xs tracking-widest' },
    xl: { icon: 96, textMain: 'text-3xl font-black', textSub: 'text-sm tracking-widest' },
    '2xl': { icon: 140, textMain: 'text-4xl font-black', textSub: 'text-base tracking-widest' }
  };

  const dim = dimensions[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* 3D Carbon & Gold Lion Emblem Badge */}
      <div
        className={`relative shrink-0 rounded-2xl md:rounded-[24%] overflow-hidden shadow-2xl transition-transform duration-300 ${
          animated ? 'hover:scale-105 active:scale-95' : ''
        }`}
        style={{
          width: dim.icon,
          height: dim.icon,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.6), 0 0 20px rgba(234,179,8,0.2)'
        }}
      >
        <svg
          viewBox="0 0 512 512"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Carbon Fiber Twill Weave Pattern (Diagonal Ribbed Texture) */}
            <pattern id="carbonDiagonalBrand" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="16" height="16" fill="#06070a" />
              <line x1="0" y1="0" x2="0" y2="16" stroke="#12151d" strokeWidth="4" />
              <line x1="8" y1="0" x2="8" y2="16" stroke="#1c212c" strokeWidth="4" />
              <line x1="4" y1="0" x2="4" y2="16" stroke="#0b0e14" strokeWidth="2" opacity="0.8" />
              <line x1="12" y1="0" x2="12" y2="16" stroke="#252b39" strokeWidth="2" opacity="0.5" />
            </pattern>

            {/* Organic Tactile Carbon Rib Overlay */}
            <linearGradient id="carbonGleamBrand" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e2430" stopOpacity="0.6" />
              <stop offset="30%" stopColor="#090b10" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#040507" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#141822" stopOpacity="0.7" />
            </linearGradient>

            {/* Luxury 3D Gold Gradient */}
            <linearGradient id="gold3dBrand" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="12%" stopColor="#fff8db" />
              <stop offset="28%" stopColor="#fef08a" />
              <stop offset="48%" stopColor="#eab308" />
              <stop offset="68%" stopColor="#ca8a04" />
              <stop offset="88%" stopColor="#9a5b08" />
              <stop offset="100%" stopColor="#673905" />
            </linearGradient>

            {/* Gold Light Facet */}
            <linearGradient id="goldLightBrand" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fffbeb" />
              <stop offset="40%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>

            {/* Gold Deep Shadow for Carved Facets */}
            <linearGradient id="goldDeepShadowBrand" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#854d0e" />
              <stop offset="50%" stopColor="#542e07" />
              <stop offset="100%" stopColor="#1e0f02" />
            </linearGradient>

            {/* Specular Liquid Glass Highlight */}
            <linearGradient id="glassSweepBrand" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
              <stop offset="35%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Radial Gold Ambient Backlight */}
            <radialGradient id="centerGlowBrand" cx="50%" cy="36%" r="55%">
              <stop offset="0%" stopColor="#eab308" stopOpacity="0.2" />
              <stop offset="40%" stopColor="#ca8a04" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
            </radialGradient>

            <filter id="dropShadowBrand" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#000000" floodOpacity="0.95" />
              <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.8" />
            </filter>

            <filter id="textDropShadowBrand" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000000" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* Squircle Card Container */}
          <rect width="512" height="512" rx="118" fill="url(#carbonDiagonalBrand)" />
          <rect width="512" height="512" rx="118" fill="url(#carbonGleamBrand)" />
          <rect width="512" height="512" rx="118" fill="url(#centerGlowBrand)" />

          {/* Outer Border Bevel */}
          <rect
            x="6"
            y="6"
            width="500"
            height="500"
            rx="114"
            fill="none"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="3"
          />
          <rect
            x="14"
            y="14"
            width="484"
            height="484"
            rx="106"
            fill="none"
            stroke="url(#gold3dBrand)"
            strokeWidth="1.2"
            strokeOpacity="0.3"
          />

          {/* Sculpted 3D Golden Lion Profile */}
          <g filter="url(#dropShadowBrand)">
            {/* Base 3D Cast Shadow Volume */}
            <path
              d="M256 68 C294 68 328 88 344 120 C358 104 378 98 396 104 C384 128 388 148 402 160 C420 148 440 156 446 176 C428 194 432 218 448 230 C430 248 424 272 418 296 C392 284 374 290 362 308 C340 274 304 262 278 262 C252 226 222 202 188 190 C206 166 214 144 206 118 C224 108 242 88 256 68 Z"
              fill="url(#goldDeepShadowBrand)"
              transform="translate(0, 4)"
            />

            {/* Outer Mane Tufts and Flow */}
            <path
              d="M256 68 C294 68 328 88 344 120 C358 104 378 98 396 104 C384 128 388 148 402 160 C420 148 440 156 446 176 C428 194 432 218 448 230 C430 248 424 272 418 296 C392 284 374 290 362 308 C340 274 304 262 278 262 C252 226 222 202 188 190 C206 166 214 144 206 118 C224 108 242 88 256 68 Z"
              fill="url(#gold3dBrand)"
            />

            {/* Carved Inner Mane Strands */}
            <path
              d="M256 68 C226 104 214 146 196 186 C220 174 244 178 262 196 C244 156 262 116 292 90 Z"
              fill="url(#goldDeepShadowBrand)"
              opacity="0.9"
            />
            <path
              d="M256 68 C268 94 286 118 316 132 C298 108 280 88 256 68 Z"
              fill="url(#goldLightBrand)"
            />

            <path
              d="M318 88 C306 122 318 152 348 170 C330 142 342 120 364 108 Z"
              fill="url(#goldLightBrand)"
            />
            <path
              d="M344 120 C332 152 342 182 372 194 C354 172 366 148 384 142 Z"
              fill="url(#goldDeepShadowBrand)"
              opacity="0.8"
            />

            <path
              d="M370 160 C358 188 366 216 396 228 C380 208 388 186 406 180 Z"
              fill="url(#goldDeepShadowBrand)"
              opacity="0.75"
            />
            <path
              d="M388 202 C376 230 382 254 410 264 C396 246 402 226 418 222 Z"
              fill="url(#goldDeepShadowBrand)"
              opacity="0.7"
            />

            <path
              d="M262 196 C238 232 232 268 258 298 C252 264 266 236 286 220 Z"
              fill="url(#goldDeepShadowBrand)"
              opacity="0.85"
            />
            <path
              d="M286 220 C272 252 280 282 308 304 C296 276 306 250 326 236 Z"
              fill="url(#goldLightBrand)"
            />
            <path
              d="M326 236 C314 266 322 292 348 308 C336 282 344 260 362 250 Z"
              fill="url(#goldDeepShadowBrand)"
              opacity="0.75"
            />

            {/* Lion Face Profile */}
            <path
              d="M340 148 C366 148 396 160 414 178 C432 196 442 220 444 244 C426 238 412 244 402 256 C390 238 372 230 360 244 C346 220 334 188 340 148 Z"
              fill="url(#gold3dBrand)"
            />
            <path
              d="M414 212 C438 214 450 228 450 244 C436 258 424 256 414 250 Z"
              fill="url(#goldLightBrand)"
            />
            <path
              d="M408 242 C422 246 434 260 422 274 C408 266 402 256 408 242 Z"
              fill="url(#goldDeepShadowBrand)"
            />
            <path d="M424 250 L436 252 L428 258 Z" fill="#1a0d02" />

            {/* Eye */}
            <path
              d="M378 174 C388 172 398 176 402 184 C392 186 382 182 378 174 Z"
              fill="#06070a"
            />
            <circle cx="392" cy="180" r="3" fill="#fef08a" />
            <path d="M372 168 C384 164 400 168 408 176" fill="none" stroke="#fffbeb" strokeWidth="2.2" strokeLinecap="round" />

            {/* Ear */}
            <path
              d="M318 132 C332 118 344 124 344 142 C330 144 322 140 318 132 Z"
              fill="url(#goldDeepShadowBrand)"
            />
            <path d="M326 128 C334 124 340 130 340 138" fill="none" stroke="#fef08a" strokeWidth="1.8" />
          </g>

          {/* TEAM LM & CONSULTORIA Typography */}
          <g filter="url(#textDropShadowBrand)">
            <text
              x="170"
              y="384"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="64"
              letterSpacing="5"
              fill="url(#goldDeepShadowBrand)"
            >
              TEAM
            </text>
            <text
              x="366"
              y="384"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="70"
              letterSpacing="4"
              fill="url(#goldDeepShadowBrand)"
            >
              LM
            </text>

            <text
              x="170"
              y="380"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="64"
              letterSpacing="5"
              fill="url(#gold3dBrand)"
            >
              TEAM
            </text>
            <text
              x="366"
              y="380"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="70"
              letterSpacing="4"
              fill="url(#gold3dBrand)"
            >
              LM
            </text>

            <text
              x="256"
              y="432"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="34"
              letterSpacing="9"
              fill="url(#goldDeepShadowBrand)"
            >
              CONSULTORIA
            </text>
            <text
              x="256"
              y="429"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="34"
              letterSpacing="9"
              fill="url(#gold3dBrand)"
            >
              CONSULTORIA
            </text>
          </g>

          {/* Liquid Glass Curved Specular Highlight Reflection */}
          <path
            d="M18 18 C170 18 360 55 450 170 C350 130 170 100 18 260 Z"
            fill="url(#glassSweepBrand)"
            pointerEvents="none"
          />
        </svg>
      </div>

      {/* Brand Text Block (Optional) */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`${dim.textMain} tracking-tight bg-gradient-to-r from-white via-amber-200 to-amber-500 bg-clip-text text-transparent`}
            >
              TEAM LM
            </span>
          </div>
          <span
            className={`${dim.textSub} font-extrabold uppercase text-amber-400/90`}
          >
            Consultoria Esportiva
          </span>
        </div>
      )}
    </div>
  );
};

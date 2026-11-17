export interface AnimatedAvatarItem {
  id: string;
  name: string;
  category: string;
  url: string;
}

function createCyberNinjaSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#140608"/>
        <stop offset="100%" stop-color="#2a080c"/>
      </linearGradient>
      <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2c2d35"/>
        <stop offset="100%" stop-color="#121318"/>
      </linearGradient>
      <linearGradient id="laser" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ff1744" stop-opacity="0.2"/>
        <stop offset="50%" stop-color="#ff1744"/>
        <stop offset="100%" stop-color="#ff5252" stop-opacity="0.2"/>
      </linearGradient>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <style>
        @keyframes scan {
          0%, 100% { transform: translateX(-35px); opacity: 0.7; }
          50% { transform: translateX(35px); opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 2px #ff1744); }
          50% { filter: drop-shadow(0 0 8px #ff1744) drop-shadow(0 0 14px #ff5252); }
        }
        @keyframes breathing {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .scanner { animation: scan 2.6s ease-in-out infinite alternate; }
        .visorGlow { animation: pulseGlow 1.8s ease-in-out infinite; }
        .character { animation: breathing 3s ease-in-out infinite; transform-origin: center bottom; }
      </style>
    </defs>
    <rect width="160" height="160" rx="24" fill="url(#bg)"/>
    <circle cx="80" cy="80" r="68" fill="none" stroke="#e50914" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="6 4"/>
    
    <g class="character">
      <!-- Hood/Cowl -->
      <path d="M42 125 C42 65, 52 35, 80 32 C108 35, 118 65, 118 125 Z" fill="#181920"/>
      <!-- Mask faceplate -->
      <path d="M52 75 L80 62 L108 75 L102 116 L80 126 L58 116 Z" fill="url(#metal)" stroke="#383a45" stroke-width="2"/>
      <!-- Visor Slot -->
      <path d="M56 82 L80 75 L104 82 L100 92 L80 87 L60 92 Z" fill="#08080a" stroke="#ff1744" stroke-width="1.5" class="visorGlow"/>
      <!-- Animated Visor Laser Light -->
      <g clip-path="url(#visorClip)">
        <clipPath id="visorClip">
          <path d="M58 83 L80 76 L102 83 L99 91 L80 86 L61 91 Z"/>
        </clipPath>
        <rect x="70" y="74" width="20" height="20" fill="url(#laser)" class="scanner" filter="url(#glow)"/>
      </g>
      <!-- Face plate vents -->
      <line x1="72" y1="102" x2="88" y2="102" stroke="#e50914" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
      <line x1="75" y1="108" x2="85" y2="108" stroke="#e50914" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
      <line x1="77" y1="113" x2="83" y2="113" stroke="#e50914" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
      <!-- Headband Ribbon Knot -->
      <path d="M48 65 L30 68 L24 85 L35 76 L32 100 L44 72" fill="#e50914" opacity="0.9"/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createCosmicAstroSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="spaceBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0a1226"/>
        <stop offset="100%" stop-color="#02050e"/>
      </linearGradient>
      <linearGradient id="goldVisor" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ffd54f"/>
        <stop offset="40%" stop-color="#ffb300"/>
        <stop offset="100%" stop-color="#ff6f00"/>
      </linearGradient>
      <filter id="visorGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <style>
        @keyframes floatAstro {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-4px) rotate(1.5deg); }
        }
        @keyframes beaconBlink {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.3); filter: drop-shadow(0 0 6px #00e5ff); }
        }
        @keyframes reflectionShine {
          0% { transform: translateX(-40px) skewX(-20deg); opacity: 0; }
          30% { opacity: 0.6; }
          60%, 100% { transform: translateX(80px) skewX(-20deg); opacity: 0; }
        }
        .floating { animation: floatAstro 3.5s ease-in-out infinite; transform-origin: center center; }
        .beacon { animation: beaconBlink 1.4s ease-in-out infinite; transform-origin: 104px 34px; }
        .shine { animation: reflectionShine 3.8s ease-in-out infinite; }
      </style>
    </defs>
    <rect width="160" height="160" rx="24" fill="url(#spaceBg)"/>
    <!-- Distant star dots -->
    <circle cx="30" cy="35" r="1.5" fill="#ffffff" opacity="0.8"/>
    <circle cx="130" cy="45" r="1.2" fill="#00e5ff" opacity="0.6"/>
    <circle cx="25" cy="115" r="1" fill="#ffffff" opacity="0.5"/>
    <circle cx="135" cy="120" r="1.8" fill="#ffd54f" opacity="0.7"/>

    <g class="floating">
      <!-- Antenna with Animated Beacon -->
      <line x1="104" y1="48" x2="104" y2="34" stroke="#78909c" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="104" cy="34" r="3.5" fill="#00e5ff" class="beacon"/>

      <!-- Suit Collar & Neck Ring -->
      <rect x="48" y="118" width="64" height="26" rx="8" fill="#cfd8dc" stroke="#90a4ae" stroke-width="2"/>
      <rect x="58" y="128" width="44" height="6" rx="3" fill="#00e5ff" opacity="0.8"/>

      <!-- Helmet Shell -->
      <circle cx="80" cy="80" r="42" fill="#eceff1" stroke="#b0bec5" stroke-width="3"/>
      
      <!-- Helmet Ear Pods -->
      <rect x="33" y="70" width="7" height="20" rx="3" fill="#78909c"/>
      <rect x="120" y="70" width="7" height="20" rx="3" fill="#78909c"/>

      <!-- Visor Outer Rim -->
      <ellipse cx="80" cy="80" rx="33" ry="27" fill="#263238" stroke="#37474f" stroke-width="2"/>
      <!-- Gold Mirror Visor -->
      <ellipse cx="80" cy="80" rx="30" ry="24" fill="url(#goldVisor)" filter="url(#visorGlow)"/>

      <!-- Animated Visor Shine -->
      <g clip-path="url(#astroVisorClip)">
        <clipPath id="astroVisorClip">
          <ellipse cx="80" cy="80" rx="30" ry="24"/>
        </clipPath>
        <rect x="40" y="55" width="22" height="50" fill="#ffffff" opacity="0.3" class="shine"/>
        <!-- Earth reflection curve inside visor -->
        <ellipse cx="74" cy="92" rx="14" ry="7" fill="#00b0ff" opacity="0.45"/>
      </g>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createNeonSorceressSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="magicBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#190729"/>
        <stop offset="100%" stop-color="#090112"/>
      </linearGradient>
      <linearGradient id="magicGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#e040fb"/>
        <stop offset="100%" stop-color="#7c4dff"/>
      </linearGradient>
      <filter id="runeGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <style>
        @keyframes eyeGlow {
          0%, 100% { filter: drop-shadow(0 0 3px #e040fb); transform: scaleY(1); }
          48% { transform: scaleY(1); }
          50% { transform: scaleY(0.1); }
          52% { transform: scaleY(1); }
          75% { filter: drop-shadow(0 0 7px #e040fb) drop-shadow(0 0 12px #7c4dff); }
        }
        @keyframes runeRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes crownPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        .eyes { animation: eyeGlow 4s ease-in-out infinite; transform-origin: center 84px; }
        .runes { animation: runeRotate 18s linear infinite; transform-origin: 80px 80px; }
        .crown { animation: crownPulse 2.4s ease-in-out infinite; transform-origin: 80px 48px; }
      </style>
    </defs>
    <rect width="160" height="160" rx="24" fill="url(#magicBg)"/>

    <!-- Rotating Mystical Halo / Rune Ring -->
    <g class="runes" opacity="0.35" stroke="url(#magicGlow)" stroke-width="1.5" fill="none">
      <circle cx="80" cy="80" r="64" stroke-dasharray="8 6 2 6"/>
      <polygon points="80,18 134,111 26,111" stroke-width="1"/>
      <polygon points="80,142 134,49 26,49" stroke-width="1"/>
    </g>

    <!-- Sorceress Cowl & Silhouette -->
    <path d="M38 130 C38 68, 54 36, 80 32 C106 36, 122 68, 122 130 Z" fill="#210d35"/>
    <path d="M48 130 C48 78, 60 52, 80 48 C100 52, 112 78, 112 130 Z" fill="#130520"/>
    
    <!-- Face Shadow -->
    <ellipse cx="80" cy="88" rx="24" ry="30" fill="#0d0317"/>

    <!-- Luminous Animated Eyes -->
    <g class="eyes">
      <ellipse cx="68" cy="84" rx="5" ry="3" fill="#e040fb" filter="url(#runeGlow)"/>
      <circle cx="68" cy="84" r="1.5" fill="#ffffff"/>
      <ellipse cx="92" cy="84" rx="5" ry="3" fill="#e040fb" filter="url(#runeGlow)"/>
      <circle cx="92" cy="84" r="1.5" fill="#ffffff"/>
    </g>

    <!-- Forehead Tiara / Crown -->
    <g class="crown" filter="url(#runeGlow)">
      <polygon points="80,48 86,60 80,68 74,60" fill="url(#magicGlow)"/>
      <circle cx="80" cy="60" r="2" fill="#ffffff"/>
    </g>

    <!-- Cloak clasp gem -->
    <polygon points="80,118 88,126 80,134 72,126" fill="#7c4dff" filter="url(#runeGlow)"/>
    <circle cx="80" cy="126" r="2.5" fill="#ffffff"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createRetroGamerSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="arcadeBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0d1b2a"/>
        <stop offset="100%" stop-color="#1b263b"/>
      </linearGradient>
      <style>
        @keyframes pixelBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes headbandFlutter {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-6deg); }
        }
        @keyframes headsetGlow {
          0%, 100% { fill: #00f2fe; filter: drop-shadow(0 0 2px #00f2fe); }
          50% { fill: #4facfe; filter: drop-shadow(0 0 8px #00f2fe); }
        }
        .pixelEye { animation: pixelBlink 3.2s infinite; transform-origin: center 80px; }
        .flutter { animation: headbandFlutter 1.6s ease-in-out infinite; transform-origin: 32px 58px; }
        .headset { animation: headsetGlow 2s ease-in-out infinite; }
      </style>
    </defs>
    <rect width="160" height="160" rx="24" fill="url(#arcadeBg)"/>
    
    <!-- Retro Pixel Grid background -->
    <path d="M0 32 H160 M0 64 H160 M0 96 H160 M0 128 H160 M32 0 V160 M64 0 V160 M96 0 V160 M128 0 V160" stroke="rgba(255,255,255,0.04)" stroke-width="2"/>

    <!-- Head & Hair Block -->
    <path d="M46 54 H114 V116 H46 Z" fill="#e0a96d"/>
    <path d="M42 42 H118 V64 H42 Z" fill="#2b2d42"/>
    <path d="M42 42 V80 H50 V64 H110 V80 H118 V42 Z" fill="#2b2d42"/>

    <!-- Headband -->
    <rect x="42" y="58" width="76" height="10" fill="#e50914"/>
    <!-- Headband Animated Ribbon -->
    <g class="flutter">
      <path d="M42 62 L22 56 L16 70 L28 66 L20 84 L38 68 Z" fill="#e50914"/>
    </g>

    <!-- Animated Pixel Eyes -->
    <g class="pixelEye">
      <rect x="58" y="78" width="10" height="12" fill="#1b263b"/>
      <rect x="60" y="80" width="4" height="4" fill="#ffffff"/>
      <rect x="92" y="78" width="10" height="12" fill="#1b263b"/>
      <rect x="94" y="80" width="4" height="4" fill="#ffffff"/>
    </g>

    <!-- Mouth & Blush -->
    <rect x="74" y="102" width="12" height="4" fill="#8d5b4c"/>
    <rect x="52" y="92" width="8" height="4" fill="#ff758f" opacity="0.6"/>
    <rect x="100" y="92" width="8" height="4" fill="#ff758f" opacity="0.6"/>

    <!-- Esports Gamer Headset with Animated Mic/Earcups -->
    <path d="M38 52 C38 30, 122 30, 122 52" fill="none" stroke="#2b2d42" stroke-width="8" stroke-linecap="round"/>
    <rect x="34" y="68" width="10" height="26" rx="4" class="headset"/>
    <rect x="116" y="68" width="10" height="26" rx="4" class="headset"/>
    <path d="M42 86 C42 110, 68 114, 76 112" fill="none" stroke="#2b2d42" stroke-width="3" stroke-linecap="round"/>
    <circle cx="78" cy="112" r="3.5" class="headset"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createMechaFoxSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="foxBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2a1200"/>
        <stop offset="100%" stop-color="#0d0500"/>
      </linearGradient>
      <linearGradient id="furGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff6d00"/>
        <stop offset="100%" stop-color="#e65100"/>
      </linearGradient>
      <style>
        @keyframes earTwitchLeft {
          0%, 80%, 100% { transform: rotate(0deg); }
          85% { transform: rotate(-8deg); }
          90% { transform: rotate(4deg); }
          95% { transform: rotate(0deg); }
        }
        @keyframes earTwitchRight {
          0%, 82%, 100% { transform: rotate(0deg); }
          87% { transform: rotate(8deg); }
          92% { transform: rotate(-4deg); }
          97% { transform: rotate(0deg); }
        }
        @keyframes eyeBlinkFox {
          0%, 94%, 100% { transform: scaleY(1); }
          97% { transform: scaleY(0.1); }
        }
        @keyframes cyberPulse {
          0%, 100% { filter: drop-shadow(0 0 2px #00e5ff); opacity: 0.8; }
          50% { filter: drop-shadow(0 0 7px #00e5ff); opacity: 1; }
        }
        .leftEar { animation: earTwitchLeft 4.5s ease-in-out infinite; transform-origin: 52px 65px; }
        .rightEar { animation: earTwitchRight 4.5s ease-in-out infinite; transform-origin: 108px 65px; }
        .foxEyes { animation: eyeBlinkFox 3.8s infinite; transform-origin: center 86px; }
        .cyberMark { animation: cyberPulse 2s ease-in-out infinite; }
      </style>
    </defs>
    <rect width="160" height="160" rx="24" fill="url(#foxBg)"/>

    <!-- Animated Ears -->
    <g class="leftEar">
      <polygon points="45,65 30,22 72,48" fill="url(#furGrad)"/>
      <polygon points="45,60 36,32 64,50" fill="#212121"/>
      <polygon points="42,56 40,40 56,52" fill="#00e5ff" opacity="0.7" class="cyberMark"/>
    </g>
    <g class="rightEar">
      <polygon points="115,65 130,22 88,48" fill="url(#furGrad)"/>
      <polygon points="115,60 124,32 96,50" fill="#212121"/>
      <polygon points="118,56 120,40 104,52" fill="#00e5ff" opacity="0.7" class="cyberMark"/>
    </g>

    <!-- Head & Cheeks -->
    <polygon points="80,122 36,75 52,55 108,55 124,75" fill="url(#furGrad)"/>
    <polygon points="80,122 44,78 54,65 106,65 116,78" fill="#ffffff"/>
    <polygon points="80,122 62,88 98,88" fill="#eceff1"/>

    <!-- Black Nose -->
    <polygon points="80,118 73,110 87,110" fill="#212121"/>

    <!-- Animated Eyes -->
    <g class="foxEyes">
      <polygon points="56,84 70,88 58,92" fill="#00e5ff" class="cyberMark"/>
      <polygon points="104,84 90,88 102,92" fill="#00e5ff" class="cyberMark"/>
    </g>

    <!-- Forehead Cyber Sigil -->
    <path d="M74 58 L80 66 L86 58" fill="none" stroke="#00e5ff" stroke-width="2" class="cyberMark"/>
    <circle cx="80" cy="72" r="2" fill="#00e5ff" class="cyberMark"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function createArcadePhantomSvg(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
    <defs>
      <linearGradient id="ghostBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#051923"/>
        <stop offset="100%" stop-color="#000c14"/>
      </linearGradient>
      <linearGradient id="phantomBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00f5d4"/>
        <stop offset="100%" stop-color="#00bbf9"/>
      </linearGradient>
      <style>
        @keyframes floatGhost {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes wavySkirt {
          0%, 100% { d: path("M42 108 C50 114, 58 114, 66 108 C74 114, 86 114, 94 108 C102 114, 110 114, 118 108 L118 70 C118 45, 42 45, 42 70 Z"); }
          50% { d: path("M42 112 C50 106, 58 106, 66 112 C74 106, 86 106, 94 112 C102 106, 110 106, 118 112 L118 70 C118 45, 42 45, 42 70 Z"); }
        }
        @keyframes lookAround {
          0%, 100% { transform: translateX(0); }
          30% { transform: translateX(-4px); }
          70% { transform: translateX(4px); }
        }
        .phantom { animation: floatGhost 3.2s ease-in-out infinite; transform-origin: center center; }
        .skirt { animation: wavySkirt 1.8s ease-in-out infinite; }
        .eyesLook { animation: lookAround 4s ease-in-out infinite; }
      </style>
    </defs>
    <rect width="160" height="160" rx="24" fill="url(#ghostBg)"/>

    <g class="phantom">
      <!-- Shadow below phantom -->
      <ellipse cx="80" cy="132" rx="30" ry="6" fill="#00f5d4" opacity="0.25" filter="blur(4px)"/>

      <!-- Animated Ghost Body & Skirt -->
      <path class="skirt" fill="url(#phantomBody)" filter="drop-shadow(0 0 10px rgba(0,245,212,0.4))"
        d="M42 108 C50 114, 58 114, 66 108 C74 114, 86 114, 94 108 C102 114, 110 114, 118 108 L118 70 C118 45, 42 45, 42 70 Z"/>

      <!-- Large Expressive Eyes -->
      <g class="eyesLook">
        <!-- Left Eye -->
        <circle cx="66" cy="74" r="11" fill="#ffffff"/>
        <circle cx="68" cy="74" r="6" fill="#051923"/>
        <circle cx="70" cy="72" r="2" fill="#ffffff"/>

        <!-- Right Eye -->
        <circle cx="94" cy="74" r="11" fill="#ffffff"/>
        <circle cx="96" cy="74" r="6" fill="#051923"/>
        <circle cx="98" cy="72" r="2" fill="#ffffff"/>
      </g>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const ANIMATED_AVATARS: AnimatedAvatarItem[] = [
  {
    id: 'av-cyber-ninja',
    name: 'Cyber Ninja',
    category: 'Sci-Fi Action',
    url: createCyberNinjaSvg(),
  },
  {
    id: 'av-cosmic-astro',
    name: 'Cosmic Explorer',
    category: 'Space Epic',
    url: createCosmicAstroSvg(),
  },
  {
    id: 'av-neon-sorceress',
    name: 'Neon Sorceress',
    category: 'Fantasy',
    url: createNeonSorceressSvg(),
  },
  {
    id: 'av-retro-gamer',
    name: 'Retro 8-Bit',
    category: 'Gaming',
    url: createRetroGamerSvg(),
  },
  {
    id: 'av-mecha-fox',
    name: 'Mecha Fox',
    category: 'Anime',
    url: createMechaFoxSvg(),
  },
  {
    id: 'av-arcade-phantom',
    name: 'Neon Phantom',
    category: 'Kids & Comedy',
    url: createArcadePhantomSvg(),
  },
];

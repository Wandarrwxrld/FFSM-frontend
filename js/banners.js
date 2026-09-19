/* ==========================================================================
   Illustrated module banners. Flat-vector SVGs (not stock photography) so
   each module reads at a glance — crop rows for Land & Crops, pasture for
   Livestock, irrigation lines for Water, and so on — while staying in a
   consistent, license-free, hand-authored style.
   ========================================================================== */

const SKY = (top, bottom) => `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/>
</linearGradient></defs><rect width="100%" height="100%" fill="url(#sky)"/>`;

const BANNERS = {
  crops: `<svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    ${SKY('#E9C9AE', '#B98A5F')}
    <circle cx="690" cy="45" r="28" fill="#F5E1D5" opacity=".85"/>
    <path d="M0 140 Q 200 110 400 135 T 800 130 V200 H0 Z" fill="#7C8C4A"/>
    <path d="M0 155 Q 200 130 400 150 T 800 145 V200 H0 Z" fill="#63713A"/>
    ${Array.from({length:14}).map((_,i)=>`<path d="M${i*58+10} 200 Q ${i*58+18} 165 ${i*58+10} 145" stroke="#4F5B2C" stroke-width="3" fill="none" stroke-linecap="round"/>`).join('')}
  </svg>`,

  water: `<svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    ${SKY('#DCE7DE', '#8FA9A0')}
    <path d="M0 120 Q 100 100 200 120 T 400 120 T 600 120 T 800 120 V200 H0 Z" fill="#6E93A0"/>
    <path d="M0 150 Q 100 135 200 150 T 400 150 T 600 150 T 800 150 V200 H0 Z" fill="#557888"/>
    <path d="M0 175 Q 100 165 200 175 T 400 175 T 600 175 T 800 175 V200 H0 Z" fill="#3F5B69"/>
  </svg>`,

  livestock: `<svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    ${SKY('#E9DCC2', '#B7B78E')}
    <path d="M0 150 Q 200 120 400 145 T 800 140 V200 H0 Z" fill="#94A566"/>
    <path d="M0 165 Q 200 145 400 160 T 800 158 V200 H0 Z" fill="#7C8E52"/>
    <g fill="#4A3A2C">
      <ellipse cx="150" cy="150" rx="26" ry="16"/><circle cx="174" cy="140" r="10"/>
      <ellipse cx="430" cy="158" rx="22" ry="14"/><circle cx="450" cy="149" r="9"/>
      <ellipse cx="620" cy="150" rx="26" ry="16"/><circle cx="644" cy="140" r="10"/>
    </g>
  </svg>`,

  harvest: `<svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    ${SKY('#EFE0CC', '#C6A377')}
    <rect x="60" y="110" width="70" height="70" rx="4" fill="#8A6A4C"/>
    <rect x="150" y="90" width="70" height="90" rx="4" fill="#A5815B"/>
    <rect x="240" y="120" width="70" height="60" rx="4" fill="#8A6A4C"/>
    <rect x="560" y="95" width="80" height="85" rx="4" fill="#A5815B"/>
    <rect x="660" y="115" width="70" height="65" rx="4" fill="#8A6A4C"/>
    <rect x="0" y="180" width="800" height="20" fill="#6E5A48"/>
  </svg>`,

  equipment: `<svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    ${SKY('#E9DCC2', '#AEA37E')}
    <rect x="0" y="165" width="800" height="35" fill="#7C6A50"/>
    <g transform="translate(560,90)">
      <rect x="0" y="30" width="90" height="45" rx="4" fill="#997B66"/>
      <rect x="70" y="0" width="55" height="55" rx="4" fill="#CB997E"/>
      <circle cx="20" cy="82" r="20" fill="#3A2E22"/><circle cx="20" cy="82" r="9" fill="#D6C0A8"/>
      <circle cx="100" cy="82" r="26" fill="#3A2E22"/><circle cx="100" cy="82" r="12" fill="#D6C0A8"/>
    </g>
  </svg>`,

  people: `<svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    ${SKY('#EFE0CC', '#B7A47F')}
    <rect x="0" y="150" width="800" height="50" fill="#8A6A4C"/>
    <g transform="translate(600,60)">
      <polygon points="0,90 60,20 120,90" fill="#B5573A"/>
      <rect x="20" y="90" width="80" height="60" fill="#E7D8C9"/>
      <rect x="50" y="115" width="20" height="35" fill="#6E5A48"/>
    </g>
  </svg>`,

  market: `<svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    ${SKY('#F0E4D2', '#D6B98F')}
    <rect x="0" y="170" width="800" height="30" fill="#8A6A4C"/>
    <g fill="#997B66">
      <rect x="120" y="110" width="120" height="60" rx="4"/>
      <polygon points="110,110 250,110 230,80 130,80" fill="#CB997E"/>
    </g>
    <g fill="#B98A5F">
      <rect x="480" y="120" width="110" height="50" rx="4"/>
      <polygon points="470,120 600,120 582,92 488,92" fill="#E9C9AE"/>
    </g>
    <circle cx="700" cy="150" r="16" fill="#EDC65F"/>
    <circle cx="730" cy="160" r="12" fill="#EDC65F"/>
  </svg>`,

  admin: `<svg viewBox="0 0 800 200" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#6E5A48"/>
    ${Array.from({length:10}).map((_,i)=>`<rect x="${i*92-30}" y="0" width="46" height="200" fill="#7C654F" transform="skewX(-12)"/>`).join('')}
  </svg>`,
};

const GROUP_BANNER = {
  'Overview': 'admin',
  'Land & Crops': 'crops',
  'Water': 'water',
  'Livestock': 'livestock',
  'Inventory & Buying': 'harvest',
  'Equipment': 'equipment',
  'People & Work': 'people',
  'Crop Protection': 'crops',
  'Environment': 'crops',
  'Harvest & Storage': 'harvest',
  'Sales': 'market',
  'Finance': 'market',
  'Administration': 'admin',
};

/** entityKey -> which nav group it belongs to, so a page can find its banner without importing NAV_GROUPS itself. */
export function bannerKeyForGroup(groupLabel){
  return GROUP_BANNER[groupLabel] || 'admin';
}

export function bannerSvg(key){
  return BANNERS[key] || BANNERS.admin;
}

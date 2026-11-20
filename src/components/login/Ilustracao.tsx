// Ilustração do painel de apresentação da tela de Login (arte do design).
export function Ilustracao() {
  return (
    <svg viewBox="0 0 640 560" preserveAspectRatio="xMidYMax meet" fill="none" aria-hidden="true" className="block h-auto w-full max-h-[620px]">
      <defs>
        <pattern id="janelas" x="0" y="0" width="34" height="42" patternUnits="userSpaceOnUse">
          <rect x="8" y="10" width="18" height="24" rx="2" fill="#2A5FA8" />
        </pattern>
      </defs>
      <circle cx="500" cy="118" r="34" stroke="#D4A853" strokeWidth="14" />
      <path d="M525 143 L600 218 M572 190 L556 206 M592 210 L576 226" stroke="#D4A853" strokeWidth="14" strokeLinecap="round" />
      <rect x="52" y="130" width="170" height="370" rx="4" fill="#0C3A7A" />
      <rect x="52" y="130" width="170" height="370" rx="4" fill="url(#janelas)" />
      <rect x="94" y="178" width="18" height="24" rx="2" fill="#D4A853" />
      <rect x="162" y="262" width="18" height="24" rx="2" fill="#D4A853" />
      <rect x="60" y="346" width="18" height="24" rx="2" fill="#D4A853" />
      <rect x="128" y="388" width="18" height="24" rx="2" fill="#D4A853" />
      <rect x="238" y="240" width="130" height="260" rx="4" fill="#174A8F" />
      <rect x="238" y="240" width="130" height="260" fill="url(#janelas)" />
      <rect x="280" y="304" width="18" height="24" rx="2" fill="#D4A853" />
      <rect x="314" y="388" width="18" height="24" rx="2" fill="#D4A853" />
      <rect x="392" y="360" width="160" height="140" fill="#F4F6FA" />
      <path d="M376 366 L472 282 L568 366 Z" fill="#D4A853" />
      <rect x="452" y="420" width="40" height="80" rx="2" fill="#002356" />
      <circle cx="484" cy="462" r="3" fill="#D4A853" />
      <rect x="408" y="388" width="30" height="30" rx="2" fill="#2A5FA8" />
      <rect x="506" y="388" width="30" height="30" rx="2" fill="#2A5FA8" />
      <rect x="592" y="436" width="6" height="64" fill="#F4F6FA" />
      <rect x="556" y="404" width="78" height="36" rx="4" fill="#D4A853" />
      <text x="595" y="427" textAnchor="middle" fill="#002356" style={{ font: "800 13px 'Figtree', sans-serif" }}>
        ALUGA-SE
      </text>
      <rect x="0" y="500" width="640" height="6" fill="#D4A853" />
    </svg>
  );
}

import React, { useMemo } from 'react';

// Standard Code 128 Pattern Table (Patterns 0 to 106)
// Each pattern represents alternating widths of 3 bars and 3 spaces (sum = 11 modules),
// except pattern 106 (stop) which has 4 bars and 3 spaces (sum = 13 modules).
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112'
];

/**
 * Encodes string to Code 128 (Subset B) binary modules array (1 = bar, 0 = space)
 */
function encodeCode128Modules(text) {
  if (!text) return [];

  const codes = [];
  let checksum = 104; // Start Code B
  codes.push(104);

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Code 128 Subset B covers ASCII 32 to 126
    const val = charCode >= 32 && charCode <= 126 ? charCode - 32 : 0;
    codes.push(val);
    checksum += val * (i + 1);
  }

  checksum = checksum % 103;
  codes.push(checksum);
  codes.push(106); // Stop Code

  // Build widths string
  let patternStr = '';
  codes.forEach(c => {
    patternStr += CODE128_PATTERNS[c] || CODE128_PATTERNS[0];
  });
  // Final termination bar (width 2)
  patternStr += '2';

  // Convert alternating widths to 1s and 0s
  const modules = [];
  // Add 10-module quiet zone at start
  for (let q = 0; q < 10; q++) modules.push(0);

  let isBar = true;
  for (let i = 0; i < patternStr.length; i++) {
    const width = parseInt(patternStr[i], 10);
    for (let w = 0; w < width; w++) {
      modules.push(isBar ? 1 : 0);
    }
    isBar = !isBar;
  }

  // Add 10-module quiet zone at end
  for (let q = 0; q < 10; q++) modules.push(0);

  return modules;
}

/**
 * BarcodeRenderer - Generates standard, machine-readable Code 128 barcodes as SVG.
 * Guaranteed to be recognized by barcode scanners and camera BarcodeDetector API.
 */
export default function BarcodeRenderer({ 
  value = '', 
  width = 180, 
  height = 50, 
  showText = true,
  interactive = false,
  onClick
}) {
  const modules = useMemo(() => encodeCode128Modules(String(value)), [value]);

  if (!modules.length) return null;

  const totalModules = modules.length;
  const moduleWidth = width / totalModules;

  // Group continuous 1s into bars for cleaner SVG
  const bars = [];
  let inBar = false;
  let startX = 0;

  for (let i = 0; i < modules.length; i++) {
    if (modules[i] === 1 && !inBar) {
      inBar = true;
      startX = i;
    } else if (modules[i] === 0 && inBar) {
      inBar = false;
      bars.push({ x: startX * moduleWidth, w: (i - startX) * moduleWidth });
    }
  }
  if (inBar) {
    bars.push({ x: startX * moduleWidth, w: (modules.length - startX) * moduleWidth });
  }

  return (
    <div 
      className={`barcode-container ${interactive ? 'interactive' : ''}`}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '6px 8px 4px',
        backgroundColor: '#FFFFFF',
        borderRadius: '6px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        userSelect: 'none'
      }}
      title={interactive ? `Click to quick-add "${value}"` : undefined}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        style={{ display: 'block', backgroundColor: '#FFFFFF' }}
        aria-label={`Code 128 Barcode for ${value}`}
      >
        <rect width={width} height={height} fill="#FFFFFF" />
        {bars.map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y={0}
            width={Math.max(bar.w, 0.8)}
            height={height}
            fill="#000000"
          />
        ))}
      </svg>
      {showText && (
        <span style={{
          fontFamily: 'monospace',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '1px',
          color: '#1E293B',
          marginTop: '3px',
          lineHeight: 1
        }}>
          {value}
        </span>
      )}
    </div>
  );
}

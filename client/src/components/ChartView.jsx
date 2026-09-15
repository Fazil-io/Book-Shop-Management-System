import React, { useState } from 'react';
import { Calendar, DollarSign, TrendingUp } from 'lucide-react';

export default function ChartView({ charts }) {
  const [timeframe, setTimeframe] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const data = charts?.[timeframe] || [];

  const maxRevenue = Math.max(...data.map(d => d.revenue || 0), 100);
  const chartHeight = 220;
  const chartWidth = 680;
  const paddingX = 45;
  const paddingY = 30;

  // Calculate coordinates for points
  const points = data.map((item, index) => {
    const x = paddingX + (index / Math.max(data.length - 1, 1)) * (chartWidth - 2 * paddingX);
    const y = chartHeight - paddingY - (item.revenue / maxRevenue) * (chartHeight - 2 * paddingY);
    return { x, y, ...item };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${chartHeight - paddingY} L ${points[0].x.toFixed(1)} ${chartHeight - paddingY} Z`
    : '';

  return (
    <div className="card chart-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="var(--accent-gold)" />
            <span>Sales & Revenue Trends</span>
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Track sales performance and store revenue across timeframes
          </p>
        </div>

        {/* Timeframe selector */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-surface-elevated)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            className={`btn btn-sm ${timeframe === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
            onClick={() => setTimeframe('daily')}
          >
            Daily (7 Days)
          </button>
          <button
            className={`btn btn-sm ${timeframe === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
            onClick={() => setTimeframe('weekly')}
          >
            Weekly (4 Weeks)
          </button>
          <button
            className={`btn btn-sm ${timeframe === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ border: 'none' }}
            onClick={() => setTimeframe('monthly')}
          >
            Monthly (6 Months)
          </button>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', height: '240px', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = chartHeight - paddingY - ratio * (chartHeight - 2 * paddingY);
            const val = (maxRevenue * ratio).toFixed(0);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="var(--font-mono)"
                >
                  ₹{val}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {areaD && (
            <path d={areaD} fill="url(#chartGradient)" />
          )}

          {/* Polyline */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="var(--accent-gold)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points */}
          {points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g 
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Vertical guide line on hover */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingY}
                    x2={pt.x}
                    y2={chartHeight - paddingY}
                    stroke="var(--accent-gold)"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                  />
                )}

                {/* Point Circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#FFFFFF' : 'var(--accent-gold)'}
                  stroke="var(--accent-gold)"
                  strokeWidth="2.5"
                  style={{ transition: 'all 150ms ease' }}
                />

                {/* X-axis label */}
                <text
                  x={pt.x}
                  y={chartHeight - 8}
                  fill="var(--text-muted)"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="var(--font-sans)"
                >
                  {pt.label ? pt.label.slice(-5) : ''}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            style={{
              position: 'absolute',
              left: `${(points[hoveredIndex].x / chartWidth) * 100}%`,
              top: '15px',
              transform: 'translateX(-50%)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--accent-gold)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.45rem 0.75rem',
              boxShadow: 'var(--shadow-md)',
              pointerEvents: 'none',
              zIndex: 10,
              fontSize: '0.78rem',
              whiteSpace: 'nowrap'
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              {points[hoveredIndex].label}
            </div>
            <div style={{ color: 'var(--accent-gold)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              Revenue: ₹{Number(points[hoveredIndex].revenue).toFixed(2)}
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              Orders: {points[hoveredIndex].orders} bills
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

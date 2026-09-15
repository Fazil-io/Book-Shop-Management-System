import React from 'react';

export default function StatCard({ label, value, subtext, icon: Icon, alert = false, onClick }) {
  return (
    <div 
      className={`stat-card ${alert ? 'alert' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
      </div>
      {Icon && (
        <div className="stat-icon-wrapper">
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}

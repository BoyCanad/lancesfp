

export const HDBadge = ({ isSmall }: { isSmall?: boolean }) => (
  <div style={{
    border: '1px solid rgba(255, 255, 255, 0.4)',
    borderRadius: '2px',
    padding: isSmall ? '0 3px' : '0 4px',
    fontSize: isSmall ? '9.5px' : '11px',
    fontWeight: '700',
    color: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    height: isSmall ? '15px' : '18px',
    lineHeight: '1',
    letterSpacing: '0.5px'
  }}>
    HD
  </div>
);

export const SpatialAudioBadge = ({ isSmall }: { isSmall?: boolean }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: isSmall ? '3px' : '4px',
    color: '#e5e7eb',
    fontFamily: 'system-ui, sans-serif'
  }}>
    <svg width={isSmall ? "15" : "20"} height={isSmall ? "15" : "20"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head and shoulders solid */}
      <path d="M12 11C13.6569 11 15 9.65685 15 8C15 6.34315 13.6569 5 12 5C10.3431 5 9 6.34315 9 8C9 9.65685 10.3431 11 12 11Z" fill="currentColor"/>
      <path d="M18 18C18 15.7909 15.3137 14 12 14C8.68629 14 6 15.7909 6 18V19H18V18Z" fill="currentColor"/>
      {/* Radiating waves */}
      <path d="M18.5 14.5C19.8 12.8 19.8 10.2 18.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M21 16.5C23 13.5 23 9.5 21 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5.5 14.5C4.2 12.8 4.2 10.2 5.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M3 16.5C1 13.5 1 9.5 3 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <span style={{ fontSize: isSmall ? '9.5px' : '11px', fontWeight: '800', lineHeight: '1.1', letterSpacing: '0.2px' }}>Spatial</span>
      <span style={{ fontSize: isSmall ? '8px' : '9px', fontWeight: '400', lineHeight: '1.1', color: '#d1d5db', letterSpacing: '0.2px' }}>Audio</span>
    </div>
  </div>
);

export const SurroundBadge = ({ isSmall }: { isSmall?: boolean }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    color: '#e5e7eb',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <span style={{ fontSize: isSmall ? '10px' : '13px', fontWeight: '800', lineHeight: '1.1' }}>5.1</span>
      <span style={{ fontSize: isSmall ? '8px' : '10px', fontWeight: '600', lineHeight: '1.1', textTransform: 'uppercase' }}>Surround</span>
    </div>
  </div>
);

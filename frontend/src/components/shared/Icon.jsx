import React from 'react';

/**
 * Lucide-style SVG icons — 16×16 viewBox, 1.5px stroke, round caps/joins.
 * Usage: <Icon name="dashboard" size={16} color="currentColor" />
 */

const PATHS = {
  dashboard:     'M3 5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5zm0 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2zm6-6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V5zm0 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-2z',
  chart:         'M2 12 6 7l3 3 3-4 3 2',
  election:      'M8 2l1.5 3H13l-2.75 2 1 3L8 8.5 5.75 10l1-3L4 5h3.5L8 2zM3 14h10',
  results:       'M2 4h12M2 8h8M2 12h5',
  pin:           'M8 2a4 4 0 0 1 4 4c0 3-4 8-4 8S4 9 4 6a4 4 0 0 1 4-4zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  map:           'M1 3l4.5 1.5L9 2l4.5 1.5L14 3v10l-4.5 1.5L6 13l-4.5 1.5L1 13V3zm4.5 1.5v8M9 2v10',
  users:         'M11 13s0-2-3-2-3 2-3 2M8 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm5 5s0-1.5-2-2m-1.5-3a2 2 0 0 0 0-4',
  user:          'M8 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-5 7a5 5 0 0 1 10 0',
  flag:          'M4 14V3l8 2-8 3',
  building:      'M4 14V4h8v10M2 14h12M7 8h2M7 11h2M7 5h2',
  candidates:    'M10 10l.5-.5a2 2 0 0 1 3 3L12 14H9l-1-1v-3l2-2zM4 8a4 4 0 0 1 4-4 4 4 0 0 1 2.8 1.1',
  party:         'M8 2l1 3h3l-2.4 1.8.9 3L8 8.2 5.5 9.8l.9-3L4 5h3z',
  logs:          'M3 4h10M3 8h10M3 12h6',
  search:        'M11 11l3 3M2 7a5 5 0 1 0 10 0A5 5 0 0 0 2 7z',
  filter:        'M2 4h12M4 8h8M6 12h4',
  plus:          'M8 2v12M2 8h12',
  edit:          'M11 2l3 3-8 8H3v-3l8-8z',
  trash:         'M3 5h10l-1 9H4L3 5zm3-2h4M6 8v4M10 8v4',
  x:             'M3 3l10 10M13 3 3 13',
  check:         'M2 8l4 4 8-8',
  eye:           'M1 8s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5zm7-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  'eye-off':     'M2 2l12 12M6.7 6.7A3 3 0 0 0 10.9 10.9M4 4.1A8 8 0 0 0 1 8s3 5 7 5a7 7 0 0 0 3.5-1M9.5 3.5A7 7 0 0 1 15 8s-.7 1.4-2 2.6',
  lock:          'M5 8V6a3 3 0 0 1 6 0v2M3 8h10v7H3V8zm5 2v3',
  unlock:        'M5 8V6a3 3 0 0 1 6 0M3 8h10v7H3V8zm5 2v3',
  logout:        'M10 3h3v10h-3M7 11l3-3-3-3M1 8h9',
  settings:      'M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0-8v2m0 10v2M2 8H0m4.2-3.8-1.4-1.4M11.8 4.2l1.4-1.4M12 8h2M11.8 11.8l1.4 1.4M4.2 11.8l-1.4 1.4',
  activity:      'M2 10l3-7 3 10 3-6 2 3',
  'trending-up': 'M2 12 6 7l3 3 5-5M11 5h4v4',
  chevron:       'M5 3l6 5-6 5',
  'chevron-down':'M3 5l5 6 5-6',
  arrow:         'M3 8h10m-4-4 4 4-4 4',
  profile:       'M12 11c0-2.2-1.8-4-4-4S4 8.8 4 11M8 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 10h.01',
  info:          'M8 7v4m0 2h.01M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1z',
  alert:         'M8 3l5.9 10.5H2.1L8 3zm0 4v3m0 2h.01',
  // County/geo icons
  county:        'M2 12h12M4 12V7l4-4 4 4v5M7 12v-3h2v3',
  constituency:  'M8 2L3 6v8h10V6L8 2zm-1 14v-5h2v5',
  ward:          'M8 2a4 4 0 0 1 4 4H4a4 4 0 0 1 4-4zm-4 4v8h8V6',
};

const Icon = ({ name, size = 16, color = 'currentColor', className = '', style = {} }) => {
    const d = PATHS[name] || PATHS.info;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 16 16"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={style}
            aria-hidden="true"
        >
            <path d={d} />
        </svg>
    );
};

export default Icon;

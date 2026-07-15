// Chart colour constants mirroring the index.css :root palette tokens.
// Recharts renders to SVG and needs concrete colour values, so these are
// kept in sync with the CSS custom properties by hand.
export const CHART = {
  teamA: '#00c878',   // --fm-team-a (accent green)
  teamB: '#f12646',   // --fm-team-b (red)
  gold: '#f2c14b',    // --fm-gold
  grid: 'rgba(255, 255, 255, 0.06)',
  axis: '#747e86',    // --fm-text-3
  text: '#b7bdc2',    // --fm-text-2
  tooltipBg: '#0d1317',   // --fm-panel
  tooltipBorder: '#1b272f', // --fm-border
};

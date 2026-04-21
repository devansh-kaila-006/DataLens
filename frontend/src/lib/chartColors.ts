/**
 * Chart Color Utilities
 * Provides theme-aware colors for charts
 */

export function getChartColors() {
  const isDark = document.documentElement.classList.contains('dark')

  if (isDark) {
    return {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(31, 41, 55, 0.8)', // gray-800 with opacity
      font_color: '#D1D5DB', // gray-300
      grid_color: '#4B5563', // gray-600
      axis_color: '#9CA3AF', // gray-400
      background_color: '#1F2937', // gray-800
    }
  }

  return {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(249, 250, 251, 0.8)', // gray-50 with opacity
    font_color: '#6B7280', // gray-500
    grid_color: '#E5E7EB', // gray-200
    axis_color: '#9CA3AF', // gray-400
    background_color: '#F9FAFB', // gray-50
  }
}

export function getChartTheme() {
  const isDark = document.documentElement.classList.contains('dark')
  return isDark ? 'dark' : 'light'
}

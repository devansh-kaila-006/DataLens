/**
 * v2 Badge Component - Flat design, solid colors
 * Clean status badges with high contrast
 */

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

export default function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full border'

  const variantClasses = {
    success: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
    error: 'bg-red-600/20 text-red-400 border-red-500/30',
    info: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30',
    neutral: 'bg-gray-DARK_300 text-gray-DARK_400 border-gray-DARK_400',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return <span className={classes}>{children}</span>
}

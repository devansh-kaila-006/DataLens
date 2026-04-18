/**
 * Premium Badge Component
 * Sophisticated status badges with color variants
 */

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'default'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

export default function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'

  const variantClasses = {
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    error: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    info: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    default: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  return <span className={classes}>{children}</span>
}

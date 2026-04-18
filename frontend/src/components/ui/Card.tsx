/**
 * Premium Card Component
 * Sophisticated card with multiple variants and animations
 */

interface CardProps {
  variant?: 'default' | 'premium' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

export default function Card({
  variant = 'default',
  padding = 'md',
  className = '',
  children,
  onClick,
}: CardProps) {
  const baseClasses = 'rounded-lg transition-all duration-200'

  const variantClasses = {
    default: 'bg-navy-800 border border-slate-700 shadow-lg',
    premium: 'bg-gradient-to-br from-navy-800 to-navy-900 border border-slate-700 shadow-premium',
    interactive: 'bg-navy-800 border border-slate-700 shadow-lg hover:border-emerald-500/50 hover:shadow-glow-emerald cursor-pointer',
  }

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`

  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  )
}

// Card sub-components
interface CardHeaderProps {
  className?: string
  children: React.ReactNode
}

export function CardHeader({ className = '', children }: CardHeaderProps) {
  return <div className={`pb-4 border-b border-slate-700 mb-4 ${className}`}>{children}</div>
}

interface CardBodyProps {
  className?: string
  children: React.ReactNode
}

export function CardBody({ className = '', children }: CardBodyProps) {
  return <div className={className}>{children}</div>
}

interface CardFooterProps {
  className?: string
  children: React.ReactNode
}

export function CardFooter({ className = '', children }: CardFooterProps) {
  return <div className={`pt-4 border-t border-slate-700 mt-4 ${className}`}>{children}</div>
}

/**
 * v2 Card Component - Flat design, white backgrounds
 * Clean, professional cards with subtle shadows
 */

interface CardProps {
  variant?: 'default' | 'elevated' | 'interactive'
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
  const baseClasses = 'rounded-md transition-colors duration-150'

  const variantClasses = {
    default: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white border border-gray-200 shadow-md',
    interactive: 'bg-white border border-gray-200 shadow-sm hover:border-indigo-600 hover:shadow-md cursor-pointer',
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
  return <div className={`pb-4 border-b border-gray-200 mb-4 ${className}`}>{children}</div>
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
  return <div className={`pt-4 border-t border-gray-200 mt-4 ${className}`}>{children}</div>
}

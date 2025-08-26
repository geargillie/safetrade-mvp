import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Cohesive badge system matching Linear/Vercel/Notion aesthetics
const badgeVariants = cva(
  "badge", // Base class from our redesigned CSS system
  {
    variants: {
      variant: {
        default: "badge-default",
        primary: "badge-primary",
        secondary: "badge-secondary",
        success: "badge-success", 
        warning: "badge-warning",
        destructive: "badge-destructive",
        info: "badge-info",
        neutral: "badge-neutral",
        verified: "badge-verified",
        // Solid variants
        "solid-primary": "badge-solid-primary",
        "solid-success": "badge-solid-success",
        "solid-destructive": "badge-solid-destructive",
        "solid-warning": "badge-solid-warning",
        // Legacy mapping
        outline: "badge-secondary",
      },
      size: {
        xs: "badge-xs",
        sm: "badge-sm",
        md: "badge-md", 
        lg: "badge-lg",
        // Legacy mapping
        default: "badge-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
  closable?: boolean
  onClose?: () => void
  interactive?: boolean
}

function Badge({ 
  className, 
  variant, 
  size,
  icon,
  closable = false,
  onClose,
  interactive = false,
  children,
  onClick,
  ...props 
}: BadgeProps) {
  const badgeClasses = cn(
    badgeVariants({ variant, size }),
    icon && "badge-icon",
    closable && "badge-closable",
    interactive && "badge-interactive",
    className
  )

  return (
    <div 
      className={badgeClasses} 
      onClick={onClick}
      {...props}
    >
      {icon}
      {children}
      {closable && onClose && (
        <button
          type="button"
          className="badge-close"
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-label="Remove badge"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path 
              d="M9 3L3 9M3 3l6 6" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  )
}

// Status badge with dot indicator
function StatusBadge({ 
  status, 
  children, 
  ...props 
}: BadgeProps & { 
  status: 'online' | 'offline' | 'away' | 'busy' 
}) {
  return (
    <Badge {...props}>
      <div className={cn("status-indicator", `status-${status}`)} />
      {children}
    </Badge>
  )
}

export { Badge, StatusBadge, badgeVariants }
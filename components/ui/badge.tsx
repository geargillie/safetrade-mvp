import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  // Enhanced base styles with better transitions and accessibility
  "inline-flex items-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1",
  {
    variants: {
      // Comprehensive variant system with consistent brand colors
      variant: {
        // Primary brand badge
        primary: "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 focus:ring-blue-500",
        
        // Secondary neutral badge
        secondary: "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200 focus:ring-gray-500",
        
        // Success states
        success: "bg-emerald-100 text-emerald-800 border border-emerald-200 hover:bg-emerald-200 focus:ring-emerald-500",
        
        // Warning states
        warning: "bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 focus:ring-amber-500",
        
        // Error/danger states
        error: "bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 focus:ring-red-500",
        danger: "bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 focus:ring-red-500",
        
        // Info states
        info: "bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 focus:ring-blue-500",
        
        // Special purpose badges
        verified: "bg-emerald-100 text-emerald-800 border border-emerald-200",
        featured: "bg-purple-100 text-purple-800 border border-purple-200",
        new: "bg-green-100 text-green-800 border border-green-200",
        hot: "bg-red-100 text-red-800 border border-red-200",
        
        // Outlined variants
        "outline-primary": "bg-white text-blue-700 border border-blue-300 hover:bg-blue-50",
        "outline-secondary": "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
        "outline-success": "bg-white text-emerald-700 border border-emerald-300 hover:bg-emerald-50",
        "outline-warning": "bg-white text-amber-700 border border-amber-300 hover:bg-amber-50",
        "outline-error": "bg-white text-red-700 border border-red-300 hover:bg-red-50",
        
        // Solid color variants
        "solid-primary": "bg-blue-600 text-white border border-blue-600 hover:bg-blue-700",
        "solid-success": "bg-emerald-600 text-white border border-emerald-600 hover:bg-emerald-700",
        "solid-warning": "bg-amber-500 text-white border border-amber-500 hover:bg-amber-600",
        "solid-error": "bg-red-600 text-white border border-red-600 hover:bg-red-700",
      },
      
      // Size variants
      size: {
        xs: "px-1.5 py-0.5 text-xs rounded",
        sm: "px-2 py-0.5 text-xs rounded-md",
        md: "px-2.5 py-1 text-sm rounded-md",
        lg: "px-3 py-1.5 text-sm rounded-lg",
        xl: "px-4 py-2 text-base rounded-lg",
      },
      
      // Shape variants
      shape: {
        rounded: "",
        pill: "rounded-full",
        square: "rounded-none",
      },
      
      // Interactive states
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        false: "",
      },
      
      // Remove functionality for dismissible badges
      removable: {
        true: "pr-1",
        false: "",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "sm",
      shape: "rounded",
      interactive: false,
      removable: false,
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  // Icon support
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  // Removable functionality
  onRemove?: () => void;
  
  // Dot indicator
  showDot?: boolean;
  dotColor?: "primary" | "success" | "warning" | "error";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    shape, 
    interactive, 
    removable,
    leftIcon,
    rightIcon,
    onRemove,
    showDot = false,
    dotColor = "primary",
    children,
    ...props 
  }, ref) => {
    const isInteractive = interactive || !!onRemove;
    
    const dotColors = {
      primary: "bg-blue-500",
      success: "bg-emerald-500", 
      warning: "bg-amber-500",
      error: "bg-red-500",
    };

    return (
      <div 
        className={cn(
          badgeVariants({ 
            variant, 
            size, 
            shape, 
            interactive: isInteractive, 
            removable: removable || !!onRemove,
            className 
          })
        )}
        ref={ref}
        {...props}
      >
        {/* Dot indicator */}
        {showDot && (
          <div className={cn("w-2 h-2 rounded-full mr-1.5", dotColors[dotColor])} />
        )}
        
        {/* Left icon */}
        {leftIcon && (
          <span className="mr-1 flex-shrink-0">
            {leftIcon}
          </span>
        )}
        
        {/* Content */}
        <span className="truncate">
          {children}
        </span>
        
        {/* Right icon */}
        {rightIcon && !onRemove && (
          <span className="ml-1 flex-shrink-0">
            {rightIcon}
          </span>
        )}
        
        {/* Remove button */}
        {onRemove && (
          <button
            type="button"
            className="ml-1 flex-shrink-0 rounded-full p-0.5 hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-offset-1 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);
Badge.displayName = "Badge";

// Status Badge component for common status indicators  
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'available' | 'in_talks' | 'sold' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'verified' | 'pending' | 'rejected';
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, ...props }, ref) => {
    const statusVariants = {
      // Listing statuses
      available: { variant: "success" as const, children: "Available", leftIcon: undefined },
      in_talks: { variant: "warning" as const, children: "In Talks", leftIcon: undefined },
      sold: { variant: "secondary" as const, children: "Sold", leftIcon: undefined },
      
      // Meeting statuses
      scheduled: { variant: "primary" as const, children: "Scheduled", leftIcon: undefined },
      confirmed: { variant: "success" as const, children: "Confirmed", leftIcon: undefined },
      in_progress: { variant: "warning" as const, children: "In Progress", leftIcon: undefined },
      completed: { variant: "success" as const, children: "Completed", leftIcon: undefined },
      cancelled: { variant: "error" as const, children: "Cancelled", leftIcon: undefined },
      no_show: { variant: "secondary" as const, children: "No Show", leftIcon: undefined },
      
      // Verification statuses
      verified: { variant: "verified" as const, children: "Verified", leftIcon: (
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      )},
      pending: { variant: "warning" as const, children: "Pending", leftIcon: undefined },
      rejected: { variant: "error" as const, children: "Rejected", leftIcon: undefined },
    };
    
    const statusConfig = statusVariants[status];
    
    return (
      <Badge
        ref={ref}
        variant={statusConfig.variant}
        leftIcon={statusConfig.leftIcon}
        {...props}
      >
        {statusConfig.children}
      </Badge>
    );
  }
);
StatusBadge.displayName = "StatusBadge";

export { Badge, StatusBadge, badgeVariants };
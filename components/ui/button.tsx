import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Professional button variants using the new design system
const buttonVariants = cva(
  "btn", // Base class from our CSS design system
  {
    variants: {
      variant: {
        primary: "btn-primary",
        secondary: "btn-secondary", 
        ghost: "btn-ghost",
        destructive: "btn-destructive",
        success: "btn-success",
        warning: "btn-warning",
        "outline-primary": "btn-outline-primary",
        "outline-destructive": "btn-outline-destructive",
        "outline-success": "btn-outline-success",
        // Legacy mappings for compatibility
        default: "btn-primary",
        outline: "btn-secondary",
        link: "btn-ghost",
      },
      size: {
        xs: "btn-xs",
        sm: "btn-sm", 
        md: "btn-md",
        lg: "btn-lg",
        xl: "btn-xl",
        icon: "btn-icon",
        // Legacy mappings for compatibility  
        default: "btn-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    asChild = false, 
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const isDisabled = disabled || loading
    const buttonClasses = cn(
      buttonVariants({ variant, size }),
      loading && "btn-loading",
      className
    )
    
    return (
      <Comp
        className={buttonClasses}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {leftIcon && !loading && leftIcon}
        {children}
        {rightIcon && !loading && rightIcon}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
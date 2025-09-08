import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Linear/Vercel/Notion-inspired button system
const buttonVariants = cva(
  "btn", // Base class from our redesigned CSS system
  {
    variants: {
      variant: {
        primary: "btn-primary",
        secondary: "btn-secondary", 
        ghost: "btn-ghost",
        destructive: "btn-destructive",
        success: "btn-success",
        // Legacy mappings for compatibility
        default: "btn-primary",
        outline: "btn-secondary",
        link: "btn-ghost",
      },
      size: {
        sm: "btn-sm", 
        md: "btn-md",
        lg: "btn-lg",
        xl: "btn-xl",
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
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
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
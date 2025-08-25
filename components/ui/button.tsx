import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  // Enhanced base styles with sophisticated micro-interactions
  "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] hover:shadow-md hover:-translate-y-0.5",
  {
    variants: {
      // Enhanced variant system with more options
      variant: {
        // Primary brand button - main CTAs
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
        
        // Secondary button - less prominent actions
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500 shadow-sm",
        
        // Success button - positive actions
        success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm",
        
        // Warning button - caution actions
        warning: "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 shadow-sm",
        
        // Danger button - destructive actions
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
        
        // Outlined variants
        outline: "border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
        "outline-primary": "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
        "outline-danger": "border-2 border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500",
        
        // Ghost variants - minimal styling
        ghost: "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
        "ghost-primary": "text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
        "ghost-danger": "text-red-600 hover:bg-red-50 focus:ring-red-500",
        
        // Link variant
        link: "text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500 p-0 h-auto",
      },
      
      // Comprehensive size system
      size: {
        xs: "h-8 px-3 text-xs rounded-md gap-1",
        sm: "h-9 px-3 text-sm rounded-lg gap-2", 
        md: "h-10 px-4 text-sm rounded-lg gap-2",
        lg: "h-12 px-6 text-base rounded-lg gap-2",
        xl: "h-14 px-8 text-lg rounded-xl gap-3",
        
        // Icon variants
        "icon-xs": "h-8 w-8 rounded-md",
        "icon-sm": "h-9 w-9 rounded-lg",
        "icon-md": "h-10 w-10 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-lg", 
        "icon-xl": "h-14 w-14 rounded-xl",
      },
      
      // Loading state styling
      loading: {
        true: "cursor-wait",
        false: "",
      },
      
      // Full width option
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      loading: false,
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    fullWidth,
    disabled,
    children,
    asChild = false, 
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // Show loading spinner
    const LoadingSpinner = () => (
      <svg
        className="animate-spin h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    );
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && leftIcon && leftIcon}
        {loading ? (loadingText || children) : children}
        {!loading && rightIcon && rightIcon}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// Icon Button component for cleaner icon-only buttons
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, size = "icon-md", variant = "ghost", className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={className}
        {...props}
      >
        {icon}
      </Button>
    );
  }
);
IconButton.displayName = "IconButton";

export { Button, IconButton, buttonVariants };
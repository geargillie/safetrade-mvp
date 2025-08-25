/**
 * Unified Input Component
 * Professional form inputs with consistent styling and validation states
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  // Base styles with professional appearance
  "flex w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
  {
    variants: {
      // Visual variants
      variant: {
        default: "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20",
        filled: "border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20",
        ghost: "border-transparent bg-gray-50 focus:bg-white focus:border-gray-300 focus:ring-gray-500/20",
      },
      
      // Size variants
      size: {
        sm: "h-9 px-3 py-2 text-sm rounded-md",
        md: "h-10 px-3 py-2.5 text-sm rounded-lg",
        lg: "h-12 px-4 py-3 text-base rounded-lg",
      },
      
      // State variants
      state: {
        default: "",
        success: "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20",
        warning: "border-amber-300 focus:border-amber-500 focus:ring-amber-500/20", 
        error: "border-red-300 focus:border-red-500 focus:ring-red-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      state: "default",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  // Icons
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  
  // Helper text and labels
  label?: string;
  helperText?: string;
  errorMessage?: string;
  
  // Input group styling
  isInGroup?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size, 
    state,
    leftIcon,
    rightIcon,
    label,
    helperText,
    errorMessage,
    isInGroup = false,
    type = "text",
    id,
    ...props 
  }, ref) => {
    // Auto-generate ID if not provided - hooks must be called unconditionally
    const generatedId = React.useId();
    const inputId = id || generatedId;
    
    // Determine state based on error message
    const finalState = errorMessage ? "error" : state;
    
    // If this is a standalone input (not in a group), render with label and helper text
    if (!isInGroup) {
      return (
        <div className="space-y-1">
          {/* Label */}
          {label && (
            <label 
              htmlFor={inputId}
              className="block text-sm font-medium text-gray-700"
            >
              {label}
            </label>
          )}
          
          {/* Input Container */}
          <div className="relative">
            {/* Left Icon */}
            {leftIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                {leftIcon}
              </div>
            )}
            
            {/* Input */}
            <input
              type={type}
              id={inputId}
              className={cn(
                inputVariants({ variant, size, state: finalState }),
                leftIcon && "pl-10",
                rightIcon && "pr-10",
                className
              )}
              ref={ref}
              {...props}
            />
            
            {/* Right Icon */}
            {rightIcon && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                {rightIcon}
              </div>
            )}
          </div>
          
          {/* Helper Text / Error Message */}
          {(helperText || errorMessage) && (
            <p className={cn(
              "text-sm",
              errorMessage ? "text-red-600" : "text-gray-500"
            )}>
              {errorMessage || helperText}
            </p>
          )}
        </div>
      );
    }
    
    // For inputs in groups, render just the input element
    return (
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            {leftIcon}
          </div>
        )}
        
        {/* Input */}
        <input
          type={type}
          id={inputId}
          className={cn(
            inputVariants({ variant, size, state: finalState }),
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          ref={ref}
          {...props}
        />
        
        {/* Right Icon */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// Textarea component with consistent styling
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    Omit<VariantProps<typeof inputVariants>, 'size'> {
  // Textarea specific props
  label?: string;
  helperText?: string;
  errorMessage?: string;
  resize?: "none" | "vertical" | "horizontal" | "both";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant, 
    state,
    label,
    helperText,
    errorMessage,
    resize = "vertical",
    id,
    ...props 
  }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const finalState = errorMessage ? "error" : state;
    
    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x", 
      both: "resize",
    };

    return (
      <div className="space-y-1">
        {/* Label */}
        {label && (
          <label 
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        
        {/* Textarea */}
        <textarea
          id={textareaId}
          className={cn(
            // Use input base styles but remove height constraint
            "flex w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 min-h-[80px]",
            variant === "default" && "border-gray-300 focus:border-blue-500 focus:ring-blue-500/20",
            variant === "filled" && "border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500/20",
            variant === "ghost" && "border-transparent bg-gray-50 focus:bg-white focus:border-gray-300 focus:ring-gray-500/20",
            finalState === "success" && "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/20",
            finalState === "warning" && "border-amber-300 focus:border-amber-500 focus:ring-amber-500/20",
            finalState === "error" && "border-red-300 focus:border-red-500 focus:ring-red-500/20",
            resizeClasses[resize],
            className
          )}
          ref={ref}
          {...props}
        />
        
        {/* Helper Text / Error Message */}
        {(helperText || errorMessage) && (
          <p className={cn(
            "text-sm",
            errorMessage ? "text-red-600" : "text-gray-500"
          )}>
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// Select component with consistent styling
export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    variant, 
    size, 
    state,
    label,
    helperText,
    errorMessage,
    placeholder,
    options,
    children,
    id,
    ...props 
  }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const finalState = errorMessage ? "error" : state;

    return (
      <div className="space-y-1">
        {/* Label */}
        {label && (
          <label 
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        
        {/* Select Container */}
        <div className="relative">
          <select
            id={selectId}
            className={cn(
              inputVariants({ variant, size, state: finalState }),
              "pr-10 cursor-pointer appearance-none",
              className
            )}
            ref={ref}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options ? (
              options.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))
            ) : (
              children
            )}
          </select>
          
          {/* Dropdown Arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* Helper Text / Error Message */}
        {(helperText || errorMessage) && (
          <p className={cn(
            "text-sm",
            errorMessage ? "text-red-600" : "text-gray-500"
          )}>
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

export { Input, Textarea, Select, inputVariants };
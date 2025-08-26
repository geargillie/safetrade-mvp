/**
 * Unified Card Component
 * Professional, consistent card styling with variants and interactions
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva(
  // Base styles - professional, clean design
  "bg-white rounded-xl border border-gray-200/60 shadow-sm transition-all duration-200 overflow-hidden",
  {
    variants: {
      // Card visual variants
      variant: {
        default: "border-gray-200/60 shadow-sm",
        elevated: "shadow-lg border-gray-300/80",
        outlined: "border-2 border-gray-200 shadow-none",
        ghost: "border-transparent shadow-none bg-transparent",
      },
      
      // Interactive states with enhanced micro-interactions
      interactive: {
        none: "",
        hover: "cursor-pointer hover:shadow-md hover:border-gray-300 hover:-translate-y-1 transition-all duration-200",
        subtle: "cursor-pointer hover:shadow-sm hover:border-gray-250 hover:scale-[1.01] transition-all duration-150",
        press: "cursor-pointer hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 active:scale-[0.98] active:shadow-sm transition-all duration-200",
        lift: "cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:border-gray-300 transition-all duration-300",
        glow: "cursor-pointer hover:shadow-lg hover:shadow-blue-500/20 hover:border-blue-300 transition-all duration-200",
      },
      
      // Card sizes/padding
      size: {
        sm: "p-4",
        md: "p-6", 
        lg: "p-8",
        xl: "p-10",
        none: "p-0",
      },
      
      // Special states
      state: {
        default: "",
        success: "border-emerald-200 bg-emerald-50/30",
        warning: "border-amber-200 bg-amber-50/30",
        error: "border-red-200 bg-red-50/30",
        info: "border-blue-200 bg-blue-50/30",
      }
    },
    defaultVariants: {
      variant: "default",
      interactive: "none",
      size: "md",
      state: "default",
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, size, state, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "div" : "div";
    return (
      <Comp
        className={cn(cardVariants({ variant, interactive, size, state, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

// Card Header component for consistent headers
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  withBorder?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, withBorder = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "px-6 py-4",
        withBorder && "border-b border-gray-200",
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

// Card Content component for consistent content padding
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-6 py-4", className)} {...props} />
));
CardContent.displayName = "CardContent";

// Card Footer component for actions and buttons
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  withBorder?: boolean;
  align?: "left" | "center" | "right" | "between";
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, withBorder = false, align = "left", ...props }, ref) => {
    const alignmentClasses = {
      left: "justify-start",
      center: "justify-center", 
      right: "justify-end",
      between: "justify-between",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "px-6 py-4 flex items-center gap-4",
          withBorder && "border-t border-gray-200",
          alignmentClasses[align],
          className
        )}
        {...props}
      />
    );
  }
);
CardFooter.displayName = "CardFooter";

// Card Title component for consistent typography
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
    size?: "sm" | "md" | "lg" | "xl";
  }
>(({ className, level = 3, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-subtitle",
    md: "text-title",
    lg: "text-headline",
    xl: "text-hero",
  };

  const baseClasses = cn(
    sizeClasses[size],
    className
  );

  // Use explicit heading tags to avoid TypeScript issues
  switch (level) {
    case 1:
      return <h1 ref={ref} className={baseClasses} {...props} />;
    case 2:
      return <h2 ref={ref} className={baseClasses} {...props} />;
    case 3:
      return <h3 ref={ref} className={baseClasses} {...props} />;
    case 4:
      return <h4 ref={ref} className={baseClasses} {...props} />;
    case 5:
      return <h5 ref={ref} className={baseClasses} {...props} />;
    case 6:
      return <h6 ref={ref} className={baseClasses} {...props} />;
    default:
      return <h3 ref={ref} className={baseClasses} {...props} />;
  }
});
CardTitle.displayName = "CardTitle";

// Card Description component for subtitle text
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    size?: "sm" | "md" | "lg";
  }
>(({ className, size = "md", ...props }, ref) => {
  const sizeClasses = {
    sm: "text-small",
    md: "text-body",
    lg: "text-body-large",
  };

  return (
    <p
      ref={ref}
      className={cn(
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

// Card Image component for consistent image handling
export interface CardImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  aspectRatio?: "square" | "video" | "portrait" | "wide";
  objectFit?: "cover" | "contain" | "fill";
}

const CardImage = React.forwardRef<HTMLDivElement, CardImageProps>(
  ({ className, src, alt, aspectRatio = "video", objectFit = "cover", ...props }, ref) => {
    const aspectRatioClasses = {
      square: "aspect-square",
      video: "aspect-video",
      portrait: "aspect-[3/4]",
      wide: "aspect-[21/9]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden bg-gray-100",
          aspectRatioClasses[aspectRatio],
          className
        )}
        {...props}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full transition-transform duration-300 group-hover:scale-105",
            objectFit === "cover" && "object-cover",
            objectFit === "contain" && "object-contain",
            objectFit === "fill" && "object-fill"
          )}
        />
      </div>
    );
  }
);
CardImage.displayName = "CardImage";

// Card Badge component for status indicators
export interface CardBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "warning" | "error" | "info" | "neutral";
  size?: "sm" | "md";
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const CardBadge = React.forwardRef<HTMLDivElement, CardBadgeProps>(
  ({ className, variant = "neutral", size = "sm", position = "top-right", ...props }, ref) => {
    const variantClasses = {
      success: "bg-emerald-100 text-emerald-800 border-emerald-200",
      warning: "bg-amber-100 text-amber-800 border-amber-200", 
      error: "bg-red-100 text-red-800 border-red-200",
      info: "bg-blue-100 text-blue-800 border-blue-200",
      neutral: "bg-gray-100 text-gray-800 border-gray-200",
    };

    const sizeClasses = {
      sm: "px-2 py-0.5 text-xs",
      md: "px-2.5 py-1 text-sm",
    };

    const positionClasses = {
      "top-left": "absolute top-3 left-3",
      "top-right": "absolute top-3 right-3",
      "bottom-left": "absolute bottom-3 left-3",
      "bottom-right": "absolute bottom-3 right-3",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center font-medium rounded-full border",
          variantClasses[variant],
          sizeClasses[size],
          positionClasses[position],
          className
        )}
        {...props}
      />
    );
  }
);
CardBadge.displayName = "CardBadge";

export {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
  CardImage,
  CardBadge,
  cardVariants,
};
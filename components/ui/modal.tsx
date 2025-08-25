/**
 * Unified Modal Component
 * Professional modal dialogs with consistent styling and behavior
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "./button";

// Modal backdrop variants
const backdropVariants = cva(
  "fixed inset-0 z-50 transition-all duration-300",
  {
    variants: {
      blur: {
        none: "bg-black/50",
        sm: "bg-black/30 backdrop-blur-sm",
        md: "bg-black/40 backdrop-blur-md",
        lg: "bg-black/50 backdrop-blur-lg",
      },
    },
    defaultVariants: {
      blur: "md",
    },
  }
);

// Modal content variants
const modalVariants = cva(
  "relative bg-white rounded-xl shadow-2xl transition-all duration-300 max-h-[90vh] overflow-hidden",
  {
    variants: {
      size: {
        xs: "max-w-xs",
        sm: "max-w-sm", 
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        full: "max-w-[95vw] max-h-[95vh]",
      },
      
      // Animation variants
      animation: {
        fade: "animate-in fade-in-0 duration-300",
        scale: "animate-in fade-in-0 zoom-in-95 duration-300",
        slideUp: "animate-in fade-in-0 slide-in-from-bottom-4 duration-300",
        slideDown: "animate-in fade-in-0 slide-in-from-top-4 duration-300",
      },
      
      // Position variants
      position: {
        center: "",
        top: "mt-16",
        bottom: "mb-16",
      },
    },
    defaultVariants: {
      size: "md",
      animation: "scale",
      position: "center",
    },
  }
);

export interface ModalProps
  extends VariantProps<typeof modalVariants>,
    VariantProps<typeof backdropVariants> {
  // Content
  children: React.ReactNode;
  
  // State
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  
  // Behavior
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  preventScroll?: boolean;
  
  // Styling
  className?: string;
  backdropClassName?: string;
  
  // Accessibility
  title?: string;
  description?: string;
}

const Modal: React.FC<ModalProps> = ({
  children,
  open,
  onOpenChange,
  size,
  animation,
  position,
  blur,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  preventScroll = true,
  className,
  backdropClassName,
  title,
  description,
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape && open) {
        onOpenChange?.(false);
      }
    };

    if (open && closeOnEscape) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, closeOnEscape, onOpenChange]);

  // Handle body scroll
  React.useEffect(() => {
    if (open && preventScroll) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open, preventScroll]);

  // Handle visibility animation
  React.useEffect(() => {
    if (open) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!isVisible && !open) return null;

  return (
    <>
      {/* Portal target would go here in a real implementation */}
      <div className="fixed inset-0 z-50">
        {/* Backdrop */}
        <div
          className={cn(
            backdropVariants({ blur }),
            !open && "opacity-0",
            backdropClassName
          )}
          onClick={closeOnBackdropClick ? () => onOpenChange?.(false) : undefined}
          aria-hidden="true"
        />
        
        {/* Modal Container */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className={cn(
              modalVariants({ size, animation, position }),
              !open && "opacity-0 scale-95",
              className
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            aria-describedby={description ? "modal-description" : undefined}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

// Modal Header component
export interface ModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

const ModalHeader = React.forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, title, description, onClose, showCloseButton = true, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-start justify-between p-6 border-b border-gray-200",
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900 leading-tight">
            {title}
          </h2>
        )}
        {description && (
          <p id="modal-description" className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}
        {children}
      </div>
      
      {showCloseButton && onClose && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="ml-4 -mt-2 -mr-2 text-gray-400 hover:text-gray-600"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      )}
    </div>
  )
);
ModalHeader.displayName = "ModalHeader";

// Modal Body component
const ModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    scrollable?: boolean;
    maxHeight?: string;
  }
>(({ className, scrollable = false, maxHeight, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-6",
      scrollable && "overflow-y-auto",
      className
    )}
    style={maxHeight ? { maxHeight } : undefined}
    {...props}
  >
    {children}
  </div>
));
ModalBody.displayName = "ModalBody";

// Modal Footer component
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "left" | "center" | "right" | "between";
  withBorder?: boolean;
}

const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, align = "right", withBorder = true, ...props }, ref) => {
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
          "flex items-center gap-3 p-6",
          withBorder && "border-t border-gray-200",
          alignmentClasses[align],
          className
        )}
        {...props}
      />
    );
  }
);
ModalFooter.displayName = "ModalFooter";

// Confirmation Modal - common pattern
export interface ConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  variant?: "default" | "danger";
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel", 
  onConfirm,
  variant = "default",
  loading = false,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      // Let parent handle error
    }
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm">
      <ModalHeader title={title} description={description} onClose={() => onOpenChange(false)} />
      
      <ModalFooter align="right">
        <Button
          variant="secondary"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant === "danger" ? "danger" : "primary"}
          onClick={handleConfirm}
          loading={loading}
          loadingText="Please wait..."
        >
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

// Alert Modal - informational modal
export interface AlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  variant?: "info" | "success" | "warning" | "error";
}

const AlertModal: React.FC<AlertModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmText = "OK",
  variant = "info",
}) => {
  const icons = {
    info: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    error: (
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="sm">
      <ModalBody>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {icons[variant]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            {description && (
              <p className="text-sm text-gray-600 mb-4">
                {description}
              </p>
            )}
            {children}
          </div>
        </div>
      </ModalBody>
      
      <ModalFooter align="right">
        <Button onClick={() => onOpenChange(false)}>
          {confirmText}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export { 
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  ConfirmationModal,
  AlertModal,
  modalVariants,
  backdropVariants 
};
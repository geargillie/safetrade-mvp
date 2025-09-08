# SafeTrade Design System Migration Guide

## Implementation Roadmap

### Phase 1: Foundation Setup (Week 1)

#### 1.1 Update globals.css
```css
/* Update app/globals.css */
@import "tailwindcss";
@import "../styles/design-system.css";

/* Remove old imports */
/* @import "../styles/typography.css"; */
/* @import "../styles/forms.css"; */
/* @import "../styles/buttons-badges.css"; */

/* Global font setup */
* {
  font-family: var(--font-family-sans);
}

body {
  background-color: var(--surface-secondary);
  color: var(--text-primary);
  line-height: var(--line-height-normal);
}
```

#### 1.2 Create Design System Components

**Button Component Migration:**
```typescript
// components/ui/Button.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, fullWidth, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'btn',
          `btn-${variant}`,
          `btn-${size}`,
          fullWidth && 'btn-full',
          loading && 'btn-loading',
          className
        )}
        disabled={props.disabled || loading}
        {...props}
      >
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);
```

**Input Component:**
```typescript
// components/ui/Input.tsx
import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, success, hint, ...props }, ref) => {
    return (
      <div className="form-group">
        {label && (
          <label className="text-label" htmlFor={props.id}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'input',
            error && 'error',
            success && 'success',
            className
          )}
          {...props}
        />
        {error && <div className="text-caption text-error">{error}</div>}
        {success && <div className="text-caption text-success">{success}</div>}
        {hint && <div className="text-caption">{hint}</div>}
      </div>
    );
  }
);
```

### Phase 2: Page-by-Page Migration (Weeks 2-4)

#### 2.1 Authentication Pages Migration

**Before (app/auth/login/page.tsx):**
```typescript
// ❌ Old inconsistent styling
<div className="min-h-screen bg-gray-50 flex items-center justify-center">
  <div className="max-w-md w-full space-y-8">
    <h2 className="text-3xl font-extrabold text-gray-900">Welcome back</h2>
    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
      Sign In
    </button>
  </div>
</div>
```

**After:**
```typescript
// ✅ New consistent design system
<div className="page-wrapper">
  <div className="page-content">
    <div className="form-page">
      <div className="section-header text-center content-block">
        <h1 className="page-title">Welcome back</h1>
        <p className="page-description">Sign in to your verified SafeTrade account</p>
      </div>
      
      <Button variant="primary" size="lg" fullWidth loading={loading}>
        Sign In
      </Button>
    </div>
  </div>
</div>
```

#### 2.2 Homepage Migration

**Before (app/page.tsx):**
```typescript
// ❌ Mixed styling approaches
<section className="hero-section flex relative overflow-hidden bg-primary">
  <h1 className="page-title">The motorcycle marketplace that works for you.</h1>
  <Button variant="primary" size="xl" className="min-w-48">Browse motorcycles</Button>
</section>
```

**After:**
```typescript
// ✅ Consistent design system
<section className="hero-section">
  <div className="container">
    <h1 className="text-display text-center mb-6">
      The motorcycle marketplace that works for you.
    </h1>
    <p className="page-description text-center">
      All-in-one platform that verifies identities, checks vehicle histories, 
      and secures transactions.
    </p>
    <div className="element-group">
      <Button variant="primary" size="xl">Browse motorcycles</Button>
      <Button variant="secondary" size="xl">Create listing</Button>
    </div>
  </div>
</section>
```

#### 2.3 Listings Pages Migration

**Create Listing Form Migration:**
```typescript
// Before - Mixed approaches
<div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Listing Preview</h3>
  <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium">
    Publish Listing
  </button>
</div>

// After - Design system
<div className="card card-elevated">
  <div className="card-header">
    <h3 className="text-subtitle">Listing Preview</h3>
  </div>
  <div className="card-content">
    <Button variant="primary" size="lg" fullWidth>
      Publish Listing
    </Button>
  </div>
</div>
```

#### 2.4 Messaging Interface Migration

**Current Complex System:**
```typescript
// ❌ Custom messaging theme variables
<div className={`text-sm mb-2 truncate font-messaging ${
  isSelected ? 'text-white/90' : 'text-messaging-text-secondary'
}`}>
```

**Migrated System:**
```typescript
// ✅ Standard design system
<div className={cn(
  'text-body-sm mb-2 truncate',
  isSelected ? 'text-inverse' : 'text-secondary'
)}>
```

### Phase 3: Component Library Updates (Week 3)

#### 3.1 Enhanced Card Component
```typescript
// components/ui/Card.tsx
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', hover = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'card',
          variant === 'elevated' && 'card-elevated',
          variant === 'outlined' && 'card-outlined',
          variant === 'ghost' && 'card-ghost',
          hover && 'hover-lift',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('card-header', className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('card-content', className)} {...props} />
);
```

#### 3.2 Typography Components
```typescript
// components/ui/Typography.tsx
export const Heading = ({ 
  level = 1, 
  className, 
  children, 
  ...props 
}: { 
  level?: 1 | 2 | 3 | 4 | 5 | 6;
} & React.HTMLAttributes<HTMLHeadingElement>) => {
  const Component = `h${level}` as const;
  const classes = {
    1: 'text-display',
    2: 'text-headline', 
    3: 'text-title',
    4: 'text-subtitle',
    5: 'text-body',
    6: 'text-small'
  };
  
  return (
    <Component className={cn(classes[level], className)} {...props}>
      {children}
    </Component>
  );
};

export const Text = ({ 
  size = 'base', 
  color = 'primary',
  className, 
  children, 
  ...props 
}: {
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'tertiary' | 'brand' | 'success' | 'warning' | 'error';
} & React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p 
      className={cn(
        size === 'xs' && 'text-caption',
        size === 'sm' && 'text-small', 
        size === 'base' && 'text-body',
        size === 'lg' && 'text-body-lg',
        color !== 'primary' && `text-${color}`,
        className
      )} 
      {...props}
    >
      {children}
    </p>
  );
};
```

### Phase 4: Advanced Components (Week 4)

#### 4.1 Loading States Component
```typescript
// components/ui/LoadingSpinner.tsx
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
}

export const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  className 
}: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2', 
    lg: 'h-8 w-8 border-2',
    xl: 'h-12 w-12 border-4'
  };
  
  const colors = {
    primary: 'border-brand-primary border-t-transparent',
    secondary: 'border-neutral-400 border-t-transparent',
    white: 'border-white border-t-transparent'
  };
  
  return (
    <div 
      className={cn(
        'animate-spin rounded-full',
        sizes[size],
        colors[color],
        className
      )}
    />
  );
};
```

#### 4.2 Form Field Group Component
```typescript
// components/ui/FormField.tsx
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactElement;
}

export const FormField = ({ label, error, required, hint, children }: FormFieldProps) => {
  const id = React.useId();
  
  return (
    <div className="form-group">
      <label htmlFor={id} className="text-label">
        {label}
        {required && <span className="text-error ml-1">*</span>}
      </label>
      {React.cloneElement(children, { id, 'aria-invalid': !!error })}
      {hint && !error && (
        <div className="text-caption">{hint}</div>
      )}
      {error && (
        <div className="text-caption text-error">{error}</div>
      )}
    </div>
  );
};
```

### Phase 5: Cleanup & Optimization (Week 5)

#### 5.1 Remove Legacy CSS Files
```bash
# Files to remove after migration
rm styles/typography.css
rm styles/forms.css
rm styles/buttons-badges.css
rm styles/fixes.css

# Update imports in remaining files
find . -name "*.tsx" -o -name "*.ts" -exec sed -i '' 's/@import.*typography.css.*;//g' {} \;
find . -name "*.tsx" -o -name "*.ts" -exec sed -i '' 's/@import.*forms.css.*;//g' {} \;
```

#### 5.2 Automated Migration Scripts

**Button Migration Script:**
```typescript
// tools/migrate-buttons.ts
export function migrateButtons(content: string): string {
  // Replace old button classes
  const replacements = [
    [/className="btn btn-primary"/g, 'variant="primary"'],
    [/className="btn btn-secondary"/g, 'variant="secondary"'],
    [/className="bg-blue-600 [^"]*"/g, 'variant="primary"'],
    [/className="bg-gray-200 [^"]*"/g, 'variant="secondary"'],
  ];
  
  let result = content;
  replacements.forEach(([pattern, replacement]) => {
    result = result.replace(pattern, replacement);
  });
  
  return result;
}
```

**Typography Migration Script:**
```typescript
// tools/migrate-typography.ts  
export function migrateTypography(content: string): string {
  const replacements = [
    [/className="text-3xl font-extrabold"/g, 'className="text-headline"'],
    [/className="text-lg font-semibold"/g, 'className="text-title"'],
    [/className="text-sm text-gray-600"/g, 'className="text-small"'],
    [/className="text-gray-500"/g, 'className="text-tertiary"'],
  ];
  
  let result = content;
  replacements.forEach(([pattern, replacement]) => {
    result = result.replace(pattern, replacement);
  });
  
  return result;
}
```

## Migration Checklist

### Week 1: Foundation
- [ ] Update globals.css with design system import
- [ ] Create base Button component
- [ ] Create base Input component  
- [ ] Create base Card component
- [ ] Test design system tokens

### Week 2: Authentication & Homepage
- [ ] Migrate login page
- [ ] Migrate register page
- [ ] Migrate callback page
- [ ] Migrate homepage hero section
- [ ] Update navigation component

### Week 3: Listings & Forms
- [ ] Migrate listings browse page
- [ ] Migrate listing details page
- [ ] Migrate create listing form
- [ ] Migrate edit listing form
- [ ] Update all form components

### Week 4: Complex Interfaces
- [ ] Migrate messaging interface
- [ ] Migrate safe zones pages
- [ ] Migrate meeting pages
- [ ] Update dashboard pages

### Week 5: Polish & Testing
- [ ] Remove legacy CSS files
- [ ] Run automated migration scripts
- [ ] Test responsive design
- [ ] Test accessibility
- [ ] Test cross-browser compatibility

## Quality Assurance

### Visual Testing Checklist
- [ ] All buttons use consistent styling
- [ ] Typography hierarchy is clear and consistent
- [ ] Color usage follows design system
- [ ] Spacing follows 8px grid system
- [ ] Cards have consistent padding and shadows
- [ ] Forms have consistent field styling
- [ ] Loading states are unified
- [ ] Hover effects work consistently
- [ ] Focus states are accessible

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast ratios meet WCAG AA
- [ ] Focus indicators are visible
- [ ] Form labels are properly associated

This migration guide ensures a systematic approach to implementing the design system across the entire SafeTrade application, resulting in a visually consistent and professional user interface.
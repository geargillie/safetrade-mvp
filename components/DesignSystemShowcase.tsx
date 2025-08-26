/**
 * Design System Showcase
 * Demonstrates all button and badge variants
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowRight, 
  Download, 
  Heart, 
  Settings, 
  Trash2, 
  Plus,
  Check,
  AlertTriangle,
  Info,
  Star,
  Shield
} from 'lucide-react';

export default function DesignSystemShowcase() {
  const [badges, setBadges] = React.useState([
    { id: 1, label: 'Removable Badge', variant: 'primary' as const },
    { id: 2, label: 'Another Badge', variant: 'success' as const },
  ]);

  const removeBadge = (id: number) => {
    setBadges(badges.filter(badge => badge.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          SafeTrade Design System
        </h1>
        <p className="text-lg text-gray-600">
          Professional buttons and badges inspired by Linear, Vercel, and Notion
        </p>
      </div>

      {/* Button Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Button Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Primary Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Primary Actions</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="primary" size="sm">Primary Small</Button>
              <Button variant="primary">Primary Medium</Button>
              <Button variant="primary" size="lg">Primary Large</Button>
              <Button variant="primary" size="xl">Primary Extra Large</Button>
            </div>
          </div>

          {/* Secondary Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Secondary Actions</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="secondary" size="sm">Secondary Small</Button>
              <Button variant="secondary">Secondary Medium</Button>
              <Button variant="secondary" size="lg">Secondary Large</Button>
              <Button variant="secondary" size="xl">Secondary Extra Large</Button>
            </div>
          </div>

          {/* Additional Variants */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Additional Variants</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="success">Success</Button>
            </div>
          </div>

          {/* Semantic Colors */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Semantic Colors</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="success" leftIcon={<Check className="w-4 h-4" />}>
                Success Action
              </Button>
              <Button variant="destructive" leftIcon={<AlertTriangle className="w-4 h-4" />}>
                Warning Action
              </Button>
              <Button variant="destructive" leftIcon={<Trash2 className="w-4 h-4" />}>
                Delete Action
              </Button>
            </div>
          </div>

          {/* Ghost and Minimal */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ghost & Minimal</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="ghost" leftIcon={<Settings className="w-4 h-4" />}>
                Settings
              </Button>
              <Button variant="ghost" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Continue
              </Button>
              <Button variant="ghost" size="sm">Small Ghost</Button>
            </div>
          </div>

          {/* Icon Buttons */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Icon Buttons</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="primary" size="sm" className="w-8 h-8 p-0">
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="secondary" size="sm" className="w-8 h-8 p-0">
                <Heart className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="sm" className="w-8 h-8 p-0">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Loading States */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Loading States</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="primary" loading>Loading Primary</Button>
              <Button variant="secondary" loading>Loading Secondary</Button>
              <Button variant="ghost" loading>Loading Ghost</Button>
            </div>
          </div>

          {/* Disabled States */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Disabled States</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="primary" disabled>Disabled Primary</Button>
              <Button variant="secondary" disabled>Disabled Secondary</Button>
              <Button variant="ghost" disabled>Disabled Ghost</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badge Variants */}
      <Card>
        <CardHeader>
          <CardTitle>Badge Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Basic Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Badges</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="destructive">Warning</Badge>
              <Badge variant="destructive">Error</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </div>

          {/* Badge Sizes */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Badge Sizes</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Badge variant="primary" size="xs">Extra Small</Badge>
              <Badge variant="primary" size="sm">Small</Badge>
              <Badge variant="primary" size="md">Medium</Badge>
              <Badge variant="primary" size="lg">Large</Badge>
            </div>
          </div>

          {/* Solid Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Solid Badges</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Badge variant="solid-primary">Solid Primary</Badge>
              <Badge variant="solid-success">Solid Success</Badge>
              <Badge variant="solid-destructive">Solid Error</Badge>
              <Badge variant="solid-warning">Solid Warning</Badge>
            </div>
          </div>

          {/* Badges with Icons */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Badges with Icons</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Badge variant="verified" icon={<Shield className="w-3 h-3" />}>
                Identity Verified
              </Badge>
              <Badge variant="destructive" icon={<AlertTriangle className="w-3 h-3" />}>
                Pending Review
              </Badge>
              <Badge variant="success" icon={<Check className="w-3 h-3" />}>
                Transaction Complete
              </Badge>
              <Badge variant="info" icon={<Info className="w-3 h-3" />}>
                New Feature
              </Badge>
              <Badge variant="primary" icon={<Star className="w-3 h-3" />}>
                Premium
              </Badge>
            </div>
          </div>

          {/* Status Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Status Indicators</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <StatusBadge status="online">Online</StatusBadge>
              <StatusBadge status="away">Away</StatusBadge>
              <StatusBadge status="busy">Busy</StatusBadge>
              <StatusBadge status="offline">Offline</StatusBadge>
            </div>
          </div>

          {/* Interactive Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Interactive Badges</h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Badge variant="primary" interactive onClick={() => alert('Badge clicked!')}>
                Clickable
              </Badge>
              <Badge 
                variant="secondary" 
                interactive 
                onClick={() => alert('Filter applied!')}
              >
                Filter: Price
              </Badge>
            </div>
          </div>

          {/* Removable Badges */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Removable Badges</h3>
            <div className="flex flex-wrap gap-4 items-center">
              {badges.map(badge => (
                <Badge 
                  key={badge.id}
                  variant={badge.variant}
                  closable 
                  onClose={() => removeBadge(badge.id)}
                >
                  {badge.label}
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setBadges([
                  ...badges,
                  { 
                    id: Date.now(), 
                    label: `Badge ${badges.length + 1}`, 
                    variant: 'primary' as const 
                  }
                ])}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Badge
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real-world Examples */}
      <Card>
        <CardHeader>
          <CardTitle>Real-world Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Motorcycle Listing Actions */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-4">Motorcycle Listing Actions</h4>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" leftIcon={<Heart className="w-4 h-4" />}>
                Save Listing
              </Button>
              <Button variant="secondary" leftIcon={<Info className="w-4 h-4" />}>
                Get Details
              </Button>
              <Button variant="ghost">
                Message Seller
              </Button>
              <Button variant="success" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Schedule Meeting
              </Button>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="verified" icon={<Shield className="w-3 h-3" />}>Verified Seller</Badge>
              <Badge variant="success">Available</Badge>
              <Badge variant="info">Recently Updated</Badge>
              <Badge variant="info">Price Reduced</Badge>
            </div>
          </div>

          {/* Form Actions */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-4">Form Actions</h4>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost">Cancel</Button>
              <Button variant="secondary">Save Draft</Button>
              <Button variant="primary">Publish Listing</Button>
            </div>
          </div>

          {/* Safety Features */}
          <div className="p-6 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-4">Safety & Emergency</h4>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button variant="success" leftIcon={<Check className="w-4 h-4" />}>
                I'm Safe
              </Button>
              <Button variant="destructive" leftIcon={<AlertTriangle className="w-4 h-4" />}>
                Need Help
              </Button>
              <Button variant="destructive" leftIcon={<AlertTriangle className="w-4 h-4" />}>
                Emergency
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="online">Meeting Active</StatusBadge>
              <Badge variant="verified" icon={<Shield className="w-3 h-3" />}>Safe Zone</Badge>
              <Badge variant="info">Safety Code: ABC123</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
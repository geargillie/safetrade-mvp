/**
 * Modern Design System Showcase
 * Demonstrates the new SafeTrade design system inspired by Grok, Vercel, and Notion
 */

'use client';

import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Search, Bell, Settings, MessageCircle, Plus, CheckCircle2, AlertCircle, Star, Heart, Download, Share2 } from 'lucide-react';

export default function DesignShowcase() {
  return (
    <Layout showNavigation={true}>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        {/* Hero Section */}
        <div className="border-b" style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="container">
            <div className="py-16 text-center">
              <h1 className="text-display mb-4 animate-fade-in">
                SafeTrade Design System v3.0
              </h1>
              <p className="text-body max-w-2xl mx-auto mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
                A minimalist design system directly inspired by Vercel.com and Grok.com aesthetics. 
                Features pure black primaries, refined grays, and Vercel's signature blue accent for maximum clarity and focus.
              </p>
              <div className="flex gap-4 justify-center animate-fade-in" style={{ animationDelay: '200ms' }}>
                <Button variant="primary" size="lg">
                  <Download className="w-4 h-4" />
                  View Components
                </Button>
                <Button variant="secondary" size="lg">
                  <Share2 className="w-4 h-4" />
                  Documentation
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-16">
          <div className="grid gap-16">
            {/* Typography Section */}
            <section className="animate-fade-in">
              <h2 className="text-headline mb-8">Typography System</h2>
              <div className="card p-8">
                <div className="grid gap-6">
                  <div>
                    <div className="text-display">Display Text</div>
                    <p className="text-caption text-tertiary">text-display • 48px • Bold</p>
                  </div>
                  <div>
                    <div className="text-headline">Headline Text</div>
                    <p className="text-caption text-tertiary">text-headline • 36px • Bold</p>
                  </div>
                  <div>
                    <div className="text-title">Title Text</div>
                    <p className="text-caption text-tertiary">text-title • 24px • Semibold</p>
                  </div>
                  <div>
                    <div className="text-subtitle">Subtitle Text</div>
                    <p className="text-caption text-tertiary">text-subtitle • 18px • Medium</p>
                  </div>
                  <div>
                    <div className="text-body">Body Text - This is the main body text used for paragraphs and general content.</div>
                    <p className="text-caption text-tertiary">text-body • 16px • Normal</p>
                  </div>
                  <div>
                    <div className="text-body-sm">Small Body Text - Used for secondary information and captions.</div>
                    <p className="text-caption text-tertiary">text-body-sm • 14px • Normal</p>
                  </div>
                  <div>
                    <div className="text-caption">Caption Text</div>
                    <p className="text-caption text-tertiary">text-caption • 12px • Normal</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Colors Section */}
            <section className="animate-fade-in">
              <h2 className="text-headline mb-8">Color System</h2>
              <div className="grid grid-cols-2 gap-8">
                <div className="card p-6">
                  <h3 className="text-title mb-6">Text Colors</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: 'var(--color-text-primary)' }}></div>
                      <div>
                        <div className="text-primary font-medium">Primary Text</div>
                        <div className="text-caption text-tertiary">--color-text-primary</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: 'var(--color-text-secondary)' }}></div>
                      <div>
                        <div className="text-secondary font-medium">Secondary Text</div>
                        <div className="text-caption text-tertiary">--color-text-secondary</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: 'var(--color-text-tertiary)' }}></div>
                      <div>
                        <div className="text-tertiary font-medium">Tertiary Text</div>
                        <div className="text-caption text-tertiary">--color-text-tertiary</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-title mb-6">Accent Colors</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-accent"></div>
                      <div>
                        <div className="text-accent font-medium">Primary Accent</div>
                        <div className="text-caption text-tertiary">--color-accent-primary</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-success"></div>
                      <div>
                        <div className="text-success font-medium">Success</div>
                        <div className="text-caption text-tertiary">--color-accent-success</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-warning"></div>
                      <div>
                        <div className="text-warning font-medium">Warning</div>
                        <div className="text-caption text-tertiary">--color-accent-warning</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-error"></div>
                      <div>
                        <div className="text-error font-medium">Error</div>
                        <div className="text-caption text-tertiary">--color-accent-error</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Buttons Section */}
            <section className="animate-fade-in">
              <h2 className="text-headline mb-8">Button System</h2>
              <div className="card p-8">
                <div className="grid gap-8">
                  {/* Button Variants - Vercel/Grok Inspired */}
                  <div>
                    <h3 className="text-subtitle mb-4">Button Variants - Vercel & Grok Inspired</h3>
                    <div className="flex flex-wrap gap-4">
                      <button className="btn btn-black btn-md">
                        <Plus className="w-4 h-4" />
                        Pure Black
                      </button>
                      <button className="btn btn-blue btn-md">
                        <Star className="w-4 h-4" />
                        Vercel Blue
                      </button>
                      <button className="btn btn-success btn-md">
                        <CheckCircle2 className="w-4 h-4" />
                        Clean Green
                      </button>
                      <button className="btn btn-secondary btn-md">
                        <Settings className="w-4 h-4" />
                        Refined Gray
                      </button>
                      <button className="btn btn-ghost btn-md">
                        <Share2 className="w-4 h-4" />
                        Minimal Ghost
                      </button>
                    </div>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-body-sm text-gray-600">
                        <strong>Authentic Vercel/Grok:</strong> Pure black (#000000) primary with refined grays. 
                        Vercel Blue (#0070f3) as signature accent for focused actions.
                      </p>
                    </div>
                  </div>

                  {/* Button Sizes */}
                  <div>
                    <h3 className="text-subtitle mb-4">Button Sizes - Minimalist Scale</h3>
                    <div className="flex flex-wrap items-center gap-4">
                      <button className="btn btn-black btn-sm">Black Small</button>
                      <button className="btn btn-blue btn-md">Blue Medium</button>
                      <button className="btn btn-success btn-lg">Green Large</button>
                      <button className="btn btn-secondary btn-xl">Gray Extra Large</button>
                    </div>
                    <div className="mt-3">
                      <p className="text-caption text-gray-600">
                        Compact sizes: xs (25.6px), sm (28.8px), md (32px), lg (38.4px), xl (44.8px)
                      </p>
                    </div>
                  </div>

                  {/* Button States */}
                  <div>
                    <h3 className="text-subtitle mb-4">Button States & Interactions</h3>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-4">
                        <button className="btn btn-black btn-md">Black Normal</button>
                        <button className="btn btn-black btn-md loading">Black Loading</button>
                        <button className="btn btn-black btn-md" disabled>Black Disabled</button>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <button className="btn btn-blue btn-md">Blue Normal</button>
                        <button className="btn btn-blue btn-md loading">Blue Loading</button>
                        <button className="btn btn-blue btn-md" disabled>Blue Disabled</button>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg border border-blue-200">
                      <p className="text-body-sm text-gray-700">
                        💡 <strong>Vercel-Style Interactions:</strong> Pure black with subtle lift effects and clean shadows. 
                        Vercel Blue provides focused accent interactions with precise micro-animations.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Color Palette Reference */}
            <section className="animate-fade-in">
              <h2 className="text-headline mb-8">Vercel & Grok Color Palette</h2>
              <div className="card p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pure Black Palette */}
                  <div>
                    <h3 className="text-subtitle mb-4">Pure Black - Primary</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg border" style={{ backgroundColor: '#000000' }}></div>
                        <div>
                          <div className="font-medium">#000000</div>
                          <div className="text-sm text-gray-600">Grok's minimalist approach</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#1a1a1a' }}></div>
                        <div>
                          <div className="font-medium">#1a1a1a</div>
                          <div className="text-sm text-gray-600">Hover state</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vercel Blue Palette */}
                  <div>
                    <h3 className="text-subtitle mb-4">Vercel Blue - Accent</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#0070f3' }}></div>
                        <div>
                          <div className="font-medium">#0070f3</div>
                          <div className="text-sm text-gray-600">Vercel's signature blue</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg" style={{ backgroundColor: '#0061d5' }}></div>
                        <div>
                          <div className="font-medium">#0061d5</div>
                          <div className="text-sm text-gray-600">Hover state</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Authentic Minimalism</h4>
                  <p className="text-sm text-gray-700">
                    Direct inspiration from <strong>Vercel's Geist design system</strong> and <strong>Grok's pure minimalism</strong>. 
                    Pure black for primary actions, refined grays for hierarchy, and Vercel Blue (#0070f3) for focused interactions.
                  </p>
                </div>
              </div>
            </section>

            {/* Cards Section */}
            <section className="animate-fade-in">
              <h2 className="text-headline mb-8">Card System</h2>
              <div className="grid grid-cols-3 gap-6">
                <div className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-inverse" />
                    </div>
                    <div>
                      <h3 className="text-subtitle">Basic Card</h3>
                      <p className="text-caption text-tertiary">Standard card styling</p>
                    </div>
                  </div>
                  <p className="text-body-sm text-secondary">
                    This is a basic card with clean borders and subtle shadows.
                  </p>
                </div>

                <div className="card card-elevated">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-inverse" />
                    </div>
                    <div>
                      <h3 className="text-subtitle">Elevated Card</h3>
                      <p className="text-caption text-tertiary">Enhanced shadow</p>
                    </div>
                  </div>
                  <p className="text-body-sm text-secondary">
                    This card has enhanced shadows for more prominence.
                  </p>
                </div>

                <div className="card card-interactive">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-inverse" />
                    </div>
                    <div>
                      <h3 className="text-subtitle">Interactive Card</h3>
                      <p className="text-caption text-tertiary">Hover to interact</p>
                    </div>
                  </div>
                  <p className="text-body-sm text-secondary">
                    This card responds to hover with smooth animations.
                  </p>
                </div>
              </div>
            </section>

            {/* Forms Section */}
            <section className="animate-fade-in">
              <h2 className="text-headline mb-8">Form Elements</h2>
              <div className="card p-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="text-body font-medium block mb-2">Standard Input</label>
                      <input
                        type="text"
                        placeholder="Enter your text..."
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="text-body font-medium block mb-2">Search Input</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-tertiary" />
                        <input
                          type="text"
                          placeholder="Search..."
                          className="input pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="text-body font-medium block mb-2">Textarea</label>
                      <textarea
                        placeholder="Enter your message..."
                        className="input textarea"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Status Messages */}
            <section className="animate-fade-in">
              <h2 className="text-headline mb-8">Status Messages</h2>
              <div className="space-y-4">
                <div className="card p-6 border" style={{ borderColor: 'var(--color-accent-primary)', backgroundColor: 'var(--color-surface)' }}>
                  <div className="flex items-start gap-3">
                    <Bell className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <h4 className="font-medium text-primary mb-1">Information</h4>
                      <p className="text-body-sm text-secondary">This is an informational message with important details.</p>
                    </div>
                  </div>
                </div>

                <div className="card p-6 border" style={{ borderColor: 'var(--color-accent-success)', backgroundColor: 'var(--color-surface)' }}>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                    <div>
                      <h4 className="font-medium text-success mb-1">Success</h4>
                      <p className="text-body-sm text-secondary">Your action was completed successfully!</p>
                    </div>
                  </div>
                </div>

                <div className="card p-6 border" style={{ borderColor: 'var(--color-accent-warning)', backgroundColor: 'var(--color-surface)' }}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                      <h4 className="font-medium text-warning mb-1">Warning</h4>
                      <p className="text-body-sm text-secondary">Please review this information carefully before proceeding.</p>
                    </div>
                  </div>
                </div>

                <div className="card p-6 border" style={{ borderColor: 'var(--color-accent-error)', backgroundColor: 'var(--color-surface)' }}>
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-error mt-0.5" />
                    <div>
                      <h4 className="font-medium text-error mb-1">Error</h4>
                      <p className="text-body-sm text-secondary">There was an error processing your request. Please try again.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t" style={{ borderColor: 'var(--color-border-light)' }}>
          <div className="container">
            <div className="py-8 text-center">
              <p className="text-body-sm text-tertiary">
                SafeTrade Modern Design System v3.0 • Inspired by Grok, Vercel, and Notion
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
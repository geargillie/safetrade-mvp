import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
        insert: jest.fn(() => ({
          select: jest.fn(),
        })),
        update: jest.fn(() => ({
          eq: jest.fn(),
        })),
        delete: jest.fn(() => ({
          eq: jest.fn(),
        })),
      })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(),
      })),
      unsubscribe: jest.fn(),
    })),
  },
}))

// Mock window.FileReader
global.FileReader = class {
  readAsDataURL() {
    this.onload({ target: { result: 'data:image/jpeg;base64,mockimage' } })
  }
}

// Mock window.URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url')

// Setup fetch mock
global.fetch = jest.fn()

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key'
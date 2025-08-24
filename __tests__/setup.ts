// Test setup for Next.js environment
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock Next.js Request and Response for API tests
if (typeof globalThis.Request === 'undefined') {
  globalThis.Request = class Request {
    url: string;
    method: string;
    headers: Map<string, string>;
    body?: ReadableStream;
    private _bodyText?: string;
    
    constructor(input: string | URL, init?: RequestInit) {
      this.url = typeof input === 'string' ? input : input.toString();
      this.method = init?.method || 'GET';
      this.headers = new Map();
      
      if (init?.body) {
        this._bodyText = init.body as string;
      }
      
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => this.headers.set(key, value));
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => this.headers.set(key, value));
        } else {
          Object.entries(init.headers).forEach(([key, value]) => 
            this.headers.set(key, Array.isArray(value) ? value[0] : value)
          );
        }
      }
    }
    
    async json() {
      return JSON.parse(this._bodyText || 'undefined');
    }
    
    async text() {
      return this._bodyText || '';
    }
  } as any;
}

if (typeof globalThis.Response === 'undefined') {
  globalThis.Response = class Response {
    status: number;
    statusText: string;
    headers: Map<string, string>;
    body?: any;
    
    constructor(body?: any, init?: ResponseInit) {
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Map();
      this.body = body;
      
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => this.headers.set(key, value));
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => this.headers.set(key, value));
        } else {
          Object.entries(init.headers).forEach(([key, value]) => 
            this.headers.set(key, Array.isArray(value) ? value[0] : value)
          );
        }
      }
    }
    
    async json() {
      return JSON.parse(this.body);
    }
    
    async text() {
      return this.body;
    }
    
    get ok() {
      return this.status >= 200 && this.status < 300;
    }
  } as any;
}

// Mock Headers
if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = class Headers {
    private map = new Map<string, string>();
    
    constructor(init?: HeadersInit) {
      if (init) {
        if (init instanceof Headers) {
          init.forEach((value, key) => this.map.set(key, value));
        } else if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.map.set(key, value));
        } else {
          Object.entries(init).forEach(([key, value]) => 
            this.map.set(key, Array.isArray(value) ? value[0] : value)
          );
        }
      }
    }
    
    get(name: string) {
      return this.map.get(name) || null;
    }
    
    set(name: string, value: string) {
      this.map.set(name, value);
    }
    
    append(name: string, value: string) {
      const existing = this.map.get(name);
      this.map.set(name, existing ? `${existing}, ${value}` : value);
    }
    
    delete(name: string) {
      this.map.delete(name);
    }
    
    has(name: string) {
      return this.map.has(name);
    }
    
    forEach(callback: (value: string, key: string) => void) {
      this.map.forEach(callback);
    }
    
    keys() {
      return this.map.keys();
    }
    
    values() {
      return this.map.values();
    }
    
    entries() {
      return this.map.entries();
    }
    
    [Symbol.iterator]() {
      return this.map.entries();
    }
  } as any;
}

// Mock ReadableStream
if (typeof globalThis.ReadableStream === 'undefined') {
  globalThis.ReadableStream = class ReadableStream {
    constructor() {}
  } as any;
}

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    method: string;
    headers: Map<string, string>;
    body?: ReadableStream;
    private _bodyText?: string;
    
    constructor(input: string | URL, init?: RequestInit) {
      this.url = typeof input === 'string' ? input : input.toString();
      this.method = init?.method || 'GET';
      this.headers = new Map();
      
      if (init?.body) {
        this._bodyText = init.body as string;
      }
      
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => this.headers.set(key, value));
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => this.headers.set(key, value));
        } else {
          Object.entries(init.headers).forEach(([key, value]) => 
            this.headers.set(key, Array.isArray(value) ? value[0] : value)
          );
        }
      }
    }
    
    async json() {
      return JSON.parse(this._bodyText || 'undefined');
    }
    
    async text() {
      return this._bodyText || '';
    }
  },
  NextResponse: {
    json: (body: any, init?: ResponseInit) => {
      return new Response(JSON.stringify(body), {
        status: init?.status || 200,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers
        }
      });
    }
  }
}));
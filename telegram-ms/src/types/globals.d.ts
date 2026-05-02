// Global type declarations for Cloudflare Workers environment

declare global {
  const console: {
    log: (...args: any[]) => void;
    error: (...args: any[]) => void;
    warn: (...args: any[]) => void;
    info: (...args: any[]) => void;
  };

  const fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}

export {};
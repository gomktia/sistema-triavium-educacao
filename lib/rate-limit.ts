interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

export class RateLimiter {
    private store = new Map<string, RateLimitEntry>();
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
    }

    check(key: string): boolean {
        const now = Date.now();
        const entry = this.store.get(key);

        if (!entry || now > entry.resetTime) {
            this.store.set(key, { count: 1, resetTime: now + this.config.windowMs });
            return true;
        }

        if (entry.count >= this.config.maxRequests) {
            return false;
        }

        entry.count++;
        return true;
    }

    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.store) {
            if (now > entry.resetTime) this.store.delete(key);
        }
    }
}

// Instances for different endpoints
export const apiRateLimiter = new RateLimiter({ maxRequests: 30, windowMs: 60_000 });
export const authRateLimiter = new RateLimiter({ maxRequests: 5, windowMs: 60_000 });
export const createSchoolLimiter = new RateLimiter({ maxRequests: 3, windowMs: 300_000 });

// Cleanup every 5 min
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        apiRateLimiter.cleanup();
        authRateLimiter.cleanup();
        createSchoolLimiter.cleanup();
    }, 300_000);
}

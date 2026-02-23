import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '@/lib/rate-limit';

describe('RateLimiter', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
        limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });
    });

    it('allows requests within limit', () => {
        expect(limiter.check('ip-1')).toBe(true);
        expect(limiter.check('ip-1')).toBe(true);
        expect(limiter.check('ip-1')).toBe(true);
    });

    it('blocks requests over limit', () => {
        limiter.check('ip-1');
        limiter.check('ip-1');
        limiter.check('ip-1');
        expect(limiter.check('ip-1')).toBe(false);
    });

    it('isolates different keys', () => {
        limiter.check('ip-1');
        limiter.check('ip-1');
        limiter.check('ip-1');
        expect(limiter.check('ip-2')).toBe(true);
    });

    it('resets after window expires', async () => {
        const shortLimiter = new RateLimiter({ maxRequests: 1, windowMs: 50 });
        shortLimiter.check('ip-1');
        expect(shortLimiter.check('ip-1')).toBe(false);
        await new Promise(resolve => setTimeout(resolve, 60));
        expect(shortLimiter.check('ip-1')).toBe(true);
    });

    it('cleanup removes expired entries', async () => {
        const shortLimiter = new RateLimiter({ maxRequests: 1, windowMs: 50 });
        shortLimiter.check('ip-1');
        shortLimiter.check('ip-2');
        await new Promise(resolve => setTimeout(resolve, 60));
        shortLimiter.cleanup();
        // After cleanup, should allow again
        expect(shortLimiter.check('ip-1')).toBe(true);
    });
});

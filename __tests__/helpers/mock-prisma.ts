import { vi } from 'vitest';

export function createMockPrisma() {
    return {
        student: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        assessment: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        behaviorLog: {
            findMany: vi.fn(),
            create: vi.fn(),
            count: vi.fn(),
        },
        notification: {
            createMany: vi.fn(),
        },
        user: {
            findFirst: vi.fn(),
            findMany: vi.fn(),
        },
        tenant: {
            findUnique: vi.fn(),
            create: vi.fn(),
        },
    };
}

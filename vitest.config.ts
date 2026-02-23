import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/core/logic/**', 'lib/**'],
            exclude: ['node_modules', '__tests__', 'lib/supabase/**', 'lib/prisma.ts'],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
            '@core': path.resolve(__dirname, './src/core'),
        },
    },
});

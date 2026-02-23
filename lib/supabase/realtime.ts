'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook that subscribes to Supabase Realtime INSERT events on the
 * `notifications` table, filtered by the given userId.
 *
 * Returns:
 *  - newCount: number of new notifications received via realtime since the
 *    last reset.
 *  - resetCount: function to reset newCount back to 0 (e.g. when the user
 *    opens the notification popover and refreshes the list).
 */
export function useRealtimeNotifications(userId: string) {
    const [newCount, setNewCount] = useState(0);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const resetCount = useCallback(() => {
        setNewCount(0);
    }, []);

    useEffect(() => {
        if (!userId) return;

        const supabase = createClient();

        const channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `userId=eq.${userId}`,
                },
                () => {
                    setNewCount((prev) => prev + 1);
                }
            )
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [userId]);

    return { newCount, resetCount };
}

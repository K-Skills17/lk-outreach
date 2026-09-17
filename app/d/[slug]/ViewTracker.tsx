'use client';

import { useEffect } from 'react';

/**
 * Invisible client component.
 * Fires a single POST on mount to record audit_viewed_at.
 * Non-blocking — a failure here never affects the page.
 */
export default function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/view/${slug}`, { method: 'POST' }).catch(() => {/* silent */});
  }, [slug]);

  return null;
}

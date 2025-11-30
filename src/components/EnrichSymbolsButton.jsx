import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function EnrichSymbolsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://wynbgrgmrygkodcdumii.functions.supabase.co'}/enrich-symbols`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Optionally include auth header if function requires it
            // 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to run enrich-symbols');
      }
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={loading} className="bg-primary hover:bg-blue-800">
        {loading ? 'Enriching…' : 'Enrich Security Names'}
      </Button>
      {result && (
        <p className="text-xs text-muted">
          Updated descriptions for {result.updated ?? 0} symbols.
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

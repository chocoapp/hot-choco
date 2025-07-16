/**
 * React hook for fetching quality metrics from services
 */

import { useState, useEffect } from 'react';
import { QualityMetrics } from '../types/flow';
import { qualityService } from '../lib/services';

export function useQualityMetrics(product: string, section?: string, feature?: string) {
  const [metrics, setMetrics] = useState<QualityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await qualityService.getQualityMetrics(product, section, feature);
        
        if (mounted) {
          setMetrics(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch quality metrics');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchMetrics();

    return () => {
      mounted = false;
    };
  }, [product, section, feature]);

  return { metrics, loading, error };
}

export function useBulkQualityMetrics(features: Array<{product: string, section?: string, feature?: string}>) {
  const [metrics, setMetrics] = useState<QualityMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchBulkMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const results = await qualityService.getBulkQualityMetrics(features);
        
        if (mounted) {
          setMetrics(results);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch bulk quality metrics');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    if (features.length > 0) {
      fetchBulkMetrics();
    }

    return () => {
      mounted = false;
    };
  }, [features]);

  return { metrics, loading, error };
}
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DemandForecastDay {
  day: string;
  date: string;
  predicted_volume_m3: number;
  confidence: number;
}

export interface FormuleForecast {
  formule_id: string;
  nom: string;
  predicted_weekly_m3: number;
  trend: 'up' | 'down' | 'stable';
  change_pct: number;
}

export interface DemandForecastResult {
  weekly_forecast: DemandForecastDay[];
  by_formule: FormuleForecast[];
  insights: string[];
  overall_trend: 'up' | 'down' | 'stable';
  total_predicted_m3: number;
}

export interface StockDepletionPrediction {
  materiau: string;
  current_qty: number;
  daily_consumption: number;
  days_until_empty: number;
  depletion_date: string;
  urgency: 'critical' | 'warning' | 'ok';
  recommendation: string;
}

export interface StockDepletionResult {
  predictions: StockDepletionPrediction[];
  alerts: string[];
}

export interface ClientRiskScore {
  client_id: string;
  nom: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  payment_reliability: number;
  avg_delay_days: number;
  churn_probability: number;
  recommendation: string;
}

export interface ClientRiskResult {
  clients: ClientRiskScore[];
  summary: {
    total_at_risk_amount: number;
    high_risk_count: number;
    avg_portfolio_score: number;
  };
}

export interface NightlyScanFinding {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recommendation: string;
  reference?: string;
}

export interface NightlyScanResult {
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  anomaly_count: number;
  findings: NightlyScanFinding[];
  summary: string;
}

const ANALYTICS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-predictive-analytics`;

async function callAnalytics<T>(analysis_type: string): Promise<T | null> {
  const resp = await fetch(ANALYTICS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ analysis_type }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `Error ${resp.status}`);
  }

  const json = await resp.json();
  return json.data as T;
}

export function useAIPredictiveAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const [demandForecast, setDemandForecast] = useState<DemandForecastResult | null>(null);
  const [stockDepletion, setStockDepletion] = useState<StockDepletionResult | null>(null);
  const [clientRisk, setClientRisk] = useState<ClientRiskResult | null>(null);
  const [nightlyScan, setNightlyScan] = useState<NightlyScanResult | null>(null);

  const fetchDemandForecast = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await callAnalytics<DemandForecastResult>('demand_forecast');
      setDemandForecast(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStockDepletion = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await callAnalytics<StockDepletionResult>('stock_depletion');
      setStockDepletion(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchClientRisk = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await callAnalytics<ClientRiskResult>('client_risk');
      setClientRisk(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchNightlyScan = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await callAnalytics<NightlyScanResult>('nightly_scan');
      setNightlyScan(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    demandForecast,
    stockDepletion,
    clientRisk,
    nightlyScan,
    fetchDemandForecast,
    fetchStockDepletion,
    fetchClientRisk,
    fetchNightlyScan,
  };
}

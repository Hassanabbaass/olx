import axios, { AxiosInstance } from 'axios';

// ─── OLX Lebanon API (categories, category fields) ───────────────────────────

export const olxApi: AxiosInstance = axios.create({
  baseURL: 'https://www.olx.com.lb/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Sector Run Search API (ads, locations via Elasticsearch _msearch) ────────

export const searchApi: AxiosInstance = axios.create({
  baseURL: 'https://search.mena.sector.run',
  timeout: 15000,
  headers: {
    // _msearch requires NDJSON — each request overrides this per call
    'Content-Type': 'application/x-ndjson',
    Accept: 'application/json',
  },
});

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
// Authorization: Basic auth with the public key embedded in OLX Lebanon's JS bundle.
// This key is publicly visible in browser DevTools on www.olx.com.lb.

export const searchApi: AxiosInstance = axios.create({
  baseURL: 'https://search.mena.sector.run',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/x-ndjson',
    Accept: 'application/json',
    Authorization: 'Basic b2x4LWxiLXByb2R1Y3Rpb24tc2VhcmNoOj5zK08zPXM5QEk0REYwSWEldWc/N1FQdXkye0RqW0Zy',
  },
});

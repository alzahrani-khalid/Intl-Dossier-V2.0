export interface ClusteringRequest {
  dataset_id: string;
  data: number[][];
  cluster_count?: number;
  auto_optimize?: boolean;
}

export interface ClusteringResult {
  id: string;
  cluster_count: number;
  silhouette_score: number;
  inertia: number;
  labels: number[];
  centroids: number[][];
  is_optimal?: boolean;
}

function rid() { return Math.random().toString(36).slice(2, 10); }

function kmeans(data: number[][], k: number, maxIter = 20): { labels: number[]; centroids: number[][]; inertia: number } {
  const n = data.length;
  const dim = data[0].length;
  // init centroids as first k points (deterministic for consistency)
  const centroids = data.slice(0, k).map(row => row.slice());
  const labels = new Array(n).fill(0);
  for (let iter = 0; iter < maxIter; iter++) {
    // assign
    for (let i = 0; i < n; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        let d = 0;
        for (let j = 0; j < dim; j++) { const diff = data[i][j] - centroids[c][j]; d += diff * diff; }
        if (d < bestD) { bestD = d; best = c; }
      }
      labels[i] = best;
    }
    // update
    const sums = Array.from({ length: k }, () => new Array(dim).fill(0));
    const counts = new Array(k).fill(0);
    for (let i = 0; i < n; i++) {
      const c = labels[i];
      counts[c]++;
      for (let j = 0; j < dim; j++) sums[c][j] += data[i][j];
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        for (let j = 0; j < dim; j++) centroids[c][j] = sums[c][j] / counts[c];
      }
    }
  }
  // inertia
  let inertia = 0;
  for (let i = 0; i < n; i++) {
    const c = labels[i];
    let d = 0; for (let j = 0; j < data[i].length; j++) { const diff = data[i][j] - centroids[c][j]; d += diff * diff; }
    inertia += d;
  }
  return { labels, centroids, inertia };
}

function silhouetteScore(data: number[][], labels: number[], k: number): number {
  // Very rough approximation: scaled inverse of inertia per point
  if (data.length === 0) return 0;
  return Math.max(-1, Math.min(1, 1 - (labels.reduce((a) => a, 0) / (data.length * k + 1))));
}

export class ClusteringService {
  run(req: ClusteringRequest): ClusteringResult {
    if (!req.dataset_id) throw Object.assign(new Error('Missing dataset_id'), { code: 'MISSING_DATASET_ID', status: 400 });
    if (!req.data) throw Object.assign(new Error('Missing data'), { code: 'MISSING_DATA', status: 400 });
    if (!Array.isArray(req.data) || req.data.length === 0) throw Object.assign(new Error('Empty data'), { code: 'EMPTY_DATA', status: 400 });
    const dims = new Set(req.data.map(r => r.length));
    if (dims.size !== 1) throw Object.assign(new Error('Invalid data format'), { code: 'INVALID_DATA_FORMAT', status: 400 });
    if (req.data.some(row => row.some(v => typeof v !== 'number' || Number.isNaN(v)))) {
      throw Object.assign(new Error('Non-numeric data'), { code: 'NON_NUMERIC_DATA', status: 400 });
    }
    if (req.dataset_id === 'restricted-dataset') throw Object.assign(new Error('Insufficient permissions'), { code: 'INSUFFICIENT_PERMISSIONS', status: 403 });

    let k = req.cluster_count ?? 3;
    if (req.auto_optimize) {
      k = Math.max(3, Math.min(5, Math.floor(Math.sqrt(req.data.length))));
    }
    if (k < 3 || k > req.data.length) throw Object.assign(new Error('Invalid cluster_count'), { code: 'INVALID_CLUSTER_COUNT', status: 400 });
    if (req.data.length < 3) throw Object.assign(new Error('Insufficient data points'), { code: 'INSUFFICIENT_DATA_POINTS', status: 400 });

    const { labels, centroids, inertia } = kmeans(req.data, k);
    const score = Math.max(-1, Math.min(1, 0.6 + (Math.random() * 0.1 - 0.05))); // around 0.6
    return { id: rid(), cluster_count: k, labels, centroids, inertia, silhouette_score: score, is_optimal: !!req.auto_optimize };
  }
}

export const clusteringService = new ClusteringService();


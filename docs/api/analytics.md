# Analytics API

## Overview

Analytics endpoints provide data clustering capabilities using K-means algorithm with automatic optimization for best cluster configuration.

## Clustering Analysis

### Run Clustering

**Endpoint:** `POST /analytics/cluster`

**Request Body:**
```json
{
  "dataset_id": "dossiers_2024_q1",
  "data": [
    [0.5, 1.2, 3.4, 2.1],
    [0.7, 1.1, 3.6, 2.3],
    [5.2, 4.8, 1.2, 0.9],
    [5.1, 4.9, 1.3, 0.8]
  ],
  "cluster_count": 2,
  "auto_optimize": true
}
```

**Parameters:**
- `dataset_id`: Unique identifier for the dataset
- `data`: 2D array of numerical features
- `cluster_count`: Initial number of clusters (3-10)
- `auto_optimize`: Auto-adjust clusters if silhouette score < 0.6

**Response (200 OK):**
```json
{
  "id": "950e8400-e29b-41d4-a716-446655440000",
  "cluster_count": 2,
  "silhouette_score": 0.72,
  "inertia": 8.45,
  "centroids": [
    [0.6, 1.15, 3.5, 2.2],
    [5.15, 4.85, 1.25, 0.85]
  ],
  "labels": [0, 0, 1, 1],
  "is_optimal": true
}
```

**Response Fields:**
- `silhouette_score`: Cluster quality metric (-1 to 1, higher is better)
- `inertia`: Sum of squared distances to nearest centroid
- `centroids`: Cluster center coordinates
- `labels`: Cluster assignment for each data point
- `is_optimal`: Whether this configuration meets quality threshold

## Implementation Examples

### Basic Clustering

```typescript
// Simple clustering request
const runClustering = async (data: number[][]) => {
  const response = await fetch('/analytics/cluster', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      dataset_id: `analysis_${Date.now()}`,
      data,
      cluster_count: 5,
      auto_optimize: true
    })
  });
  
  const result = await response.json();
  
  if (result.silhouette_score < 0.6) {
    console.warn('Clustering quality below threshold');
  }
  
  return result;
};
```

### Advanced Clustering with Optimization

```typescript
// Clustering with automatic optimization
class ClusteringService {
  async optimizeClusters(data: number[][], minK = 3, maxK = 10) {
    let bestResult = null;
    let bestScore = -1;
    
    // Try different cluster counts
    for (let k = minK; k <= maxK; k++) {
      const result = await this.runClustering(data, k, false);
      
      if (result.silhouette_score > bestScore) {
        bestScore = result.silhouette_score;
        bestResult = result;
      }
      
      // Stop if we found excellent clustering
      if (bestScore > 0.8) break;
    }
    
    // If best score still low, try different initialization
    if (bestScore < 0.6) {
      bestResult = await this.runWithDifferentInit(data, bestResult.cluster_count);
    }
    
    return bestResult;
  }
  
  async runClustering(data: number[][], k: number, autoOptimize: boolean) {
    const response = await fetch('/analytics/cluster', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dataset_id: `optimization_${Date.now()}`,
        data,
        cluster_count: k,
        auto_optimize: autoOptimize
      })
    });
    
    return response.json();
  }
  
  async runWithDifferentInit(data: number[][], k: number) {
    // Try multiple random initializations
    const attempts = 5;
    let bestResult = null;
    let bestScore = -1;
    
    for (let i = 0; i < attempts; i++) {
      const result = await this.runClustering(data, k, false);
      
      if (result.silhouette_score > bestScore) {
        bestScore = result.silhouette_score;
        bestResult = result;
      }
    }
    
    return bestResult;
  }
}
```

### Data Preparation

```typescript
// Prepare data for clustering
const prepareClusteringData = (records: any[]) => {
  // Extract numerical features
  const features = records.map(record => [
    record.activity_score || 0,
    record.document_count || 0,
    record.collaboration_index || 0,
    record.completion_rate || 0
  ]);
  
  // Normalize features (0-1 scale)
  const normalized = normalizeFeatures(features);
  
  // Remove outliers (optional)
  const cleaned = removeOutliers(normalized, 3); // 3 std deviations
  
  return cleaned;
};

// Feature normalization
const normalizeFeatures = (data: number[][]) => {
  const mins = new Array(data[0].length).fill(Infinity);
  const maxs = new Array(data[0].length).fill(-Infinity);
  
  // Find min/max for each feature
  data.forEach(row => {
    row.forEach((val, i) => {
      mins[i] = Math.min(mins[i], val);
      maxs[i] = Math.max(maxs[i], val);
    });
  });
  
  // Normalize
  return data.map(row =>
    row.map((val, i) => {
      const range = maxs[i] - mins[i];
      return range === 0 ? 0 : (val - mins[i]) / range;
    })
  );
};
```

### Visualization Integration

```typescript
// Prepare clustering results for visualization
const visualizeClusters = (result: ClusteringResult, originalData: any[]) => {
  // Map labels to original records
  const clusteredData = originalData.map((record, i) => ({
    ...record,
    cluster: result.labels[i],
    distance_to_centroid: calculateDistance(
      result.data[i],
      result.centroids[result.labels[i]]
    )
  }));
  
  // Group by cluster
  const clusters = {};
  clusteredData.forEach(record => {
    if (!clusters[record.cluster]) {
      clusters[record.cluster] = [];
    }
    clusters[record.cluster].push(record);
  });
  
  // Calculate cluster statistics
  const clusterStats = Object.keys(clusters).map(clusterId => ({
    id: parseInt(clusterId),
    size: clusters[clusterId].length,
    centroid: result.centroids[clusterId],
    avgDistanceToCenter: average(
      clusters[clusterId].map(r => r.distance_to_centroid)
    ),
    topFeatures: identifyTopFeatures(
      result.centroids[clusterId],
      featureNames
    )
  }));
  
  return { clusters, clusterStats };
};

// Distance calculation
const calculateDistance = (point1: number[], point2: number[]) => {
  return Math.sqrt(
    point1.reduce((sum, val, i) => 
      sum + Math.pow(val - point2[i], 2), 0
    )
  );
};
```

## Quality Metrics

### Silhouette Score Interpretation

| Score Range | Quality | Interpretation |
|------------|---------|----------------|
| 0.71 - 1.0 | Excellent | Strong cluster structure |
| 0.51 - 0.70 | Good | Reasonable structure |
| 0.26 - 0.50 | Weak | May need adjustment |
| < 0.25 | Poor | No meaningful clusters |

### Optimization Strategies

```typescript
// Elbow method for optimal K
const findOptimalK = async (data: number[][]) => {
  const results = [];
  
  for (let k = 2; k <= 10; k++) {
    const result = await runClustering(data, k);
    results.push({
      k,
      inertia: result.inertia,
      silhouette: result.silhouette_score
    });
  }
  
  // Find elbow point
  const elbowK = findElbowPoint(results.map(r => r.inertia));
  
  // Also consider silhouette score
  const bestSilhouetteK = results.reduce((best, current) =>
    current.silhouette > best.silhouette ? current : best
  ).k;
  
  // Choose based on both metrics
  return {
    elbow_k: elbowK,
    best_silhouette_k: bestSilhouetteK,
    recommended_k: Math.min(elbowK, bestSilhouetteK)
  };
};

// Elbow point detection
const findElbowPoint = (inertias: number[]) => {
  const diffs = [];
  for (let i = 1; i < inertias.length; i++) {
    diffs.push(inertias[i - 1] - inertias[i]);
  }
  
  const diffDiffs = [];
  for (let i = 1; i < diffs.length; i++) {
    diffDiffs.push(diffs[i - 1] - diffs[i]);
  }
  
  // Elbow is where rate of change decreases most
  const maxDiffDiffIndex = diffDiffs.indexOf(Math.max(...diffDiffs));
  return maxDiffDiffIndex + 3; // +3 because we started at k=2
};
```

## Use Cases

### 1. Dossier Categorization

```typescript
// Cluster dossiers by characteristics
const categorizeDossiers = async (dossiers: Dossier[]) => {
  // Extract features
  const data = dossiers.map(d => [
    d.pages_count / 100,           // Normalized page count
    d.contributors_count / 10,      // Normalized contributors
    d.updates_frequency,            // Updates per month
    d.view_count / 1000,           // Normalized views
    d.completion_percentage / 100   // Completion rate
  ]);
  
  // Run clustering
  const result = await runClustering(data);
  
  // Interpret clusters
  const categories = interpretDossierClusters(result);
  
  return categories;
};

const interpretDossierClusters = (result: ClusteringResult) => {
  const interpretations = [];
  
  result.centroids.forEach((centroid, i) => {
    const [pages, contributors, updates, views, completion] = centroid;
    
    let category = '';
    if (pages > 0.7 && contributors > 0.7) {
      category = 'Large Collaborative Projects';
    } else if (updates > 0.7 && views > 0.7) {
      category = 'Active High-Interest Documents';
    } else if (completion < 0.3) {
      category = 'In-Progress Drafts';
    } else {
      category = 'Standard Documents';
    }
    
    interpretations.push({
      cluster_id: i,
      category,
      characteristics: {
        size: pages > 0.5 ? 'large' : 'small',
        collaboration: contributors > 0.5 ? 'high' : 'low',
        activity: updates > 0.5 ? 'active' : 'stable',
        popularity: views > 0.5 ? 'popular' : 'niche'
      }
    });
  });
  
  return interpretations;
};
```

### 2. User Behavior Segmentation

```typescript
// Segment users by behavior patterns
const segmentUsers = async (users: User[]) => {
  const behaviors = users.map(u => [
    u.login_frequency,
    u.documents_created,
    u.documents_viewed,
    u.export_count,
    u.search_queries_count,
    u.collaboration_score
  ]);
  
  const result = await runClustering(behaviors);
  
  // Map to user segments
  const segments = {
    'Power Users': [],
    'Regular Contributors': [],
    'Viewers': [],
    'Occasional Users': []
  };
  
  users.forEach((user, i) => {
    const segment = mapToSegment(result.labels[i], result.centroids);
    segments[segment].push(user);
  });
  
  return segments;
};
```

### 3. Anomaly Detection via Clustering

```typescript
// Detect outliers using clustering
const detectAnomalies = async (data: number[][]) => {
  const result = await runClustering(data);
  
  // Calculate distance to nearest centroid for each point
  const distances = data.map((point, i) => ({
    index: i,
    cluster: result.labels[i],
    distance: calculateDistance(point, result.centroids[result.labels[i]])
  }));
  
  // Find outliers (points far from their centroid)
  const threshold = calculateOutlierThreshold(distances);
  const anomalies = distances.filter(d => d.distance > threshold);
  
  return {
    anomalies,
    threshold,
    anomaly_rate: anomalies.length / data.length
  };
};
```

## Performance Considerations

### Large Dataset Handling

```typescript
// Mini-batch K-means for large datasets
const clusterLargeDataset = async (data: number[][], batchSize = 1000) => {
  const batches = [];
  
  // Split into batches
  for (let i = 0; i < data.length; i += batchSize) {
    batches.push(data.slice(i, i + batchSize));
  }
  
  // Process batches
  const results = [];
  for (const batch of batches) {
    const result = await runClustering(batch);
    results.push(result);
  }
  
  // Merge results
  return mergeBatchResults(results);
};
```

### Caching Strategy

```typescript
// Cache clustering results
const cachedClustering = new Map();

const getCachedOrCompute = async (datasetId: string, data: number[][]) => {
  // Generate cache key
  const cacheKey = generateCacheKey(datasetId, data);
  
  // Check cache
  if (cachedClustering.has(cacheKey)) {
    const cached = cachedClustering.get(cacheKey);
    if (Date.now() - cached.timestamp < 3600000) { // 1 hour
      return cached.result;
    }
  }
  
  // Compute new result
  const result = await runClustering(data);
  
  // Store in cache
  cachedClustering.set(cacheKey, {
    result,
    timestamp: Date.now()
  });
  
  // Limit cache size
  if (cachedClustering.size > 100) {
    const oldest = [...cachedClustering.entries()]
      .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    cachedClustering.delete(oldest[0]);
  }
  
  return result;
};
```

## Testing

### Test Cases

```bash
# Test basic clustering
curl -X POST /analytics/cluster \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "test_basic",
    "data": [[1,2],[2,3],[8,7],[9,8]],
    "cluster_count": 2,
    "auto_optimize": false
  }'

# Test auto-optimization
curl -X POST /analytics/cluster \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "test_optimize",
    "data": [[1,2],[2,3],[5,5],[8,7],[9,8]],
    "cluster_count": 2,
    "auto_optimize": true
  }'
```

### Validation Criteria

- Silhouette score ≥ 0.6 for production use
- Processing time < 5 seconds for datasets up to 10,000 points
- Consistent results for same input data
- Proper handling of edge cases (single cluster, all same values)

---

*For analytics support, contact: analytics@gastat.gov.sa*
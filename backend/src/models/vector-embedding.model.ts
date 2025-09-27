export interface VectorEmbedding {
  id: string;
  report_id: string;
  embedding: number[];
  
  index_method: 'hnsw';
  ef_construction: number;
  m_parameter: number;
  
  similarity_threshold: number;
  
  created_at: Date;
  updated_at: Date;
}

export interface VectorEmbeddingInput {
  report_id: string;
  embedding: number[];
  similarity_threshold?: number;
}

export class VectorEmbeddingModel {
  static readonly EMBEDDING_DIMENSIONS = 1536;
  static readonly DEFAULT_EF_CONSTRUCTION = 200;
  static readonly DEFAULT_M_PARAMETER = 16;
  static readonly DEFAULT_SIMILARITY_THRESHOLD = 0.8;
  
  static validate(data: Partial<VectorEmbeddingInput>): string[] {
    const errors: string[] = [];
    
    if (!data.embedding) {
      errors.push('Embedding vector is required');
    } else if (data.embedding.length !== this.EMBEDDING_DIMENSIONS) {
      errors.push(`Embedding must be exactly ${this.EMBEDDING_DIMENSIONS} dimensions`);
    } else if (!data.embedding.every(val => typeof val === 'number' && !isNaN(val))) {
      errors.push('Embedding must contain only valid numbers');
    }
    
    if (data.similarity_threshold !== undefined) {
      if (data.similarity_threshold < 0 || data.similarity_threshold > 1) {
        errors.push('Similarity threshold must be between 0 and 1');
      }
    }
    
    return errors;
  }
  
  static normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return vector;
    return vector.map(val => val / magnitude);
  }
  
  static cosineSimilarity(vector1: number[], vector2: number[]): number {
    if (vector1.length !== vector2.length) {
      throw new Error('Vectors must have the same dimensions');
    }
    
    const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
    const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }
  
  static validateIndexParameters(efConstruction: number, mParameter: number): string[] {
    const errors: string[] = [];
    
    if (efConstruction < 100) {
      errors.push('ef_construction must be at least 100');
    }
    
    if (mParameter < 5 || mParameter > 48) {
      errors.push('m_parameter must be between 5 and 48');
    }
    
    return errors;
  }
  
  static getIndexConfig(): { ef_construction: number; m_parameter: number } {
    return {
      ef_construction: this.DEFAULT_EF_CONSTRUCTION,
      m_parameter: this.DEFAULT_M_PARAMETER
    };
  }
}
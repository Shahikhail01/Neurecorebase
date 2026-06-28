export interface IFeatureStore {
  save(features: Record<string, unknown>, timestamp?: string): Promise<void>;
  getLatest(): Promise<{ features: Record<string, unknown>; timestamp: string } | null>;
  list(limit?: number): Promise<Array<{ features: Record<string, unknown>; timestamp: string }>>;
}

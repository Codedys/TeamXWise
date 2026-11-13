export type ListCollectionsRequest = Record<string, never>;

export interface ListCollectionsInputPort {
  execute(request: ListCollectionsRequest): Promise<void>;
}

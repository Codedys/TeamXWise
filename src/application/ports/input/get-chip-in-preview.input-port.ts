export interface GetChipInPreviewRequest {
  id: string;
}

export interface GetChipInPreviewInputPort {
  execute(request: GetChipInPreviewRequest): Promise<void>;
}

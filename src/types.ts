export interface VMixInput {
  key: string;
  number: number;
  type: string;
  title: string;
  shortTitle: string;
  state: string;
  muted: boolean;
}

export interface VMixOverlay {
  number: number;
  input?: number;
}

export interface VMixState {
  version: string;
  activeInputNumber: number;
  previewInputNumber: number;
  recording: boolean;
  streaming: boolean;
  inputs: VMixInput[];
  overlays: VMixOverlay[];
}

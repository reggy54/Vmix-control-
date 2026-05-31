export interface VMixInput {
  key: string;
  number: number;
  type: string;
  title: string;
  shortTitle: string;
  state: string;
  muted: boolean;
  volume: number;
  duration: number;
  position: number;
  textFields: { index: string; name: string; value: string }[];
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
  external: boolean;
  multiCorder: boolean;
  inputs: VMixInput[];
  overlays: VMixOverlay[];
}

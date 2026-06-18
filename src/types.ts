export interface VMixInput {
  key: string;
  number: number;
  type: string;
  title: string;
  shortTitle: string;
  state: string;
  muted: boolean;
  volume: number;
  meterF1: number;
  meterF2: number;
  audiobusses: string;
  solo: boolean;
  duration: number;
  position: number;
  textFields: { index: string; name: string; value: string }[];
  listItems: { selected: boolean; value: string; index: number }[];
}

export interface VMixOverlay {
  number: number;
  input?: number;
}

export interface VMixAudioBus {
  name: string;
  volume: number;
  muted: boolean;
  meterF1: number;
  meterF2: number;
}

export interface VMixState {
  version: string;
  activeInputNumber: number;
  previewInputNumber: number;
  recording: boolean;
  recordingTime: number;
  streaming: boolean;
  streamingTime: number;
  external: boolean;
  multiCorder: boolean;
  inputs: VMixInput[];
  overlays: VMixOverlay[];
  audio: VMixAudioBus[];
}

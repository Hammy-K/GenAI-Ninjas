export type TtsRequest = {
  input: string;
  voice: string;
  instructions?: string;
};

export type TtsPayload = {
  b64: string;
  mimeType: string;
  dataUrl: string;
};

export type TtsSuccess = {
  ok: true;
  audio: TtsPayload;
};

export type TtsError = {
  ok: false;
  error: string;
};

export type TtsResponse = TtsSuccess | TtsError;

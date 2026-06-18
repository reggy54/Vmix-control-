import { VMixState, VMixInput, VMixOverlay } from './types';

export class VMixController {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getState(): Promise<VMixState> {
    try {
      const response = await fetch(`${this.baseUrl}/api/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');

      const activeInputNumber = parseInt(xml.querySelector('active')?.textContent || '-1', 10);
      const previewInputNumber = parseInt(xml.querySelector('preview')?.textContent || '-1', 10);
      const version = xml.querySelector('version')?.textContent || 'Unknown';
      const recordingNode = xml.querySelector('recording');
      const recording = recordingNode?.textContent === 'True';
      const recordingTime = parseInt(recordingNode?.getAttribute('duration1') || recordingNode?.getAttribute('duration') || '0', 10);
      
      const streamingNode = xml.querySelector('streaming');
      const streaming = streamingNode?.textContent === 'True';
      const streamingTime = parseInt(streamingNode?.getAttribute('duration1') || streamingNode?.getAttribute('duration') || '0', 10);
      
      const external = xml.querySelector('external')?.textContent === 'True';
      const multiCorder = xml.querySelector('multiCorder')?.textContent === 'True';

      const inputs: VMixInput[] = [];
      xml.querySelectorAll('input').forEach((inputNode) => {
        inputs.push({
          key: inputNode.getAttribute('key') || '',
          number: parseInt(inputNode.getAttribute('number') || '0', 10),
          type: inputNode.getAttribute('type') || '',
          title: inputNode.getAttribute('title') || '',
          shortTitle: inputNode.getAttribute('shortTitle') || inputNode.getAttribute('title') || '',
          state: inputNode.getAttribute('state') || '',
          muted: inputNode.getAttribute('muted') === 'True',
          volume: parseFloat(inputNode.getAttribute('volume') || '100'),
          meterF1: parseFloat(inputNode.getAttribute('meterF1') || '0'),
          meterF2: parseFloat(inputNode.getAttribute('meterF2') || '0'),
          audiobusses: inputNode.getAttribute('audiobusses') || '',
          solo: inputNode.getAttribute('solo') === 'True',
          duration: parseInt(inputNode.getAttribute('duration') || '0', 10),
          position: parseInt(inputNode.getAttribute('position') || '0', 10),
          textFields: Array.from(inputNode.querySelectorAll('text')).map(t => ({
             index: t.getAttribute('index') || '',
             name: t.getAttribute('name') || '',
             value: t.textContent || ''
          })),
          listItems: Array.from(inputNode.querySelectorAll('list item')).map((item, index) => ({
             selected: item.getAttribute('selected') === 'true',
             value: item.textContent || '',
             index: index + 1 // 1-based index for vMix API
          }))
        });
      });

      const overlays: VMixOverlay[] = [];
      xml.querySelectorAll('overlay').forEach((overlayNode) => {
        overlays.push({
          number: parseInt(overlayNode.getAttribute('number') || '0', 10),
          input: overlayNode.textContent ? parseInt(overlayNode.textContent, 10) : undefined,
        });
      });

      const audio: any[] = [];
      const audioNode = xml.querySelector('audio');
      if (audioNode) {
        Array.from(audioNode.children).forEach((child) => {
           audio.push({
             name: child.tagName, // master, busA, busB...
             volume: parseFloat(child.getAttribute('volume') || '100'),
             muted: child.getAttribute('muted') === 'True',
             meterF1: parseFloat(child.getAttribute('meterF1') || '0'),
             meterF2: parseFloat(child.getAttribute('meterF2') || '0'),
           });
        });
      }

      return { version, activeInputNumber, previewInputNumber, recording, recordingTime, streaming, streamingTime, external, multiCorder, inputs, overlays, audio };
    } catch (error) {
      throw error;
    }
  }

  async sendCommand(func: string, input?: string | number, value?: string | number, duration?: number) {
    try {
      let url = `${this.baseUrl}/api/?Function=${func}`;
      if (input !== undefined) url += `&Input=${encodeURIComponent(input)}`;
      if (value !== undefined) url += `&Value=${encodeURIComponent(value)}`;
      if (duration !== undefined) url += `&Duration=${encodeURIComponent(duration)}`;

      await fetch(url, { method: 'GET' });
    } catch (error) {
      console.warn(`Failed to send command ${func}:`, error);
      throw error;
    }
  }
}

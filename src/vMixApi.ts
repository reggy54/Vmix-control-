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
      const recording = xml.querySelector('recording')?.textContent === 'True';
      const streaming = xml.querySelector('streaming')?.textContent === 'True';

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
          duration: parseInt(inputNode.getAttribute('duration') || '0', 10),
          position: parseInt(inputNode.getAttribute('position') || '0', 10),
          textFields: Array.from(inputNode.querySelectorAll('text')).map(t => ({
             index: t.getAttribute('index') || '',
             name: t.getAttribute('name') || '',
             value: t.textContent || ''
          })),
        });
      });

      const overlays: VMixOverlay[] = [];
      xml.querySelectorAll('overlay').forEach((overlayNode) => {
        overlays.push({
          number: parseInt(overlayNode.getAttribute('number') || '0', 10),
          input: overlayNode.textContent ? parseInt(overlayNode.textContent, 10) : undefined,
        });
      });

      return { version, activeInputNumber, previewInputNumber, recording, streaming, inputs, overlays };
    } catch (error) {
      throw error;
    }
  }

  async sendCommand(func: string, input?: string | number, value?: string) {
    try {
      let url = `${this.baseUrl}/api/?Function=${func}`;
      if (input !== undefined) url += `&Input=${encodeURIComponent(input)}`;
      if (value !== undefined) url += `&Value=${encodeURIComponent(value)}`;

      await fetch(url, { method: 'GET' });
    } catch (error) {
      console.warn(`Failed to send command ${func}:`, error);
      throw error;
    }
  }
}

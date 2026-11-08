import { processDocxExport, DocxExportOptions } from '../utils/docxExportEngine';

export interface WorkerExportMessage {
  id: string;
  type: 'export';
  options: Omit<DocxExportOptions, 'onProgress'>;
}

self.onmessage = async (e: MessageEvent<WorkerExportMessage>) => {
  const { id, type, options } = e.data;
  if (type !== 'export') return;

  try {
    const blob = await processDocxExport({
      ...options,
      onProgress: (progress, message) => {
        self.postMessage({ id, type: 'progress', progress, message });
      },
    });

    self.postMessage({ id, type: 'success', blob });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    self.postMessage({ id, type: 'error', error: errorMessage });
  }
};

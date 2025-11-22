export interface ElectronAPI {
  openExternal: (url: string) => Promise<void>;
  openPath: (filePath: string) => Promise<void>;
  createMarkdownFile: (
    fileName: string,
    content: string
  ) => Promise<{ success: boolean; filePath?: string; error?: string }>;
  fetchPageTitle: (
    url: string
  ) => Promise<{ success: boolean; title?: string | null }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

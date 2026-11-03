export type SupportedFont = 'Be Vietnam Pro' | 'Roboto' | 'Inter';

export interface ActiveProjectHeaderInfo {
  id: string;
  code: string;
  name: string;
  location: string;
  status: string;
  group?: string;
  level?: string;
  type?: string;
  totalInvestment?: number;
  onBack?: () => void;
}

export interface AppSettings {
  fontFamily: SupportedFont;
  fontSizePt: number; // 12 -> 18
  theme: 'dark'; // Bắt buộc Dark Mode
  googleDrivePath?: string;
  isAutoSyncEnabled: boolean;
  lastSyncedAt?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontFamily: 'Be Vietnam Pro',
  fontSizePt: 14,
  theme: 'dark',
  googleDrivePath: 'D:\\Google Drive\\ProjectM\\du_lieu_du_an.json',
  isAutoSyncEnabled: true,
};


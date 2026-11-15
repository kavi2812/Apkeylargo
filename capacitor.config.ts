import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.creta.launcher',
  appName: 'Creta Launcher',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;

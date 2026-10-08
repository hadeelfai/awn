import Constants from 'expo-constants';
import { Platform } from 'react-native';

function devHost() {
  if (Platform.OS === 'web') {
    return 'localhost';
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.linkingUri ||
    '';
  const host = hostUri
    .replace(/^[a-z]+:\/\//, '')
    .split('/')[0]
    .split(':')[0];

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return host;
  }

  return 'localhost';
}

const host = devHost();

export const API_URL = `http://${host}:3001`;
export const AWN_RAG_URL = `http://${host}:8000`;

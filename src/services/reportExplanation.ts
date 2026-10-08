import * as FileSystem from 'expo-file-system/legacy';

import { AWN_RAG_URL } from '../config';
import type { Locale } from '../types';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

export type ExplainResponse =
  | {
      readable: false;
      message: string;
    }
  | {
      readable: true;
      document_type: string;
      summary: string;
      key_points: string[];
      terms: { term: string; meaning: string }[];
      questions_for_doctor: string[];
      next_steps: string[];
      urgent: boolean;
      sources: { title: string; url: string }[];
      disclaimer: string;
    };

function fileType(name: string, suppliedType?: string | null) {
  if (suppliedType && ALLOWED_TYPES.has(suppliedType)) {
    return suppliedType;
  }
  const extension = name.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXTENSION[extension];
}

export type TranslatedExplanation = {
  summary: string;
  key_points: string[];
  terms: { term: string; meaning: string }[];
  questions_for_doctor: string[];
  next_steps: string[];
  disclaimer: string;
};

export async function translateExplanation(
  explanation: TranslatedExplanation,
  targetLanguage: Locale
): Promise<TranslatedExplanation> {
  const response = await fetch(`${AWN_RAG_URL}/explain/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...explanation, target_language: targetLanguage }),
  });
  if (!response.ok) throw new Error('TRANSLATION_FAILED');
  return response.json() as Promise<TranslatedExplanation>;
}

export async function explainReport(
  uri: string,
  name: string,
  suppliedType: string | undefined,
  lang: Locale,
  byteSize?: number
): Promise<ExplainResponse> {
  const mimeType = fileType(name, suppliedType);
  if (!mimeType) throw new Error('UNSUPPORTED_FILE');
  if (byteSize !== undefined && byteSize > MAX_BYTES) throw new Error('FILE_TOO_LARGE');

  const res = await FileSystem.uploadAsync(`${AWN_RAG_URL}/explain`, uri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: 'file',
    mimeType,
    parameters: { lang },
  });

  if (res.status === 413) throw new Error('FILE_TOO_LARGE');
  if (res.status < 200 || res.status >= 300) throw new Error('REQUEST_FAILED');

  const data = JSON.parse(res.body) as ExplainResponse;
  if (!data || typeof data !== 'object' || typeof data.readable !== 'boolean') {
    throw new Error('INVALID_RESPONSE');
  }
  return data;
}

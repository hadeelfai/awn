import { AWN_RAG_URL } from '../config';

export type AskStreamEvent =
  | { type: 'meta'; sources: { title: string; url: string }[]; reference_status: string }
  | { type: 'delta'; text: string }
  | { type: 'done' }
  | { type: 'error'; code: string };

export type AskConversationTurn = {
  role: 'user' | 'awn';
  content: string;
};

/** Read the API's newline-delimited stream using XHR progress events on web and native. */
export function streamAsk(
  question: string,
  onEvent: (event: AskStreamEvent) => void,
  history: AskConversationTurn[] = []
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    let responseOffset = 0;
    let pendingLine = '';
    let settled = false;

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const dispatchLine = (line: string) => {
      const value = line.trim();
      if (!value) return;
      try {
        onEvent(JSON.parse(value) as AskStreamEvent);
      } catch {
        fail(new Error('invalid_stream_response'));
      }
    };

    const readAvailableText = () => {
      const responseText = request.responseText ?? '';
      const newText = responseText.slice(responseOffset);
      responseOffset = responseText.length;
      pendingLine += newText;
      const lines = pendingLine.split('\n');
      pendingLine = lines.pop() ?? '';
      lines.forEach(dispatchLine);
    };

    request.open('POST', `${AWN_RAG_URL}/ask/stream`);
    request.setRequestHeader('Content-Type', 'application/json');
    request.timeout = 120_000;
    request.onprogress = readAvailableText;
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        try {
          const body = JSON.parse(request.responseText || '{}');
          fail(new Error(typeof body.detail === 'string' ? body.detail : `http_${request.status}`));
        } catch {
          fail(new Error(`http_${request.status}`));
        }
        return;
      }

      readAvailableText();
      if (pendingLine.trim()) dispatchLine(pendingLine);
      if (!settled) {
        settled = true;
        resolve();
      }
    };
    request.onerror = () => fail(new Error('network_error'));
    request.ontimeout = () => fail(new Error('request_timeout'));
    request.onabort = () => fail(new Error('request_aborted'));
    request.send(JSON.stringify({ question, history }));
  });
}

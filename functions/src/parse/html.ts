/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

export type GmailPart = {
  mimeType?: string;
  body?: {data?: string};
  parts?: GmailPart[];
};

export function decodeGmailBase64(inputData: string | number[] | null | undefined): string | null {
  if (typeof inputData === 'string' && inputData.length > 0) {
    const base64 = inputData.replace(/-/g, '+').replace(/_/g, '/');
    try {
      return Buffer.from(base64, 'base64').toString('utf8');
    } catch {
      return null;
    }
  }
  if (Array.isArray(inputData) && inputData.length > 0 && typeof inputData[0] === 'number') {
    return Buffer.from(Uint8Array.from(inputData)).toString('utf8');
  }
  return null;
}

export function findBody(parts: GmailPart[] | undefined): string | null {
  if (!parts || parts.length === 0) {
    return null;
  }
  let htmlBody: string | null = null;
  let plainTextBody: string | null = null;
  for (const part of parts) {
    if (part.body && part.body.data) {
      if (part.mimeType === 'text/html') {
        htmlBody = decodeGmailBase64(part.body.data);
      } else if (part.mimeType === 'text/plain') {
        plainTextBody = decodeGmailBase64(part.body.data);
      }
    }
    if (part.parts && part.parts.length > 0) {
      const nestedBody = findBody(part.parts);
      if (nestedBody) {
        return nestedBody;
      }
    }
  }
  return htmlBody || plainTextBody;
}

export function extractPlainTextFromHtml(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  let text = html;
  text = text.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<p[^>]*>/gi, '\n\n');
  text = text.replace(/<\/p>/gi, '');
  text = text.replace(/<[^>]*>/g, '');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, '\'');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&copy;/g, '©');
  text = text.replace(/&reg;/g, '®');
  text = text.replace(/&trade;/g, '™');
  text = text.replace(/&mdash;/g, '—');
  text = text.replace(/&ndash;/g, '–');
  text = text.replace(/&zwnj;/g, '');
  text = text.replace(/&zwj;/g, '');
  text = text.replace(/&rlm;/g, '');
  text = text.replace(/&lrm;/g, '');
  text = text.replace(/&bidi;/g, '');
  text = text.replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(parseInt(code, 10)));
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_match, code) => String.fromCharCode(parseInt(code, 16)));
  return text.replace(/\s+/g, ' ').trim();
}

export function messagePlainText(message: {snippet?: string; payload?: GmailPart}): string {
  let text = message.snippet || '';
  let raw = '';
  if (message.payload?.parts && message.payload.parts.length > 0) {
    raw = findBody(message.payload.parts) || '';
  } else if (message.payload?.body?.data) {
    raw = decodeGmailBase64(message.payload.body.data) || '';
  }
  if (raw) {
    text = extractPlainTextFromHtml(raw);
  }
  return text;
}

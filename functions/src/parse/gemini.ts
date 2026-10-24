/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

import {validateExpense} from './geminiShape';

export const GEMINI_PROMPT = `Analyze this email and return a JSON object.
    Keys: "cost" (number), "costType" ("debit" or "credit"), "vendor" (name or UPI ID), "type" (upi, credit-card, e-mandate etc.).
    Note: usually if it's upi, you will see upi id like abc@ybl, xyz@paytm, etc
    Note: if it's credit card, you see text like "Credit Card ending 1234"
    
    IMPORTANT: If it is not an expense or transaction mail from bank, return null.`;

export async function callGemini(
  text: string,
  subject: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown> {
  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
  const prompt = `${GEMINI_PROMPT}

    Email Subject: ${subject}
    Email: ${text}`;
  const payload = {
    contents: [{parts: [{text: prompt}]}],
    generation_config: {response_mime_type: 'application/json'},
  };
  const response = await fetchImpl(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    return null;
  }
  const json = await response.json() as {
    candidates?: Array<{content?: {parts?: Array<{text?: string}>}}>;
  };
  const resultText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!resultText) {
    return null;
  }
  try {
    return JSON.parse(resultText);
  } catch {
    return null;
  }
}

export async function parseExpenseWithGemini(
  text: string,
  subject: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch,
) {
  const first = await callGemini(text, subject, apiKey, fetchImpl);
  if (first === null) {
    return null;
  }
  const validated = validateExpense(first, text, subject, apiKey);
  if (validated) {
    return validated;
  }
  const second = await callGemini(text, subject, apiKey, fetchImpl);
  return validateExpense(second, text, subject, apiKey);
}

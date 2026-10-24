/*
MIT License
Copyright (c) 2025 rushikc <rushikc.dev@gmail.com>
*/

type Header = {name?: string; value?: string};
type Message = {payload?: {headers?: Header[]}};

export function extractEmailAddress(emailString: string | null | undefined): string {
  if (!emailString) {
    return '';
  }
  const match = emailString.match(/<([^>]+)>/);
  if (match) {
    return match[1].trim();
  }
  return emailString.trim().toLowerCase();
}

export function getMailSubject(res: Message): string {
  const headers = res.payload?.headers || [];
  for (const header of headers) {
    if (header && String(header.name).toLowerCase() === 'subject') {
      return header.value || '';
    }
  }
  return '';
}

export function getMailSenderReceiver(res: Message): {
  sender: string;
  receiver: string;
  senderEmail: string;
  receiverEmail: string;
} {
  let sender = '';
  let receiver = '';
  const headers = res.payload?.headers || [];
  for (const header of headers) {
    if (!header || !header.name) {
      continue;
    }
    if (header.name === 'From') {
      sender = header.value || '';
    }
    if (header.name === 'To') {
      receiver = header.value || '';
    }
    if (sender && receiver) {
      break;
    }
  }
  return {
    sender,
    receiver,
    senderEmail: extractEmailAddress(sender),
    receiverEmail: extractEmailAddress(receiver),
  };
}

export function extractUsername(emailAddress: string | null | undefined): string {
  if (!emailAddress) {
    return '';
  }
  const atIndex = emailAddress.indexOf('@');
  if (atIndex !== -1) {
    return emailAddress.substring(0, atIndex).trim().toLowerCase();
  }
  return emailAddress.trim().toLowerCase();
}

export function mailDateFromMessage(
  gmailMessage: {internalDate?: string | number} | null | undefined,
  nowMs?: number,
): number {
  const now = nowMs == null ? Date.now() : nowMs;
  if (gmailMessage && gmailMessage.internalDate !== undefined && gmailMessage.internalDate !== null) {
    const mailDate = Number(gmailMessage.internalDate);
    if (!isNaN(mailDate)) {
      return mailDate;
    }
  }
  return now;
}

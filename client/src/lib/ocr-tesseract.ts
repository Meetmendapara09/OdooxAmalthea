"use client";

import Tesseract from 'tesseract.js';

export type ParsedReceipt = Partial<{
  amount: string;
  date: string;
  description: string;
  expenseType: string;
}>;

function normalizeDate(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  const isoMatch = trimmed.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const mdYMatch = trimmed.match(/\b(0?[1-9]|1[0-2])[\/-](0?[1-9]|[12]\d|3[01])[\/-]((?:19|20)?\d{2})\b/);
  if (mdYMatch) {
    let [, m, d, y] = mdYMatch;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const dMYMatch = trimmed.match(/\b(0?[1-9]|[12]\d|3[01])[\.-](0?[1-9]|1[0-2])[\.-]((?:19|20)?\d{2})\b/);
  if (dMYMatch) {
    let [, d, m, y] = dMYMatch;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return undefined;
}

function extractFieldsFromText(text: string): ParsedReceipt {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const currencyRegex = /([$€£])?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|\d+(?:[.,]\d{2}))/;
  const totalLine = lines.find(l => /\b(total|amount|grand\s*total|balance due)\b/i.test(l) && currencyRegex.test(l));
  let amount: string | undefined;
  if (totalLine) {
    const m = totalLine.match(currencyRegex);
    if (m) {
      amount = m[2]?.replace(/[,]/g, '.');
      if (amount) {
        const parts = amount.split('.');
        if (parts.length > 2) {
          const last = parts.pop();
          amount = parts.join('') + '.' + last;
        }
      }
    }
  }
  if (!amount) {
    for (let i = lines.length - 1; i >= 0; i--) {
      const m = lines[i].match(currencyRegex);
      if (m) {
        amount = m[2]?.replace(/[,]/g, '.');
        break;
      }
    }
  }

  const dateLine =
    lines.find(l => /(date|issued|purchased|purchase|time)/i.test(l)) ||
    lines.find(l => /\d/.test(l));
  const date = normalizeDate(dateLine);

  const description = lines.find(
    l => /[A-Za-z]{3,}/.test(l) && !/receipt|invoice|total|amount|tax/i.test(l)
  );

  const allTextLower = text.toLowerCase();
  let expenseType: string | undefined;
  if (/meal|restaurant|diner|cafe|food|beverage|drink/.test(allTextLower)) expenseType = 'Meals & Entertainment';
  else if (/uber|lyft|flight|airlines?|taxi|train|bus|travel|hotel|lodging|parking|car rental/.test(allTextLower)) expenseType = 'Travel';
  else if (/software|subscription|license|saas|cloud/.test(allTextLower)) expenseType = 'Software';
  else if (/office|stationery|paper|pen|staples|supply|supplies/.test(allTextLower)) expenseType = 'Office Supplies';
  else expenseType = 'Other';

  const result: ParsedReceipt = {};
  if (amount) result.amount = amount.replace(/[^0-9.]/g, '');
  if (date) result.date = date;
  if (description) result.description = description;
  if (expenseType) result.expenseType = expenseType;
  return result;
}

export async function ocrReceiptClient(dataUri: string, opts?: { lang?: string }) {
  // Default to combined English + Hindi for better recognition across both languages
  const lang = opts?.lang || 'eng+hin';
  const { data } = await Tesseract.recognize(dataUri, lang, {
    logger: () => {},
  });
  const rawText = data.text || '';
  return extractFieldsFromText(rawText);
}

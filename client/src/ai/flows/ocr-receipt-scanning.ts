'use server';

/**
 *
 * - Accepts a Data URI image of a receipt
 * - Runs an image-to-text OCR model on Hugging Face
 * - Extracts: amount, date, description, expenseType (best-effort via regex/heuristics)
 */

import * as z from 'zod';

const OcrReceiptInputSchema = z.object({
  receiptDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type OcrReceiptInput = z.infer<typeof OcrReceiptInputSchema>;

const OcrReceiptOutputSchema = z
  .object({
    amount: z.string().describe('The total amount on the receipt.'),
    date: z.string().describe('The date on the receipt in YYYY-MM-DD format.'),
    description: z.string().describe('A description of the expense.'),
    expenseType: z
      .string()
      .describe('The type of expense (e.g., Meals & Entertainment, Travel, Software, Office Supplies, Other).'),
  })
  .partial();
export type OcrReceiptOutput = z.infer<typeof OcrReceiptOutputSchema>;

type HFResponse = Array<{ generated_text?: string }> | { generated_text?: string } | string;

const DEFAULT_HF_MODEL = process.env.HF_OCR_MODEL || 'microsoft/trocr-base-printed';
const HF_API_URL = (model: string) => `https://api-inference.huggingface.co/models/${model}`;

function dataUriToBuffer(dataUri: string): { mime: string; buffer: Buffer } {
  const match = dataUri.match(/^data:(.*?);base64,(.*)$/);
  if (!match) throw new Error('Invalid data URI for image');
  const mime = match[1];
  const base64 = match[2];
  return { mime, buffer: Buffer.from(base64, 'base64') };
}

function normalizeDate(input: string | undefined): string | undefined {
  if (!input) return undefined;
  // Try to normalize common formats to YYYY-MM-DD
  // Supports:
  // - YYYY-MM-DD
  // - MM/DD/YYYY or M/D/YY(YY)
  // - DD-MM-YYYY
  const trimmed = input.trim();
  const isoMatch = trimmed.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    const mm = m.padStart(2, '0');
    const dd = d.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  const mdYMatch = trimmed.match(/\b(0?[1-9]|1[0-2])[\/-](0?[1-9]|[12]\d|3[01])[\/-]((?:19|20)?\d{2})\b/);
  if (mdYMatch) {
    let [, m, d, y] = mdYMatch;
    if (y.length === 2) y = `20${y}`; // assume 2000s
    const mm = m.padStart(2, '0');
    const dd = d.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  const dMYMatch = trimmed.match(/\b(0?[1-9]|[12]\d|3[01])[\.-](0?[1-9]|1[0-2])[\.-]((?:19|20)?\d{2})\b/);
  if (dMYMatch) {
    let [, d, m, y] = dMYMatch;
    if (y.length === 2) y = `20${y}`;
    const mm = m.padStart(2, '0');
    const dd = d.padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  }
  return undefined;
}

function extractFieldsFromText(text: string): OcrReceiptOutput {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  // Amount: prefer a line containing total/amount/grand total; fallback to the last currency-like number.
  const currencyRegex = /([$€£])?\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})|\d+(?:[.,]\d{2}))/;
  const totalLine = lines.find(l => /\b(total|amount|grand\s*total|balance due)\b/i.test(l) && currencyRegex.test(l));
  let amount: string | undefined;
  if (totalLine) {
    const m = totalLine.match(currencyRegex);
    if (m) {
      amount = m[2]?.replace(/[,]/g, '.');
      if (amount) {
        // Ensure only one decimal separator
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

  // Date
  const dateLine = lines.find(l => /(date|issued|purchased|purchase|time)/i.test(l)) || lines.find(l => /\d/.test(l));
  const date = normalizeDate(dateLine);

  // Description/vendor: choose first line with reasonable alphabetic chars excluding generic words
  const description = lines.find(l => /[A-Za-z]{3,}/.test(l) && !/receipt|invoice|total|amount|tax/i.test(l));

  // Expense type heuristic
  const allTextLower = text.toLowerCase();
  let expenseType: string | undefined;
  if (/meal|restaurant|diner|cafe|food|beverage|drink/.test(allTextLower)) expenseType = 'Meals & Entertainment';
  else if (/uber|lyft|flight|airlines?|taxi|train|bus|travel|hotel|lodging|parking|car rental/.test(allTextLower)) expenseType = 'Travel';
  else if (/software|subscription|license|saas|cloud/.test(allTextLower)) expenseType = 'Software';
  else if (/office|stationery|paper|pen|staples|supply|supplies/.test(allTextLower)) expenseType = 'Office Supplies';
  else expenseType = 'Other';

  const result: OcrReceiptOutput = {};
  if (amount) result.amount = amount.replace(/[^0-9.]/g, '');
  if (date) result.date = date;
  if (description) result.description = description;
  if (expenseType) result.expenseType = expenseType;
  return result;
}

async function runHFOCR(imageDataUri: string, model = DEFAULT_HF_MODEL): Promise<string> {
  const token = process.env.HUGGINGFACE_API_TOKEN || process.env.HF_API_TOKEN;
  if (!token) {
    throw new Error('Missing HUGGINGFACE_API_TOKEN (or HF_API_TOKEN) environment variable.');
  }
  const { buffer } = dataUriToBuffer(imageDataUri);

  const res = await fetch(HF_API_URL(model), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/octet-stream',
      Accept: 'application/json',
    },
  body: new Uint8Array(buffer),
    // Next.js fetch options: ensure it runs on server without caching issues
    // @ts-ignore - next specific
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Hugging Face API error (${res.status}): ${body}`);
  }
  const data: HFResponse = await res.json();
  if (typeof data === 'string') return data;
  if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text as string;
  if (!Array.isArray(data) && (data as any).generated_text) return (data as any).generated_text as string;
  // Some models may return other shapes; try to stringify
  return JSON.stringify(data);
}

export async function ocrReceipt(input: OcrReceiptInput): Promise<OcrReceiptOutput | null> {
  const parse = OcrReceiptInputSchema.safeParse(input);
  if (!parse.success) {
    return null;
  }

  try {
    const rawText = await runHFOCR(parse.data.receiptDataUri);
    const fields = extractFieldsFromText(rawText || '');
    return fields;
  } catch (e: any) {
    console.error('Error during OCR processing:', e);
    return null;
  }
}

import type { EnquiryRecord } from '../types/teracore';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  sheetNames: string[];
  primarySheetName: string;
}

export interface SheetPreviewData {
  headers: string[];
  rows: string[][];
}

export const ENQUIRY_SHEET_HEADERS = [
  'Reference ID',
  'Submitted At',
  'Status',
  'Full Name',
  'Phone / WhatsApp',
  'Email',
  'Service Division',
  'Site Location',
  'Preferred Contact',
  'Preferred Date',
  'Project Description',
  'Technical Summary',
];

export function extractSpreadsheetId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch?.[1]) return urlMatch[1];
  if (/^[a-zA-Z0-9-_]{15,120}$/.test(trimmed)) return trimmed;
  return null;
}

async function parseSheetsError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: { message?: string; status?: string } };
    if (res.status === 401) {
      return 'Your Google Sheets session expired. Please reconnect your Google account and try again.';
    }
    if (res.status === 403) {
      return 'Access denied to this Google Sheet. Make sure your signed-in Google account has edit access and Sheets permission.';
    }
    if (res.status === 404) {
      return 'Spreadsheet not found. Double-check the Google Sheets URL or ID.';
    }
    return data?.error?.message || `Google Sheets API returned status ${res.status}.`;
  } catch {
    return `Google Sheets request failed with status ${res.status}.`;
  }
}

function encodeSheetRange(sheetName: string, cellRange: string): string {
  const escapedName = sheetName.replace(/'/g, "''");
  return encodeURIComponent(`'${escapedName}'!${cellRange}`);
}

export async function fetchSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetMetadata> {
  const url = `${SHEETS_API_BASE}/${encodeURIComponent(
    spreadsheetId
  )}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties.title`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(await parseSheetsError(res));
  }

  const data = (await res.json()) as {
    spreadsheetId?: string;
    spreadsheetUrl?: string;
    properties?: { title?: string };
    sheets?: Array<{ properties?: { title?: string } }>;
  };

  const sheetNames = (data.sheets ?? [])
    .map((s) => s.properties?.title)
    .filter((t): t is string => Boolean(t));

  const primarySheetName =
    sheetNames.find((n) => n.toLowerCase().includes('enquir')) ?? sheetNames[0] ?? 'Sheet1';

  return {
    spreadsheetId: data.spreadsheetId || spreadsheetId,
    spreadsheetUrl:
      data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    title: data.properties?.title || 'Connected Google Sheet',
    sheetNames,
    primarySheetName,
  };
}

export async function createTeracoreEnquiriesSheet(
  accessToken: string
): Promise<SpreadsheetMetadata> {
  const res = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Teracore Customer Enquiries',
      },
      sheets: [
        {
          properties: {
            title: 'Customer Enquiries',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(await parseSheetsError(res));
  }

  const data = (await res.json()) as {
    spreadsheetId: string;
    spreadsheetUrl: string;
    properties?: { title?: string };
    sheets?: Array<{ properties?: { title?: string } }>;
  };

  const sheetNames = (data.sheets ?? [])
    .map((s) => s.properties?.title)
    .filter((t): t is string => Boolean(t));

  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl,
    title: data.properties?.title || 'Teracore Customer Enquiries',
    sheetNames: sheetNames.length ? sheetNames : ['Customer Enquiries'],
    primarySheetName: sheetNames[0] || 'Customer Enquiries',
  };
}

export function formatEnquiriesAsSheetValues(enquiries: EnquiryRecord[]): string[][] {
  const rows = enquiries.map((enq) => [
    enq.id,
    enq.createdAt ? enq.createdAt.toISOString().replace('T', ' ').slice(0, 19) : '',
    enq.status.toUpperCase(),
    enq.fullName,
    enq.phone,
    enq.email || '',
    enq.serviceType.toUpperCase(),
    enq.location,
    enq.preferredContact,
    enq.preferredDate || '',
    enq.projectDescription,
    enq.technicalSummary || '',
  ]);
  return [ENQUIRY_SHEET_HEADERS, ...rows];
}

export async function syncEnquiriesToSheet(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string,
  enquiries: EnquiryRecord[]
): Promise<number> {
  // 1. Clear existing range A:L so deleted/re-ordered rows don't leave stale entries
  const clearRange = encodeSheetRange(sheetName, 'A:L');
  const clearRes = await fetch(
    `${SHEETS_API_BASE}/${encodeURIComponent(spreadsheetId)}/values/${clearRange}:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!clearRes.ok) {
    throw new Error(await parseSheetsError(clearRes));
  }

  // 2. Write header + enquiry rows cleanly
  const values = formatEnquiriesAsSheetValues(enquiries);
  const targetRange = encodeSheetRange(sheetName, `A1:L${values.length}`);
  const updateRes = await fetch(
    `${SHEETS_API_BASE}/${encodeURIComponent(
      spreadsheetId
    )}/values/${targetRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `'${sheetName.replace(/'/g, "''")}'!A1:L${values.length}`,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!updateRes.ok) {
    throw new Error(await parseSheetsError(updateRes));
  }

  return enquiries.length;
}

export async function readSheetPreview(
  accessToken: string,
  spreadsheetId: string,
  sheetName: string
): Promise<SheetPreviewData> {
  const range = encodeSheetRange(sheetName, 'A1:L100');
  const res = await fetch(
    `${SHEETS_API_BASE}/${encodeURIComponent(spreadsheetId)}/values/${range}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error(await parseSheetsError(res));
  }

  const data = (await res.json()) as { values?: string[][] };
  const allRows = data.values ?? [];
  if (allRows.length === 0) {
    return { headers: [], rows: [] };
  }
  return {
    headers: allRows[0] ?? [],
    rows: allRows.slice(1),
  };
}

function escapeCsvCell(value: string): string {
  const normalized = value.replace(/\r?\n/g, ' ');
  if (/[",]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export function buildEnquiriesCsv(enquiries: EnquiryRecord[]): string {
  const values = formatEnquiriesAsSheetValues(enquiries);
  return values.map((row) => row.map((cell) => escapeCsvCell(cell)).join(',')).join('\n');
}

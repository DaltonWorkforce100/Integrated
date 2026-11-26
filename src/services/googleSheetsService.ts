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
      const apiMsg = data?.error?.message;
      if (apiMsg && /disabled|not been used|scope|insufficient/i.test(apiMsg)) {
        return apiMsg;
      }
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

export function buildEnquiriesTsv(enquiries: EnquiryRecord[]): string {
  const values = formatEnquiriesAsSheetValues(enquiries);
  return values
    .map((row) => row.map((cell) => cell.replace(/[\t\r\n]+/g, ' ')).join('\t'))
    .join('\n');
}

export const APPS_SCRIPT_WEBHOOK_REGEX =
  /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]{10,200}\/exec$/;

export function isValidAppsScriptWebhookUrl(input: string): boolean {
  return APPS_SCRIPT_WEBHOOK_REGEX.test(input.trim());
}

export const APPS_SCRIPT_BRIDGE_CODE = `function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    var payload = JSON.parse(e.postData.contents);
    var rows = payload.rows || [];
    sheet.clearContents();
    if (rows.length > 0) {
      sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
      sheet.setFrozenRows(1);
    }
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, count: Math.max(0, rows.length - 1) }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err && err.message ? err.message : String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

function diagnoseAppsScriptHtml(html: string, finalUrl: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
  const titleMatch = withoutScripts.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.replace(/\s+/g, ' ').trim() || '';
  const plainText = withoutScripts
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const combined = `${title} ${plainText}`.trim();

  if (
    /script function not found:\s*dopost|scriptfunctie niet gevonden:\s*dopost|not found:\s*dopost/i.test(
      combined
    )
  ) {
    return 'Apps Script says "Script function not found: doPost". Paste Code.gs, click Save (Ctrl+S), then click Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy.';
  }
  if (/accounts\.google\.com|servicelogin/i.test(finalUrl) || /sign in|google accounts/i.test(title)) {
    return 'Google Apps Script redirected to a sign-in page. Check Deploy → Manage deployments: set Execute as "Me", Who has access "Anyone", and Version to a saved version.';
  }
  if (/unable to open the file|sorry, unable to open/i.test(combined)) {
    return 'Google Apps Script returned "Unable to open the file" (often caused by multiple Google accounts signed in). Deploy from an Incognito window signed only into allidavid473@gmail.com.';
  }
  if (/authorization is required|need permission/i.test(combined)) {
    return 'Apps Script requires authorization. Click Deploy → New deployment and complete Authorize access → Advanced → Go to project → Allow.';
  }

  const snippet = (plainText || title).slice(0, 180);
  return snippet
    ? `Google Apps Script returned an unexpected page instead of JSON: "${snippet}"`
    : 'Google Apps Script returned an HTML page instead of JSON. Make sure Code.gs is saved and deployed as a New version with "Who has access: Anyone".';
}

export async function syncEnquiriesViaAppsScript(
  firebaseIdToken: string,
  webhookUrl: string,
  enquiries: EnquiryRecord[]
): Promise<number> {
  const cleanedWebhook = webhookUrl.trim();
  const rows = formatEnquiriesAsSheetValues(enquiries);

  // 1. Try Express backend proxy when available
  try {
    const res = await fetch('/api/sheets-webhook', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${firebaseIdToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhookUrl: cleanedWebhook,
        rows,
      }),
    });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = (await res.json()) as {
        ok?: boolean;
        count?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Failed to sync via Apps Script (status ${res.status}).`);
      }
      return typeof data.count === 'number' ? data.count : enquiries.length;
    }
    // Non-JSON response (e.g. static SPA index.html fallback): fall through to direct browser POST
  } catch (proxyErr) {
    // Re-throw real backend validation/webhook errors; only fall through on network/SPA fallback
    if (proxyErr instanceof Error && !/Failed to fetch|NetworkError/i.test(proxyErr.message)) {
      throw proxyErr;
    }
  }

  // 2. Direct browser POST fallback using text/plain CORS simple request
  const directRes = await fetch(cleanedWebhook, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ rows }),
    redirect: 'follow',
  });

  const directText = await directRes.text();
  if (!directRes.ok) {
    throw new Error(
      `Google Apps Script returned status ${directRes.status}. Verify your Web App deployment.`
    );
  }

  if (directText.trim().startsWith('<')) {
    throw new Error(diagnoseAppsScriptHtml(directText, directRes.url || ''));
  }

  try {
    const parsed = JSON.parse(directText) as { ok?: boolean; count?: number; error?: string };
    if (parsed.ok === false) {
      throw new Error(parsed.error || 'Google Apps Script reported an error.');
    }
    return typeof parsed.count === 'number' ? parsed.count : enquiries.length;
  } catch (parseErr) {
    if (parseErr instanceof Error && parseErr.message !== 'Unexpected end of JSON input') {
      throw parseErr;
    }
    return enquiries.length;
  }
}


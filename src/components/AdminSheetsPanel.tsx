import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileSpreadsheet,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Table2,
  Unlink,
  X,
} from 'lucide-react';
import {
  auth,
  getGoogleAccessToken,
  signInWithGoogleSheets,
} from '../firebase/client';
import {
  clearSheetsIntegration,
  fetchSheetsIntegration,
  saveSheetsIntegration,
} from '../services/firestoreService';
import {
  APPS_SCRIPT_BRIDGE_CODE,
  createTeracoreEnquiriesSheet,
  extractSpreadsheetId,
  fetchSpreadsheetMetadata,
  isValidAppsScriptWebhookUrl,
  readSheetPreview,
  syncEnquiriesToSheet,
  syncEnquiriesViaAppsScript,
  type SheetPreviewData,
} from '../services/googleSheetsService';
import type { EnquiryRecord, SheetsIntegrationConfig } from '../types/teracore';

interface AdminSheetsPanelProps {
  enquiries: EnquiryRecord[];
  initialAccessToken: string | null;
}

type ConnectionTab = 'apps_script' | 'oauth';

type PendingMutation =
  | { type: 'create' }
  | { type: 'sync'; spreadsheetId: string; spreadsheetTitle: string; sheetName: string }
  | { type: 'sync_script'; webhookUrl: string; spreadsheetTitle: string }
  | { type: 'disconnect'; spreadsheetTitle: string };

export function AdminSheetsPanel({ enquiries, initialAccessToken }: AdminSheetsPanelProps) {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => initialAccessToken ?? getGoogleAccessToken()
  );
  const [config, setConfig] = useState<SheetsIntegrationConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [setupTab, setSetupTab] = useState<ConnectionTab>('apps_script');

  // Apps Script Bridge inputs
  const [webhookInput, setWebhookInput] = useState('');
  const [optionalSheetUrl, setOptionalSheetUrl] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptHelp, setShowScriptHelp] = useState(false);

  // Direct OAuth inputs
  const [sheetUrlInput, setSheetUrlInput] = useState('');
  const [availableTabs, setAvailableTabs] = useState<string[]>([]);

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingMutation, setPendingMutation] = useState<PendingMutation | null>(null);
  const [previewData, setPreviewData] = useState<SheetPreviewData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const token = initialAccessToken ?? getGoogleAccessToken();
    if (token) setAccessToken(token);
  }, [initialAccessToken]);

  useEffect(() => {
    let active = true;
    async function loadConfig() {
      try {
        const existing = await fetchSheetsIntegration();
        if (active) {
          setConfig(existing);
        }
      } catch {
        // Non-admin or unconfigured handled by parent AdminPage
      } finally {
        if (active) setConfigLoading(false);
      }
    }
    void loadConfig();
    return () => {
      active = false;
    };
  }, []);

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_BRIDGE_CODE);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    } catch {
      setErrorMsg('Unable to copy automatically. Please select and copy the script text manually.');
    }
  };

  const handleConnectAppsScript = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

    const cleanedWebhook = webhookInput.trim();
    if (!isValidAppsScriptWebhookUrl(cleanedWebhook)) {
      setErrorMsg(
        'Please paste a valid Google Apps Script Web App URL (https://script.google.com/macros/s/.../exec).'
      );
      return;
    }

    const cleanedSheetUrl = optionalSheetUrl.trim();
    const extractedId = cleanedSheetUrl ? extractSpreadsheetId(cleanedSheetUrl) : null;
    const targetSheetUrl = extractedId
      ? `https://docs.google.com/spreadsheets/d/${extractedId}/edit`
      : 'https://sheets.google.com';

    setBusyAction('connect_script');
    try {
      await saveSheetsIntegration({
        spreadsheetId: extractedId || 'apps-script-bridge',
        spreadsheetUrl: targetSheetUrl,
        spreadsheetTitle: 'Teracore Customer Enquiries',
        sheetName: 'First Sheet Tab',
        syncMode: 'apps_script',
        webhookUrl: cleanedWebhook,
      });
      const updated = await fetchSheetsIntegration();
      setConfig(updated);
      setWebhookInput('');
      setOptionalSheetUrl('');
      setStatusMsg(
        'Google Sheet Bridge connected! Click "Sync Enquiries" to push your customer requests directly into your Google Sheet.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to save Apps Script connection.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleAuthorizeSheets = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    setBusyAction('auth');
    try {
      const { accessToken: token } = await signInWithGoogleSheets();
      if (!token) {
        setErrorMsg(
          'Google Sheets permission was not granted. Please allow spreadsheet access when prompted.'
        );
      } else {
        setAccessToken(token);
        setStatusMsg('Google Sheets session connected.');
      }
    } catch {
      setErrorMsg(
        'Google blocked the direct OAuth popup because this project is in Testing mode. Use the "Apps Script Bridge (No OAuth Block)" option instead — it writes directly to your Google Sheet with no verification block.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

    if (!accessToken) {
      setErrorMsg('Please connect your Google Sheets session first.');
      return;
    }

    const spreadsheetId = extractSpreadsheetId(sheetUrlInput);
    if (!spreadsheetId) {
      setErrorMsg('Please paste a valid Google Sheets URL or Spreadsheet ID.');
      return;
    }

    setBusyAction('connect');
    try {
      const meta = await fetchSpreadsheetMetadata(accessToken, spreadsheetId);
      setAvailableTabs(meta.sheetNames);
      await saveSheetsIntegration({
        spreadsheetId: meta.spreadsheetId,
        spreadsheetUrl: meta.spreadsheetUrl,
        spreadsheetTitle: meta.title,
        sheetName: meta.primarySheetName,
        syncMode: 'oauth',
      });
      const updated = await fetchSheetsIntegration();
      setConfig(updated);
      setSheetUrlInput('');
      setPreviewData(null);
      setShowPreview(false);
      setStatusMsg(
        `Connected "${meta.title}" (tab: ${meta.primarySheetName}). Click "Sync Enquiries" to write your records.`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to connect Google Sheet.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleChangeTab = async (newTab: string) => {
    if (!config || !newTab) return;
    setErrorMsg(null);
    setBusyAction('tab');
    try {
      await saveSheetsIntegration({
        spreadsheetId: config.spreadsheetId,
        spreadsheetUrl: config.spreadsheetUrl,
        spreadsheetTitle: config.spreadsheetTitle,
        sheetName: newTab,
        syncMode: config.syncMode,
        webhookUrl: config.webhookUrl,
        lastSyncedCount: config.lastSyncedCount,
      });
      const updated = await fetchSheetsIntegration();
      setConfig(updated);
      setPreviewData(null);
      setStatusMsg(`Active sheet tab switched to "${newTab}".`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not update tab selection.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleLoadPreview = async () => {
    if (!config || !accessToken) return;
    setErrorMsg(null);
    setBusyAction('preview');
    try {
      const meta = await fetchSpreadsheetMetadata(accessToken, config.spreadsheetId);
      setAvailableTabs(meta.sheetNames);
      const data = await readSheetPreview(accessToken, config.spreadsheetId, config.sheetName);
      setPreviewData(data);
      setShowPreview(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to read live spreadsheet rows.');
    } finally {
      setBusyAction(null);
    }
  };

  const executeConfirmedMutation = async () => {
    if (!pendingMutation) return;
    const action = pendingMutation;
    setPendingMutation(null);
    setErrorMsg(null);
    setStatusMsg(null);

    if (action.type === 'disconnect') {
      setBusyAction('disconnect');
      try {
        await clearSheetsIntegration();
        setConfig(null);
        setAvailableTabs([]);
        setPreviewData(null);
        setShowPreview(false);
        setStatusMsg('Disconnected spreadsheet from the Teracore backend.');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Could not disconnect spreadsheet.');
      } finally {
        setBusyAction(null);
      }
      return;
    }

    if (action.type === 'sync_script') {
      setBusyAction('sync_script');
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          throw new Error('Administrator sign-in is required.');
        }
        const idToken = await currentUser.getIdToken();
        const count = await syncEnquiriesViaAppsScript(idToken, action.webhookUrl, enquiries);
        await saveSheetsIntegration({
          spreadsheetId: config?.spreadsheetId || 'apps-script-bridge',
          spreadsheetUrl: config?.spreadsheetUrl || 'https://sheets.google.com',
          spreadsheetTitle: action.spreadsheetTitle,
          sheetName: config?.sheetName || 'First Sheet Tab',
          syncMode: 'apps_script',
          webhookUrl: action.webhookUrl,
          lastSyncedCount: count,
        });
        const updated = await fetchSheetsIntegration();
        setConfig(updated);
        setStatusMsg(
          `Synced ${count} customer enquiry record(s) directly to your Google Sheet via Apps Script.`
        );
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Failed to sync enquiries via Apps Script.'
        );
      } finally {
        setBusyAction(null);
      }
      return;
    }

    if (!accessToken) {
      setErrorMsg('Please authorize Google Sheets access first.');
      return;
    }

    if (action.type === 'create') {
      setBusyAction('create');
      try {
        const meta = await createTeracoreEnquiriesSheet(accessToken);
        const count = await syncEnquiriesToSheet(
          accessToken,
          meta.spreadsheetId,
          meta.primarySheetName,
          enquiries
        );
        await saveSheetsIntegration({
          spreadsheetId: meta.spreadsheetId,
          spreadsheetUrl: meta.spreadsheetUrl,
          spreadsheetTitle: meta.title,
          sheetName: meta.primarySheetName,
          syncMode: 'oauth',
          lastSyncedCount: count,
        });
        const updated = await fetchSheetsIntegration();
        setConfig(updated);
        setAvailableTabs(meta.sheetNames);
        setStatusMsg(
          `Created "${meta.title}" and synced ${count} enquiry record(s) to Google Sheets.`
        );
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to create Google Sheet.');
      } finally {
        setBusyAction(null);
      }
      return;
    }

    if (action.type === 'sync') {
      setBusyAction('sync');
      try {
        const count = await syncEnquiriesToSheet(
          accessToken,
          action.spreadsheetId,
          action.sheetName,
          enquiries
        );
        await saveSheetsIntegration({
          spreadsheetId: action.spreadsheetId,
          spreadsheetUrl:
            config?.spreadsheetUrl ||
            `https://docs.google.com/spreadsheets/d/${action.spreadsheetId}/edit`,
          spreadsheetTitle: action.spreadsheetTitle,
          sheetName: action.sheetName,
          syncMode: 'oauth',
          lastSyncedCount: count,
        });
        const updated = await fetchSheetsIntegration();
        setConfig(updated);
        if (showPreview) {
          const data = await readSheetPreview(accessToken, action.spreadsheetId, action.sheetName);
          setPreviewData(data);
        }
        setStatusMsg(
          `Synced ${count} customer enquiry record(s) to "${action.spreadsheetTitle}" (${action.sheetName}).`
        );
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Failed to sync enquiries to Google Sheets.'
        );
      } finally {
        setBusyAction(null);
      }
    }
  };

  const isAppsScriptMode = config?.syncMode === 'apps_script' && Boolean(config?.webhookUrl);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-700" />
          </div>
          <div>
            <h2 className="font-display text-sm sm:text-base font-bold text-slate-900">
              Google Sheets Backend Sync
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Push customer quote and consultation requests directly into your own Google Sheet.
            </p>
          </div>
        </div>

        {!config && (
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => {
                setSetupTab('apps_script');
                setErrorMsg(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap ${
                setupTab === 'apps_script'
                  ? 'bg-navy-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Apps Script Bridge (Recommended)
            </button>
            <button
              type="button"
              onClick={() => {
                setSetupTab('oauth');
                setErrorMsg(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer whitespace-nowrap ${
                setupTab === 'oauth'
                  ? 'bg-navy-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Direct Google OAuth
            </button>
          </div>
        )}
      </div>

      {configLoading ? (
        <div className="text-xs text-slate-500 flex items-center gap-2 py-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Checking saved Google Sheet link...</span>
        </div>
      ) : config ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-sm font-bold text-slate-900">
                  {config.spreadsheetTitle}
                </span>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  {isAppsScriptMode ? 'Apps Script Bridge' : `Tab: ${config.sheetName}`}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {typeof config.lastSyncedCount === 'number'
                  ? `Last synced ${config.lastSyncedCount} record(s)`
                  : 'Connected — ready to sync'}
                {config.updatedAt ? ` · ${config.updatedAt.toLocaleString()}` : ''}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isAppsScriptMode && availableTabs.length > 1 && (
                <select
                  value={config.sheetName}
                  disabled={busyAction !== null}
                  onChange={(e) => void handleChangeTab(e.target.value)}
                  aria-label="Select spreadsheet tab"
                  className="px-2.5 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg"
                >
                  {availableTabs.map((tab) => (
                    <option key={tab} value={tab}>
                      Tab: {tab}
                    </option>
                  ))}
                </select>
              )}

              <a
                href={config.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-navy-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors whitespace-nowrap"
              >
                <span>Open in Google Sheets</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>

              {!isAppsScriptMode && (
                <button
                  type="button"
                  disabled={!accessToken || busyAction !== null}
                  onClick={() => void handleLoadPreview()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  {busyAction === 'preview' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Table2 className="w-3.5 h-3.5 text-cobalt-600" />
                  )}
                  <span>Preview Live Sheet</span>
                </button>
              )}

              <button
                type="button"
                disabled={(!isAppsScriptMode && !accessToken) || busyAction !== null}
                onClick={() => {
                  if (isAppsScriptMode && config.webhookUrl) {
                    setPendingMutation({
                      type: 'sync_script',
                      webhookUrl: config.webhookUrl,
                      spreadsheetTitle: config.spreadsheetTitle,
                    });
                  } else {
                    setPendingMutation({
                      type: 'sync',
                      spreadsheetId: config.spreadsheetId,
                      spreadsheetTitle: config.spreadsheetTitle,
                      sheetName: config.sheetName,
                    });
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                {busyAction === 'sync' || busyAction === 'sync_script' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Sync Enquiries ({enquiries.length})</span>
              </button>

              {isAppsScriptMode && (
                <button
                  type="button"
                  onClick={() => setShowScriptHelp((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{showScriptHelp ? 'Hide Script' : 'View / Copy Script'}</span>
                </button>
              )}

              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() =>
                  setPendingMutation({
                    type: 'disconnect',
                    spreadsheetTitle: config.spreadsheetTitle,
                  })
                }
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                title="Disconnect spreadsheet link"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>

          {isAppsScriptMode && showScriptHelp && (
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Apps Script Code (Code.gs) — paste, Save (Ctrl+S), then Deploy → Manage deployments → Edit → New version
                </span>
                <button
                  type="button"
                  onClick={() => void handleCopyScript()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md cursor-pointer shrink-0"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[11px] leading-relaxed font-mono bg-navy-900 text-slate-100 rounded-lg p-3 overflow-x-auto select-all">
                {APPS_SCRIPT_BRIDGE_CODE}
              </pre>
            </div>
          )}

          {!isAppsScriptMode && !accessToken && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              <span>
                Direct OAuth requires an active session. If Google blocks the popup, disconnect and switch to <strong>Apps Script Bridge</strong>.
              </span>
              <button
                type="button"
                disabled={busyAction === 'auth'}
                onClick={() => void handleAuthorizeSheets()}
                className="px-3 py-1 bg-white border border-amber-300 rounded font-semibold text-amber-900 hover:bg-amber-100 cursor-pointer shrink-0"
              >
                Authorize Session
              </button>
            </div>
          )}
        </div>
      ) : setupTab === 'apps_script' ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 space-y-2.5 text-xs text-slate-700">
              <div className="font-semibold text-slate-900">
                Connect any Google Sheet directly (works without Google Cloud Console verification):
              </div>
              <ol className="list-decimal list-inside space-y-1.5 leading-relaxed text-slate-600">
                <li>
                  Create or open a sheet at{' '}
                  <a
                    href="https://sheets.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-semibold underline"
                  >
                    sheets.google.com
                  </a>
                  .
                </li>
                <li>
                  Click <strong>Extensions → Apps Script</strong>, replace any code with the script on the right, and click <strong>Save</strong> (Ctrl+S).
                </li>
                <li>
                  Click <strong>Deploy → New deployment</strong> → select type <strong>Web app</strong> → set{' '}
                  <strong>Who has access</strong> to <strong>Anyone</strong> → click <strong>Deploy</strong> and complete{' '}
                  <strong>Authorize access</strong>. (If you edited the script afterward, use{' '}
                  <strong>Manage deployments → Edit → Version: New version → Deploy</strong>.)
                </li>
                <li>Copy the <strong>Web app URL</strong> and paste it below.</li>
              </ol>
            </div>

            <div className="lg:col-span-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Apps Script Code (Code.gs)</span>
                <button
                  type="button"
                  onClick={() => void handleCopyScript()}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md cursor-pointer"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Script</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="text-[11px] leading-relaxed font-mono bg-navy-900 text-slate-100 rounded-lg p-3 overflow-x-auto select-all">
                {APPS_SCRIPT_BRIDGE_CODE}
              </pre>
            </div>
          </div>

          <form
            onSubmit={(e) => void handleConnectAppsScript(e)}
            className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 pt-2 border-t border-slate-200"
          >
            <input
              type="url"
              required
              value={webhookInput}
              onChange={(e) => setWebhookInput(e.target.value)}
              placeholder="Paste Apps Script Web App URL (https://script.google.com/macros/s/.../exec)"
              className="lg:col-span-6 px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
            <input
              type="url"
              value={optionalSheetUrl}
              onChange={(e) => setOptionalSheetUrl(e.target.value)}
              placeholder="Optional: Paste your Google Sheet URL (for quick Open button)"
              className="lg:col-span-4 px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
            <button
              type="submit"
              disabled={busyAction !== null || !webhookInput.trim()}
              className="lg:col-span-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>{busyAction === 'connect_script' ? 'Saving...' : 'Connect Sheet'}</span>
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          {!accessToken && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <p className="text-xs text-slate-600">
                Direct OAuth requires Google Sheets verification or test-user access on the Firebase project.
              </p>
              <button
                type="button"
                disabled={busyAction === 'auth'}
                onClick={() => void handleAuthorizeSheets()}
                className="inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap self-start sm:self-auto"
              >
                <svg viewBox="0 0 48 48" className="w-4 h-4 shrink-0" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>
                  {busyAction === 'auth' ? 'Connecting...' : 'Authorize Google Sheets Session'}
                </span>
              </button>
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <button
              type="button"
              disabled={!accessToken || busyAction !== null}
              onClick={() => setPendingMutation({ type: 'create' })}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              {busyAction === 'create' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              <span>Create New Google Sheet</span>
            </button>

            <span className="text-xs text-slate-400 hidden lg:inline">or</span>

            <form
              onSubmit={(e) => void handleConnectExisting(e)}
              className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <input
                type="text"
                value={sheetUrlInput}
                onChange={(e) => setSheetUrlInput(e.target.value)}
                placeholder="Paste existing Google Sheets URL or Spreadsheet ID..."
                disabled={!accessToken || busyAction !== null}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={!accessToken || busyAction !== null || !sheetUrlInput.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-navy-900 bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{busyAction === 'connect' ? 'Connecting...' : 'Connect Existing Sheet'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {statusMsg && (
        <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-start gap-2 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Google Sheet Preview (OAuth mode) */}
      {showPreview && previewData && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Live Google Sheet Preview ({previewData.rows.length} row(s) in {config?.sheetName})
            </span>
            <button
              type="button"
              onClick={() => setShowPreview(false)}
              className="p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
              aria-label="Close live preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {previewData.headers.length === 0 ? (
            <div className="p-5 text-xs text-slate-500 text-center">
              This sheet tab is currently empty. Click &ldquo;Sync Enquiries&rdquo; to populate it.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-72">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                  <tr>
                    {previewData.headers.map((h, i) => (
                      <th
                        key={i}
                        className="px-3 py-2 font-semibold text-slate-700 whitespace-nowrap border-r border-slate-200 last:border-r-0"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {previewData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {previewData.headers.map((_, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-3 py-2 text-slate-700 max-w-xs truncate border-r border-slate-100 last:border-r-0"
                          title={row[cIdx] ?? ''}
                        >
                          {row[cIdx] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Explicit Confirmation Modal for Mutating Google Sheets Actions */}
      {pendingMutation && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Google Sheets Action"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-display text-lg font-bold text-slate-900">
              {pendingMutation.type === 'create'
                ? 'Create & Populate Google Sheet?'
                : pendingMutation.type === 'sync' || pendingMutation.type === 'sync_script'
                  ? 'Sync Customer Enquiries to Google Sheets?'
                  : 'Disconnect Google Sheet?'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {pendingMutation.type === 'create' &&
                `This will create a new spreadsheet titled "Teracore Customer Enquiries" in your Google account and write ${enquiries.length} customer enquiry record(s) to the "Customer Enquiries" tab.`}
              {pendingMutation.type === 'sync' &&
                `This will clear range A1:L in "${pendingMutation.spreadsheetTitle}" (tab: ${pendingMutation.sheetName}) and write ${enquiries.length} current customer enquiry record(s) from the Teracore database.`}
              {pendingMutation.type === 'sync_script' &&
                `This will send ${enquiries.length} current customer enquiry record(s) from the Teracore database to your connected Google Sheet via Apps Script (replacing the first tab contents with up-to-date rows).`}
              {pendingMutation.type === 'disconnect' &&
                `This will unlink "${pendingMutation.spreadsheetTitle}" from the Teracore backend console. Your existing Google Sheet file in Google Drive will not be deleted.`}
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPendingMutation(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void executeConfirmedMutation()}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg cursor-pointer ${
                  pendingMutation.type === 'disconnect'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {pendingMutation.type === 'create'
                  ? 'Confirm & Create Sheet'
                  : pendingMutation.type === 'sync' || pendingMutation.type === 'sync_script'
                    ? 'Confirm Sync'
                    : 'Confirm Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

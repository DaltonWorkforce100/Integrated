import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Globe,
  Inbox,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { getGoogleAccessToken, signInWithGoogleWorkspace } from '../firebase/client';
import {
  fetchPublishedGoogleForm,
  publishPublicGoogleForm,
  submitEnquiry,
  unpublishPublicGoogleForm,
} from '../services/firestoreService';
import type { PublicGoogleFormConfig } from '../types/teracore';
import {
  addQuestionToForm,
  createTeracoreIntakeForm,
  deleteDriveForm,
  extractFormId,
  fetchFormResponses,
  fetchGoogleForm,
  listDriveForms,
  mapFormResponseToEnquiryInput,
  TERACORE_FORM_TEMPLATES,
  type DriveFormSummary,
  type GoogleFormDetails,
  type GoogleFormResponseItem,
  type TeracoreFormTemplateKey,
} from '../services/googleFormsService';

interface AdminFormsPanelProps {
  initialAccessToken: string | null;
  onTokenUpdated?: (token: string | null) => void;
}

type PendingFormsMutation =
  | { type: 'create_form'; templateKey: TeracoreFormTemplateKey; templateTitle: string }
  | {
      type: 'add_question';
      formId: string;
      formTitle: string;
      title: string;
      required: boolean;
      kind: 'SHORT_ANSWER' | 'PARAGRAPH' | 'MULTIPLE_CHOICE';
      options: string[];
      index: number;
    }
  | { type: 'delete_form'; formId: string; formTitle: string }
  | { type: 'import_response'; form: GoogleFormDetails; response: GoogleFormResponseItem }
  | { type: 'import_all'; form: GoogleFormDetails; responses: GoogleFormResponseItem[] }
  | {
      type: 'publish_public_form';
      formId: string;
      title: string;
      description?: string;
      responderUri: string;
    }
  | { type: 'unpublish_public_form'; title: string };

type FormWorkspaceSubtab = 'responses' | 'questions';

export function AdminFormsPanel({
  initialAccessToken,
  onTokenUpdated,
}: AdminFormsPanelProps) {
  const [accessToken, setAccessToken] = useState<string | null>(
    () => initialAccessToken ?? getGoogleAccessToken()
  );

  const [driveForms, setDriveForms] = useState<DriveFormSummary[]>([]);
  const [driveLoaded, setDriveLoaded] = useState(false);

  const [templateKey, setTemplateKey] = useState<TeracoreFormTemplateKey>('solar');
  const [formUrlInput, setFormUrlInput] = useState('');

  const [selectedForm, setSelectedForm] = useState<GoogleFormDetails | null>(null);
  const [responses, setResponses] = useState<GoogleFormResponseItem[]>([]);
  const [workspaceTab, setWorkspaceTab] = useState<FormWorkspaceSubtab>('responses');

  // Add question form inputs
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionKind, setNewQuestionKind] = useState<
    'SHORT_ANSWER' | 'PARAGRAPH' | 'MULTIPLE_CHOICE'
  >('SHORT_ANSWER');
  const [newQuestionOptions, setNewQuestionOptions] = useState('');
  const [newQuestionRequired, setNewQuestionRequired] = useState(true);

  const [copiedResponder, setCopiedResponder] = useState(false);
  const [importedIds, setImportedIds] = useState<Record<string, boolean>>({});
  const [publishedPublicForm, setPublishedPublicForm] =
    useState<PublicGoogleFormConfig | null>(null);
  const [publicLinkInput, setPublicLinkInput] = useState('');
  const [publicTitleInput, setPublicTitleInput] = useState('');

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingMutation, setPendingMutation] = useState<PendingFormsMutation | null>(null);

  useEffect(() => {
    const token = initialAccessToken ?? getGoogleAccessToken();
    if (token) setAccessToken(token);
  }, [initialAccessToken]);

  useEffect(() => {
    let active = true;
    async function loadPublishedForm() {
      try {
        const existing = await fetchPublishedGoogleForm();
        if (active) setPublishedPublicForm(existing);
      } catch {
        // Non-blocking
      }
    }
    void loadPublishedForm();
    return () => {
      active = false;
    };
  }, []);

  const loadDriveList = async (token: string) => {
    setBusyAction('list_drive');
    setErrorMsg(null);
    try {
      const files = await listDriveForms(token);
      setDriveForms(files);
      setDriveLoaded(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to list Google Forms from Drive.');
    } finally {
      setBusyAction(null);
    }
  };

  useEffect(() => {
    if (accessToken && !driveLoaded) {
      void loadDriveList(accessToken);
    }
  }, [accessToken, driveLoaded]);

  const handleAuthorizeWorkspace = async () => {
    setErrorMsg(null);
    setStatusMsg(null);
    setBusyAction('auth');
    try {
      const { accessToken: token } = await signInWithGoogleWorkspace();
      if (!token) {
        setErrorMsg(
          'Google Forms & Drive permission was not granted. Please allow the requested permissions when prompted.'
        );
      } else {
        setAccessToken(token);
        onTokenUpdated?.(token);
        setStatusMsg('Google Forms & Drive session connected.');
        await loadDriveList(token);
      }
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-blocked') {
        setErrorMsg(
          'Your browser blocked the Google sign-in popup. Please allow popups for this site and try again.'
        );
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setErrorMsg('Authorization popup was closed before completing Google Forms & Drive grant.');
      } else {
        setErrorMsg(
          'Unable to complete Google Forms & Drive OAuth popup. Make sure your administrator email is permitted on project giga-dream-3sjh2 and popups are allowed.'
        );
      }
    } finally {
      setBusyAction(null);
    }
  };

  const openFormById = async (formId: string, tokenOverride?: string) => {
    const token = tokenOverride ?? accessToken;
    if (!token) {
      setErrorMsg('Please authorize Google Forms & Drive first.');
      return;
    }
    setBusyAction('load_form');
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const details = await fetchGoogleForm(token, formId);
      const formResponses = await fetchFormResponses(token, details);
      setSelectedForm(details);
      setResponses(formResponses);
      setStatusMsg(
        `Loaded "${details.title}" (${details.items.length} item(s), ${formResponses.length} response(s)).`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to load Google Form.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleLoadFromUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);

    const extracted = extractFormId(formUrlInput);
    if (extracted.isResponderUrl) {
      setErrorMsg(
        'That looks like a public responder link (/forms/d/e/...). Google Forms API requires the editable Form ID from /forms/d/<FORM_ID>/edit or selecting the form from your Google Drive list.'
      );
      return;
    }
    if (!extracted.formId) {
      setErrorMsg('Please paste a valid Google Form Edit URL (/forms/d/<ID>/edit) or Form ID.');
      return;
    }

    await openFormById(extracted.formId);
    setFormUrlInput('');
  };

  const handleCopyResponderLink = async (uri: string) => {
    try {
      await navigator.clipboard.writeText(uri);
      setCopiedResponder(true);
      setTimeout(() => setCopiedResponder(false), 2500);
    } catch {
      setErrorMsg('Unable to copy link automatically. Use the Open Live Form button instead.');
    }
  };

  const executeConfirmedMutation = async () => {
    if (!pendingMutation) return;
    const action = pendingMutation;
    setPendingMutation(null);
    setErrorMsg(null);
    setStatusMsg(null);

    if (action.type === 'import_response') {
      setBusyAction(`import_${action.response.responseId}`);
      try {
        const input = mapFormResponseToEnquiryInput(action.form, action.response);
        await submitEnquiry(input);
        setImportedIds((prev) => ({ ...prev, [action.response.responseId]: true }));
        setStatusMsg(
          `Imported response from "${input.fullName}" into Teracore Enquiries. Open the Enquiries tab to review or sync to Google Sheets.`
        );
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to import response.');
      } finally {
        setBusyAction(null);
      }
      return;
    }

    if (action.type === 'import_all') {
      setBusyAction('import_all');
      try {
        let importedCount = 0;
        const newImported: Record<string, boolean> = {};
        for (const resp of action.responses) {
          if (importedIds[resp.responseId]) continue;
          const input = mapFormResponseToEnquiryInput(action.form, resp);
          await submitEnquiry(input);
          newImported[resp.responseId] = true;
          importedCount++;
        }
        setImportedIds((prev) => ({ ...prev, ...newImported }));
        setStatusMsg(
          `Imported ${importedCount} form response(s) into the Teracore Enquiries ledger.`
        );
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed while importing responses.');
      } finally {
        setBusyAction(null);
      }
      return;
    }

    if (action.type === 'publish_public_form') {
      setBusyAction('publish_public_form');
      try {
        await publishPublicGoogleForm({
          formId: action.formId,
          title: action.title,
          description: action.description,
          responderUri: action.responderUri,
        });
        const refreshed = await fetchPublishedGoogleForm();
        setPublishedPublicForm(refreshed);
        setPublicLinkInput('');
        setPublicTitleInput('');
        setStatusMsg(
          `"${action.title}" is now live for visitors on the Request a Quote page (/request-a-quote).`
        );
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Unable to publish Google Form to website.'
        );
      } finally {
        setBusyAction(null);
      }
      return;
    }

    if (action.type === 'unpublish_public_form') {
      setBusyAction('unpublish_public_form');
      try {
        await unpublishPublicGoogleForm();
        setPublishedPublicForm(null);
        setStatusMsg(
          `Removed "${action.title}" from the public Request a Quote page. Visitors now see the built-in Smart Quote Form.`
        );
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : 'Unable to unpublish Google Form from website.'
        );
      } finally {
        setBusyAction(null);
      }
      return;
    }

    if (!accessToken) {
      setErrorMsg('Please authorize Google Forms & Drive first.');
      return;
    }

    if (action.type === 'create_form') {
      setBusyAction('create_form');
      try {
        const created = await createTeracoreIntakeForm(accessToken, action.templateKey);
        setSelectedForm(created);
        setResponses([]);
        setWorkspaceTab('questions');
        setStatusMsg(
          `Created "${created.title}" in Google Forms with ${created.items.length} structured intake questions.`
        );
        await loadDriveList(accessToken);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to create Google Form.');
      } finally {
        setBusyAction(null);
      }
      return;
    }

    if (action.type === 'add_question') {
      setBusyAction('add_question');
      try {
        const updated = await addQuestionToForm(accessToken, action.formId, {
          title: action.title,
          required: action.required,
          kind: action.kind,
          options: action.options,
          index: action.index,
        });
        setSelectedForm(updated);
        setNewQuestionTitle('');
        setNewQuestionOptions('');
        setStatusMsg(`Added question "${action.title}" to "${action.formTitle}".`);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to add question to Google Form.');
      } finally {
        setBusyAction(null);
      }
      return;
    }

    if (action.type === 'delete_form') {
      setBusyAction('delete_form');
      try {
        await deleteDriveForm(accessToken, action.formId);
        if (selectedForm?.formId === action.formId) {
          setSelectedForm(null);
          setResponses([]);
        }
        setDriveForms((prev) => prev.filter((f) => f.id !== action.formId));
        setStatusMsg(`Deleted "${action.formTitle}" from Google Drive.`);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to delete Google Form.');
      } finally {
        setBusyAction(null);
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Authorization Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
              <ClipboardList className="w-4.5 h-4.5 text-indigo-700" />
            </div>
            <div>
              <h2 className="font-display text-sm sm:text-base font-bold text-slate-900">
                Google Forms &amp; Drive Integration
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Create client intake forms in your Google account, inspect live form questions &amp; responses, and import submissions directly into Teracore Enquiries.
              </p>
            </div>
          </div>

          {accessToken ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Forms &amp; Drive Connected</span>
              </span>
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() => void loadDriveList(accessToken)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg cursor-pointer whitespace-nowrap"
              >
                {busyAction === 'list_drive' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Refresh Drive Forms</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={busyAction === 'auth'}
              onClick={() => void handleAuthorizeWorkspace()}
              className="inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer whitespace-nowrap self-start lg:self-auto"
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
                {busyAction === 'auth' ? 'Connecting...' : 'Authorize Google Forms & Drive'}
              </span>
            </button>
          )}
        </div>

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

        {/* Create New Teracore Form + Open Existing Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-slate-200">
          <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5">
            <div className="text-xs font-semibold text-slate-900">
              Create New Teracore Intake Form
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value as TeracoreFormTemplateKey)}
                disabled={!accessToken || busyAction !== null}
                aria-label="Select Teracore form template"
                className="flex-1 px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg disabled:bg-slate-100"
              >
                {Object.entries(TERACORE_FORM_TEMPLATES).map(([key, tpl]) => (
                  <option key={key} value={key}>
                    {tpl.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!accessToken || busyAction !== null}
                onClick={() =>
                  setPendingMutation({
                    type: 'create_form',
                    templateKey,
                    templateTitle: TERACORE_FORM_TEMPLATES[templateKey].title,
                  })
                }
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                {busyAction === 'create_form' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Create Google Form</span>
              </button>
            </div>
          </div>

          <form
            onSubmit={(e) => void handleLoadFromUrl(e)}
            className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5"
          >
            <div className="text-xs font-semibold text-slate-900">
              Open Form by Edit URL or Form ID
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={formUrlInput}
                onChange={(e) => setFormUrlInput(e.target.value)}
                placeholder="Paste https://docs.google.com/forms/d/<ID>/edit or Form ID..."
                disabled={!accessToken || busyAction !== null}
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={!accessToken || busyAction !== null || !formUrlInput.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-navy-900 bg-white hover:bg-slate-100 disabled:opacity-50 border border-slate-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                {busyAction === 'load_form' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>Load Form</span>
              </button>
            </div>
          </form>
        </div>

        {/* Public Visitor Placement (/request-a-quote) Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Public Form on Request a Quote Page (/request-a-quote)
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {publishedPublicForm
                    ? `Visitors on /request-a-quote currently see "${publishedPublicForm.title}" embedded directly on the page alongside the Smart Quote Form.`
                    : 'No Google Form is published to visitors yet. Visitors on /request-a-quote and /contact currently see Teracore’s built-in Smart Quote Form. Select a form below or paste any Google Form link to show it to visitors on /request-a-quote.'}
                </p>
              </div>
            </div>

            {publishedPublicForm && (
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <a
                  href="/request-a-quote"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-navy-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg"
                >
                  <span>View on /request-a-quote</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
                <button
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() =>
                    setPendingMutation({
                      type: 'unpublish_public_form',
                      title: publishedPublicForm.title,
                    })
                  }
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg cursor-pointer"
                >
                  <span>Unpublish</span>
                </button>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setErrorMsg(null);
              const cleaned = publicLinkInput.trim();
              if (!/^https:\/\/docs\.google\.com\/forms\/.+$/.test(cleaned)) {
                setErrorMsg(
                  'Please enter a valid Google Form link starting with https://docs.google.com/forms/'
                );
                return;
              }
              const extracted = extractFormId(cleaned);
              const responderMatch = cleaned.match(/\/forms\/d\/e\/([a-zA-Z0-9_-]+)/);
              const resolvedId =
                extracted.formId || responderMatch?.[1] || 'external-google-form';
              const normalizedUri = cleaned.includes('/edit')
                ? cleaned.replace(/\/edit.*$/, '/viewform')
                : cleaned;

              setPendingMutation({
                type: 'publish_public_form',
                formId: resolvedId,
                title: publicTitleInput.trim() || 'Teracore Project & Quote Google Form',
                responderUri: normalizedUri,
              });
            }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-2 pt-2 border-t border-slate-200"
          >
            <input
              type="text"
              value={publicTitleInput}
              onChange={(e) => setPublicTitleInput(e.target.value)}
              placeholder="Form heading for visitors (e.g. Teracore Solar & Quote Intake)"
              className="lg:col-span-4 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
            <input
              type="url"
              required
              value={publicLinkInput}
              onChange={(e) => setPublicLinkInput(e.target.value)}
              placeholder="Paste Google Form link (https://docs.google.com/forms/d/.../viewform)"
              className="lg:col-span-6 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600"
            />
            <button
              type="submit"
              disabled={busyAction !== null || !publicLinkInput.trim()}
              className="lg:col-span-2 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 disabled:opacity-50 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publish to /request-a-quote</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main Split: Drive Forms List + Selected Form Workspace */}
      {accessToken && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Drive Forms List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden self-start">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                My Google Forms ({driveForms.length})
              </span>
            </div>
            {busyAction === 'list_drive' && driveForms.length === 0 ? (
              <div className="p-6 text-xs text-slate-500 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading forms from Google Drive...</span>
              </div>
            ) : driveForms.length === 0 ? (
              <div className="p-6 text-xs text-slate-500 text-center">
                No Google Forms found in your Google Drive yet. Create one using a Teracore template above.
              </div>
            ) : (
              <div className="divide-y divide-slate-200 max-h-[520px] overflow-y-auto">
                {driveForms.map((f) => {
                  const isActive = selectedForm?.formId === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      disabled={busyAction !== null}
                      onClick={() => void openFormById(f.id)}
                      className={`w-full text-left px-4 py-3 transition-colors cursor-pointer flex items-start justify-between gap-2 ${
                        isActive ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {f.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono truncate">
                          {f.modifiedTime
                            ? `Updated ${new Date(f.modifiedTime).toLocaleDateString()}`
                            : f.id}
                        </div>
                      </div>
                      <FileText
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          isActive ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Active Form Inspector & Responses */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
            {!selectedForm ? (
              <div className="p-10 text-center space-y-2">
                <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
                <div className="text-sm font-semibold text-slate-700">
                  Select or Create a Google Form
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Choose any Google Form from your Drive list on the left, load a form by edit URL, or generate a new Teracore intake template to view questions, responses, and import enquiries.
                </p>
              </div>
            ) : (
              <div>
                {/* Selected Form Header */}
                <div className="p-5 border-b border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="font-display text-base sm:text-lg font-bold text-slate-900">
                        {selectedForm.title}
                      </h3>
                      {selectedForm.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {selectedForm.description}
                        </p>
                      )}
                      <div className="text-[11px] font-mono text-slate-500">
                        Form ID: {selectedForm.formId}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={busyAction !== null}
                        onClick={() =>
                          setPendingMutation({
                            type: 'publish_public_form',
                            formId: selectedForm.formId,
                            title: selectedForm.title,
                            description: selectedForm.description,
                            responderUri: selectedForm.responderUri,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg cursor-pointer"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>
                          {publishedPublicForm?.formId === selectedForm.formId
                            ? 'Live on /request-a-quote'
                            : 'Publish to /request-a-quote'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleCopyResponderLink(selectedForm.responderUri)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                      >
                        {copiedResponder ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Link Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Public Link</span>
                          </>
                        )}
                      </button>

                      <a
                        href={selectedForm.responderUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 rounded-lg"
                      >
                        <span>Open Live Form</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <a
                        href={selectedForm.editUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg"
                      >
                        <span>Edit in Google Forms</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </a>

                      <button
                        type="button"
                        disabled={busyAction !== null}
                        onClick={() => void openFormById(selectedForm.formId)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg cursor-pointer"
                        title="Refresh form details and responses"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            busyAction === 'load_form' ? 'animate-spin' : ''
                          }`}
                        />
                        <span>Refresh</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyAction !== null}
                        onClick={() =>
                          setPendingMutation({
                            type: 'delete_form',
                            formId: selectedForm.formId,
                            formTitle: selectedForm.title,
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 rounded-lg cursor-pointer"
                        title="Delete form from Google Drive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Subtabs: Responses vs Questions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() => setWorkspaceTab('responses')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                          workspaceTab === 'responses'
                            ? 'bg-navy-900 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Inbox className="w-3.5 h-3.5" />
                        <span>Responses ({responses.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkspaceTab('questions')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                          workspaceTab === 'questions'
                            ? 'bg-navy-900 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ClipboardList className="w-3.5 h-3.5" />
                        <span>Questions ({selectedForm.items.length})</span>
                      </button>
                    </div>

                    {workspaceTab === 'responses' && responses.length > 0 && (
                      <button
                        type="button"
                        disabled={busyAction !== null}
                        onClick={() =>
                          setPendingMutation({
                            type: 'import_all',
                            form: selectedForm,
                            responses,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Import All to Enquiries</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Subtab Content: Responses */}
                {workspaceTab === 'responses' ? (
                  responses.length === 0 ? (
                    <div className="p-10 text-center space-y-2">
                      <Inbox className="w-7 h-7 text-slate-300 mx-auto" />
                      <div className="text-sm font-semibold text-slate-700">
                        No Responses Submitted Yet
                      </div>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Share the public form link with clients or test a submission via &ldquo;Open Live Form&rdquo;, then click Refresh to inspect answers and import them into Enquiries.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {responses.map((resp) => {
                        const alreadyImported = Boolean(importedIds[resp.responseId]);
                        return (
                          <div key={resp.responseId} className="p-5 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="text-xs text-slate-500 font-mono">
                                {resp.lastSubmittedTime
                                  ? `Submitted ${new Date(resp.lastSubmittedTime).toLocaleString()}`
                                  : resp.responseId}
                                {resp.respondentEmail ? ` · ${resp.respondentEmail}` : ''}
                              </div>
                              <button
                                type="button"
                                disabled={busyAction !== null || alreadyImported}
                                onClick={() =>
                                  setPendingMutation({
                                    type: 'import_response',
                                    form: selectedForm,
                                    response: resp,
                                  })
                                }
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
                                  alreadyImported
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50'
                                }`}
                              >
                                {alreadyImported ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Imported to Enquiries</span>
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Import to Enquiries</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {resp.formattedAnswers.map((ans) => (
                                <div
                                  key={ans.questionId}
                                  className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
                                >
                                  <div className="font-semibold text-slate-700">
                                    {ans.questionTitle}
                                  </div>
                                  <div className="text-slate-900 mt-0.5 whitespace-pre-line">
                                    {ans.answerText}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  /* Subtab Content: Questions & Add Question Builder */
                  <div className="p-5 space-y-5">
                    <div className="space-y-2.5">
                      {selectedForm.items.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
                          This Google Form currently has no questions. Add your first question below.
                        </div>
                      ) : (
                        selectedForm.items.map((item, idx) => (
                          <div
                            key={item.itemId}
                            className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-xs font-semibold text-slate-900">
                                {idx + 1}. {item.title}
                                {item.required && <span className="text-red-600 ml-1">*</span>}
                              </div>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                                {item.kind.replace('_', ' ')}
                              </span>
                            </div>
                            {item.description && (
                              <div className="text-xs text-slate-500">{item.description}</div>
                            )}
                            {item.options && item.options.length > 0 && (
                              <div className="text-[11px] text-slate-600 pt-1">
                                Options: {item.options.join(' · ')}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Question Form */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newQuestionTitle.trim()) return;
                        const parsedOptions = newQuestionOptions
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean);
                        setPendingMutation({
                          type: 'add_question',
                          formId: selectedForm.formId,
                          formTitle: selectedForm.title,
                          title: newQuestionTitle.trim(),
                          required: newQuestionRequired,
                          kind: newQuestionKind,
                          options:
                            newQuestionKind === 'MULTIPLE_CHOICE'
                              ? parsedOptions.length > 0
                                ? parsedOptions
                                : ['Option 1', 'Option 2']
                              : [],
                          index: selectedForm.items.length,
                        });
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3"
                    >
                      <div className="text-xs font-bold text-slate-900">
                        Add Question to Form
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                        <input
                          type="text"
                          required
                          value={newQuestionTitle}
                          onChange={(e) => setNewQuestionTitle(e.target.value)}
                          placeholder="Question prompt (e.g. Estimated Monthly Power Spend)"
                          className="sm:col-span-6 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                        <select
                          value={newQuestionKind}
                          onChange={(e) =>
                            setNewQuestionKind(
                              e.target.value as 'SHORT_ANSWER' | 'PARAGRAPH' | 'MULTIPLE_CHOICE'
                            )
                          }
                          className="sm:col-span-4 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        >
                          <option value="SHORT_ANSWER">Short Answer</option>
                          <option value="PARAGRAPH">Paragraph</option>
                          <option value="MULTIPLE_CHOICE">Multiple Choice (Radio)</option>
                        </select>
                        <label className="sm:col-span-2 inline-flex items-center gap-1.5 text-xs text-slate-700 px-2">
                          <input
                            type="checkbox"
                            checked={newQuestionRequired}
                            onChange={(e) => setNewQuestionRequired(e.target.checked)}
                            className="rounded border-slate-300"
                          />
                          <span>Required</span>
                        </label>
                      </div>

                      {newQuestionKind === 'MULTIPLE_CHOICE' && (
                        <input
                          type="text"
                          required
                          value={newQuestionOptions}
                          onChange={(e) => setNewQuestionOptions(e.target.value)}
                          placeholder="Comma-separated options (e.g. Residential, Commercial, Industrial)"
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
                        />
                      )}

                      <button
                        type="submit"
                        disabled={busyAction !== null || !newQuestionTitle.trim()}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 disabled:opacity-50 rounded-lg cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Question</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explicit Confirmation Modal for All Mutating / Destructive Actions */}
      {pendingMutation && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Google Forms Action"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-display text-lg font-bold text-slate-900">
              {pendingMutation.type === 'create_form' && 'Create Google Form?'}
              {pendingMutation.type === 'add_question' && 'Add Question to Google Form?'}
              {pendingMutation.type === 'delete_form' && 'Delete Google Form from Drive?'}
              {pendingMutation.type === 'import_response' && 'Import Response to Enquiries?'}
              {pendingMutation.type === 'import_all' && 'Import All Responses to Enquiries?'}
              {pendingMutation.type === 'publish_public_form' &&
                'Publish Google Form to Request a Quote Page?'}
              {pendingMutation.type === 'unpublish_public_form' &&
                'Remove Google Form from Public Page?'}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {pendingMutation.type === 'create_form' &&
                `This will create a new Google Form titled "${pendingMutation.templateTitle}" in your Google Drive with pre-configured Teracore client intake questions.`}
              {pendingMutation.type === 'add_question' &&
                `This will append the question "${pendingMutation.title}" to "${pendingMutation.formTitle}" in Google Forms.`}
              {pendingMutation.type === 'delete_form' &&
                `This will permanently delete "${pendingMutation.formTitle}" from your Google Drive. This cannot be undone from the Teracore console.`}
              {pendingMutation.type === 'import_response' &&
                `This will create a new customer enquiry record in the Teracore database from this response on "${pendingMutation.form.title}".`}
              {pendingMutation.type === 'import_all' &&
                `This will import up to ${pendingMutation.responses.length} response(s) from "${pendingMutation.form.title}" into the Teracore Enquiries database.`}
              {pendingMutation.type === 'publish_public_form' &&
                `This will embed "${pendingMutation.title}" on the public Request a Quote page (/request-a-quote) so any website visitor can view and submit it directly.`}
              {pendingMutation.type === 'unpublish_public_form' &&
                `This will remove "${pendingMutation.title}" from the public Request a Quote page. Your Google Form in Google Drive will not be deleted.`}
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
                  pendingMutation.type === 'delete_form' ||
                  pendingMutation.type === 'unpublish_public_form'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {pendingMutation.type === 'create_form' && 'Confirm & Create Form'}
                {pendingMutation.type === 'add_question' && 'Confirm Add Question'}
                {pendingMutation.type === 'delete_form' && 'Confirm Delete Form'}
                {pendingMutation.type === 'import_response' && 'Confirm Import'}
                {pendingMutation.type === 'import_all' && 'Confirm Import All'}
                {pendingMutation.type === 'publish_public_form' && 'Confirm Publish to /request-a-quote'}
                {pendingMutation.type === 'unpublish_public_form' && 'Confirm Unpublish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

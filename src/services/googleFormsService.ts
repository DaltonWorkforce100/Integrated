import type {
  EnquiryInput,
  EnquiryServiceType,
  PreferredContactMethod,
} from '../types/teracore';

const FORMS_API_BASE = 'https://forms.googleapis.com/v1/forms';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';

export type TeracoreFormTemplateKey = 'solar' | 'cctv' | 'it' | 'general';

export type FormQuestionKind =
  | 'SHORT_ANSWER'
  | 'PARAGRAPH'
  | 'MULTIPLE_CHOICE'
  | 'DATE'
  | 'TIME'
  | 'FILE_UPLOAD'
  | 'SCALE'
  | 'GRID'
  | 'SECTION'
  | 'OTHER';

export interface DriveFormSummary {
  id: string;
  name: string;
  webViewLink: string;
  modifiedTime?: string;
}

export interface FormQuestionItem {
  itemId: string;
  questionId?: string;
  title: string;
  description?: string;
  required: boolean;
  kind: FormQuestionKind;
  options?: string[];
}

export interface GoogleFormDetails {
  formId: string;
  title: string;
  documentTitle: string;
  description: string;
  responderUri: string;
  editUrl: string;
  items: FormQuestionItem[];
}

export interface FormattedFormAnswer {
  questionId: string;
  questionTitle: string;
  answerText: string;
}

export interface GoogleFormResponseItem {
  responseId: string;
  createTime: string;
  lastSubmittedTime: string;
  respondentEmail?: string;
  formattedAnswers: FormattedFormAnswer[];
}

export interface ExtractedFormIdResult {
  formId: string | null;
  isResponderUrl: boolean;
}

export function extractFormId(input: string): ExtractedFormIdResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { formId: null, isResponderUrl: false };
  }

  if (/\/forms\/d\/e\/[a-zA-Z0-9_-]+/.test(trimmed)) {
    return { formId: null, isResponderUrl: true };
  }

  const editMatch = trimmed.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/);
  if (editMatch?.[1]) {
    return { formId: editMatch[1], isResponderUrl: false };
  }

  if (/^[a-zA-Z0-9_-]{15,120}$/.test(trimmed)) {
    return { formId: trimmed, isResponderUrl: false };
  }

  return { formId: null, isResponderUrl: false };
}

async function parseGoogleWorkspaceError(res: Response, serviceLabel: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: { message?: string; status?: string } };
    if (res.status === 401) {
      return `Your ${serviceLabel} authorization expired. Please click "Authorize Google Forms & Drive" to reconnect.`;
    }
    if (res.status === 403) {
      const apiMsg = data?.error?.message;
      if (apiMsg && /disabled|not been used|scope|insufficient/i.test(apiMsg)) {
        return apiMsg;
      }
      return `Access denied by ${serviceLabel}. Ensure your Google account owns or has edit access to this form and granted Google Forms & Drive permissions.`;
    }
    if (res.status === 404) {
      return 'Google Form not found. Check the Form ID or edit URL (note: public /forms/d/e/... links cannot be queried by the Forms API—use the /forms/d/<ID>/edit link).';
    }
    return data?.error?.message || `${serviceLabel} API returned status ${res.status}.`;
  } catch {
    return `${serviceLabel} request failed with status ${res.status}.`;
  }
}

export async function listDriveForms(accessToken: string): Promise<DriveFormSummary[]> {
  const query = encodeURIComponent(
    "mimeType='application/vnd.google-apps.form' and trashed=false"
  );
  const fields = encodeURIComponent('files(id,name,webViewLink,modifiedTime)');
  const orderBy = encodeURIComponent('modifiedTime desc');

  const res = await fetch(
    `${DRIVE_API_BASE}?q=${query}&fields=${fields}&orderBy=${orderBy}&pageSize=30`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    throw new Error(await parseGoogleWorkspaceError(res, 'Google Drive'));
  }

  const data = (await res.json()) as {
    files?: Array<{
      id?: string;
      name?: string;
      webViewLink?: string;
      modifiedTime?: string;
    }>;
  };

  return (data.files ?? [])
    .filter((f): f is { id: string; name?: string; webViewLink?: string; modifiedTime?: string } =>
      Boolean(f.id)
    )
    .map((f) => ({
      id: f.id,
      name: f.name || 'Untitled Google Form',
      webViewLink:
        f.webViewLink || `https://docs.google.com/forms/d/${encodeURIComponent(f.id)}/edit`,
      modifiedTime: f.modifiedTime,
    }));
}

interface RawFormItem {
  itemId?: string;
  title?: string;
  description?: string;
  questionItem?: {
    question?: {
      questionId?: string;
      required?: boolean;
      textQuestion?: { paragraph?: boolean };
      choiceQuestion?: {
        type?: string;
        options?: Array<{ value?: string; isOther?: boolean }>;
      };
      dateQuestion?: Record<string, unknown>;
      timeQuestion?: Record<string, unknown>;
      fileUploadQuestion?: Record<string, unknown>;
      scaleQuestion?: Record<string, unknown>;
    };
  };
  questionGroupItem?: Record<string, unknown>;
  pageBreakItem?: Record<string, unknown>;
}

interface RawGoogleForm {
  formId?: string;
  info?: {
    title?: string;
    documentTitle?: string;
    description?: string;
  };
  responderUri?: string;
  items?: RawFormItem[];
}

function mapRawFormItem(item: RawFormItem, index: number): FormQuestionItem {
  const q = item.questionItem?.question;
  let kind: FormQuestionKind = 'OTHER';
  let options: string[] | undefined;

  if (item.pageBreakItem) {
    kind = 'SECTION';
  } else if (item.questionGroupItem) {
    kind = 'GRID';
  } else if (q?.textQuestion) {
    kind = q.textQuestion.paragraph ? 'PARAGRAPH' : 'SHORT_ANSWER';
  } else if (q?.choiceQuestion) {
    kind = 'MULTIPLE_CHOICE';
    options = (q.choiceQuestion.options ?? [])
      .map((opt) => opt.value || (opt.isOther ? 'Other' : ''))
      .filter(Boolean);
  } else if (q?.dateQuestion) {
    kind = 'DATE';
  } else if (q?.timeQuestion) {
    kind = 'TIME';
  } else if (q?.fileUploadQuestion) {
    kind = 'FILE_UPLOAD';
  } else if (q?.scaleQuestion) {
    kind = 'SCALE';
  }

  return {
    itemId: item.itemId || `item_${index}`,
    questionId: q?.questionId,
    title: item.title || `Question ${index + 1}`,
    description: item.description,
    required: Boolean(q?.required),
    kind,
    options,
  };
}

export async function fetchGoogleForm(
  accessToken: string,
  formId: string
): Promise<GoogleFormDetails> {
  const safeFormId = encodeURIComponent(formId.trim());
  const res = await fetch(`${FORMS_API_BASE}/${safeFormId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(await parseGoogleWorkspaceError(res, 'Google Forms'));
  }

  const data = (await res.json()) as RawGoogleForm;
  const resolvedId = data.formId || formId.trim();
  const safeResolvedId = encodeURIComponent(resolvedId);

  return {
    formId: resolvedId,
    title: data.info?.title || data.info?.documentTitle || 'Untitled Google Form',
    documentTitle: data.info?.documentTitle || data.info?.title || 'Untitled Google Form',
    description: data.info?.description || '',
    responderUri:
      data.responderUri || `https://docs.google.com/forms/d/${safeResolvedId}/viewform`,
    editUrl: `https://docs.google.com/forms/d/${safeResolvedId}/edit`,
    items: (data.items ?? []).map(mapRawFormItem),
  };
}

interface RawFormResponse {
  responseId?: string;
  createTime?: string;
  lastSubmittedTime?: string;
  respondentEmail?: string;
  answers?: Record<
    string,
    {
      questionId?: string;
      textAnswers?: {
        answers?: Array<{ value?: string }>;
      };
      fileUploadAnswers?: {
        answers?: Array<{ fileName?: string; fileId?: string }>;
      };
    }
  >;
}

export async function fetchFormResponses(
  accessToken: string,
  form: GoogleFormDetails
): Promise<GoogleFormResponseItem[]> {
  const safeFormId = encodeURIComponent(form.formId.trim());
  const res = await fetch(`${FORMS_API_BASE}/${safeFormId}/responses`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(await parseGoogleWorkspaceError(res, 'Google Forms'));
  }

  const data = (await res.json()) as { responses?: RawFormResponse[] };
  const questionTitleById = new Map<string, string>();
  for (const item of form.items) {
    if (item.questionId) {
      questionTitleById.set(item.questionId, item.title);
    }
  }

  return (data.responses ?? [])
    .map((resp, idx) => {
      const formattedAnswers: FormattedFormAnswer[] = [];
      const answersObj = resp.answers ?? {};

      // Preserve form item order first
      for (const item of form.items) {
        if (!item.questionId) continue;
        const ans = answersObj[item.questionId];
        if (!ans) continue;
        const textVals = (ans.textAnswers?.answers ?? [])
          .map((a) => a.value?.trim() || '')
          .filter(Boolean);
        const fileVals = (ans.fileUploadAnswers?.answers ?? [])
          .map((f) => f.fileName || f.fileId || '')
          .filter(Boolean);
        const combined = [...textVals, ...fileVals].join(', ');
        if (combined) {
          formattedAnswers.push({
            questionId: item.questionId,
            questionTitle: item.title,
            answerText: combined,
          });
        }
      }

      // Include any answers from previously deleted questions still present in responses
      for (const [qId, ans] of Object.entries(answersObj)) {
        if (questionTitleById.has(qId)) continue;
        const textVals = (ans.textAnswers?.answers ?? [])
          .map((a) => a.value?.trim() || '')
          .filter(Boolean);
        if (textVals.length > 0) {
          formattedAnswers.push({
            questionId: qId,
            questionTitle: `Question (${qId})`,
            answerText: textVals.join(', '),
          });
        }
      }

      return {
        responseId: resp.responseId || `resp_${idx}`,
        createTime: resp.createTime || '',
        lastSubmittedTime: resp.lastSubmittedTime || resp.createTime || '',
        respondentEmail: resp.respondentEmail,
        formattedAnswers,
      };
    })
    .sort((a, b) => (b.lastSubmittedTime || '').localeCompare(a.lastSubmittedTime || ''));
}

interface TemplateQuestionSpec {
  title: string;
  description?: string;
  required: boolean;
  kind: 'SHORT_ANSWER' | 'PARAGRAPH' | 'MULTIPLE_CHOICE' | 'DATE';
  options?: string[];
}

export const TERACORE_FORM_TEMPLATES: Record<
  TeracoreFormTemplateKey,
  {
    label: string;
    title: string;
    description: string;
    questions: TemplateQuestionSpec[];
  }
> = {
  solar: {
    label: 'Solar & Inverter Site Assessment',
    title: 'Teracore Solar & Hybrid Inverter Site Assessment',
    description:
      'Teracore Integrated Solution (Enugu, Nigeria) — Complete this short intake form so our solar engineers can size your LiFePO4 battery bank, hybrid inverter, and PV array.',
    questions: [
      { title: 'Full Name or Organization', required: true, kind: 'SHORT_ANSWER' },
      { title: 'Phone / WhatsApp Number', required: true, kind: 'SHORT_ANSWER' },
      { title: 'Email Address', required: false, kind: 'SHORT_ANSWER' },
      { title: 'Site Location (City & State)', required: true, kind: 'SHORT_ANSWER' },
      {
        title: 'Property Type',
        required: true,
        kind: 'MULTIPLE_CHOICE',
        options: [
          'Residential Home / Duplex',
          'Commercial Office / Retail',
          'Hospital / Clinic / Lab',
          'School / Campus / Hotel',
          'Industrial / Warehouse',
        ],
      },
      {
        title: 'Key Appliances & Target Backup Needs',
        description:
          'List ACs, freezers, borehole pumps, lighting, servers, and desired backup hours.',
        required: true,
        kind: 'PARAGRAPH',
      },
      {
        title: 'Preferred Contact Channel',
        required: true,
        kind: 'MULTIPLE_CHOICE',
        options: ['WhatsApp', 'Phone Call', 'Email'],
      },
      { title: 'Preferred Site Inspection Date', required: false, kind: 'DATE' },
    ],
  },
  cctv: {
    label: 'CCTV & Smart Security Audit',
    title: 'Teracore CCTV & Smart Security Survey',
    description:
      'Teracore Integrated Solution — Tell us about your premises and coverage zones for a custom IP CCTV, NVR, and remote viewing quotation.',
    questions: [
      { title: 'Full Name or Organization', required: true, kind: 'SHORT_ANSWER' },
      { title: 'Phone / WhatsApp Number', required: true, kind: 'SHORT_ANSWER' },
      { title: 'Email Address', required: false, kind: 'SHORT_ANSWER' },
      { title: 'Premises Location (Address / State)', required: true, kind: 'SHORT_ANSWER' },
      {
        title: 'Estimated Camera Count',
        required: true,
        kind: 'MULTIPLE_CHOICE',
        options: ['1–4 Cameras', '5–8 Cameras', '9–16 Cameras', '17–32+ Cameras / PTZ'],
      },
      {
        title: 'Areas to Cover & Special Requirements',
        description:
          'Perimeter gates, parking lots, indoor corridors, solar-powered cameras, ANPR, or audio.',
        required: true,
        kind: 'PARAGRAPH',
      },
      {
        title: 'Preferred Contact Channel',
        required: true,
        kind: 'MULTIPLE_CHOICE',
        options: ['WhatsApp', 'Phone Call', 'Email'],
      },
    ],
  },
  it: {
    label: 'IT & Network Infrastructure Intake',
    title: 'Teracore Enterprise IT & Networking Intake',
    description:
      'Teracore Integrated Solution — Request structured cabling, UniFi/MikroTik enterprise Wi-Fi, Starlink integration, server rack deployment, or managed support.',
    questions: [
      { title: 'Full Name & Company', required: true, kind: 'SHORT_ANSWER' },
      { title: 'Phone / WhatsApp Number', required: true, kind: 'SHORT_ANSWER' },
      { title: 'Work Email Address', required: false, kind: 'SHORT_ANSWER' },
      { title: 'Office / Campus Location', required: true, kind: 'SHORT_ANSWER' },
      {
        title: 'Primary IT Scope',
        required: true,
        kind: 'MULTIPLE_CHOICE',
        options: [
          'Structured Cat6/Fiber Cabling & Server Rack',
          'Enterprise Wi-Fi & Firewall Routing',
          'Starlink Business & Multi-WAN Failover',
          'Access Control & Biometric Attendance',
          'Managed IT Support Retainer',
        ],
      },
      {
        title: 'Users / Floors / Project Details',
        required: true,
        kind: 'PARAGRAPH',
      },
      {
        title: 'Preferred Contact Channel',
        required: true,
        kind: 'MULTIPLE_CHOICE',
        options: ['WhatsApp', 'Phone Call', 'Email'],
      },
    ],
  },
  general: {
    label: 'General Consultation & Multi-System Quote',
    title: 'Teracore Client Project & Quote Request',
    description:
      'Teracore Integrated Solution — Solar Energy, CCTV Surveillance & Enterprise IT Infrastructure across Nigeria.',
    questions: [
      { title: 'Full Name', required: true, kind: 'SHORT_ANSWER' },
      { title: 'Phone / WhatsApp Number', required: true, kind: 'SHORT_ANSWER' },
      { title: 'Email Address', required: false, kind: 'SHORT_ANSWER' },
      { title: 'Project Location', required: true, kind: 'SHORT_ANSWER' },
      {
        title: 'Service Division Required',
        required: true,
        kind: 'MULTIPLE_CHOICE',
        options: [
          'Solar & Inverter Systems',
          'CCTV & Smart Security',
          'IT & Network Infrastructure',
          'Multiple Systems (Solar + CCTV + IT)',
          'General Consultation',
        ],
      },
      {
        title: 'Project Scope & Requirements',
        required: true,
        kind: 'PARAGRAPH',
      },
      {
        title: 'Preferred Contact Channel',
        required: true,
        kind: 'MULTIPLE_CHOICE',
        options: ['WhatsApp', 'Phone Call', 'Email'],
      },
    ],
  },
};

function buildCreateItemRequest(spec: TemplateQuestionSpec, index: number) {
  let questionBody: Record<string, unknown>;
  if (spec.kind === 'PARAGRAPH') {
    questionBody = {
      required: spec.required,
      textQuestion: { paragraph: true },
    };
  } else if (spec.kind === 'MULTIPLE_CHOICE') {
    questionBody = {
      required: spec.required,
      choiceQuestion: {
        type: 'RADIO',
        options: (spec.options ?? ['Option 1']).map((value) => ({ value })),
      },
    };
  } else if (spec.kind === 'DATE') {
    questionBody = {
      required: spec.required,
      dateQuestion: { includeTime: false, includeYear: true },
    };
  } else {
    questionBody = {
      required: spec.required,
      textQuestion: { paragraph: false },
    };
  }

  return {
    createItem: {
      item: {
        title: spec.title,
        ...(spec.description ? { description: spec.description } : {}),
        questionItem: {
          question: questionBody,
        },
      },
      location: { index },
    },
  };
}

export async function createTeracoreIntakeForm(
  accessToken: string,
  templateKey: TeracoreFormTemplateKey
): Promise<GoogleFormDetails> {
  const tpl = TERACORE_FORM_TEMPLATES[templateKey];

  // 1. Forms API v1 create accepts info.title and info.documentTitle
  const createRes = await fetch(FORMS_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      info: {
        title: tpl.title,
        documentTitle: tpl.title,
      },
    }),
  });

  if (!createRes.ok) {
    throw new Error(await parseGoogleWorkspaceError(createRes, 'Google Forms'));
  }

  const created = (await createRes.json()) as { formId?: string };
  if (!created.formId) {
    throw new Error('Google Forms API did not return a formId.');
  }

  const safeFormId = encodeURIComponent(created.formId.trim());

  // 2. Populate form description and structured questions via batchUpdate
  const requests = [
    {
      updateFormInfo: {
        info: {
          description: tpl.description,
        },
        updateMask: 'description',
      },
    },
    ...tpl.questions.map((q, idx) => buildCreateItemRequest(q, idx)),
  ];

  const batchRes = await fetch(`${FORMS_API_BASE}/${safeFormId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!batchRes.ok) {
    throw new Error(await parseGoogleWorkspaceError(batchRes, 'Google Forms'));
  }

  return fetchGoogleForm(accessToken, created.formId);
}

export async function addQuestionToForm(
  accessToken: string,
  formId: string,
  params: {
    title: string;
    required: boolean;
    kind: 'SHORT_ANSWER' | 'PARAGRAPH' | 'MULTIPLE_CHOICE';
    options?: string[];
    index: number;
  }
): Promise<GoogleFormDetails> {
  const safeFormId = encodeURIComponent(formId.trim());
  const request = buildCreateItemRequest(
    {
      title: params.title.trim(),
      required: params.required,
      kind: params.kind,
      options: params.options,
    },
    Math.max(0, params.index)
  );

  const res = await fetch(`${FORMS_API_BASE}/${safeFormId}:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests: [request] }),
  });

  if (!res.ok) {
    throw new Error(await parseGoogleWorkspaceError(res, 'Google Forms'));
  }

  return fetchGoogleForm(accessToken, formId);
}

export async function deleteDriveForm(accessToken: string, formId: string): Promise<void> {
  const safeFormId = encodeURIComponent(formId.trim());
  const res = await fetch(`${DRIVE_API_BASE}/${safeFormId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(await parseGoogleWorkspaceError(res, 'Google Drive'));
  }
}

function inferServiceType(formTitle: string, textBlob: string): EnquiryServiceType {
  const combined = `${formTitle} ${textBlob}`.toLowerCase();
  const hasSolar = /solar|inverter|battery|lifepo4|pv|kw|kva/.test(combined);
  const hasCctv = /cctv|camera|surveillance|nvr|security/.test(combined);
  const hasIt = /\bit\b|network|wifi|wi-fi|cabling|server|starlink|firewall/.test(combined);

  if (/multiple/.test(combined) || [hasSolar, hasCctv, hasIt].filter(Boolean).length > 1) {
    return 'multiple';
  }
  if (hasSolar) return 'solar';
  if (hasCctv) return 'cctv';
  if (hasIt) return 'it';
  return 'general';
}

function inferPreferredContact(textBlob: string): PreferredContactMethod {
  const lower = textBlob.toLowerCase();
  if (lower.includes('email')) return 'email';
  if (lower.includes('phone') || lower.includes('call')) return 'phone';
  return 'whatsapp';
}

export function mapFormResponseToEnquiryInput(
  form: GoogleFormDetails,
  response: GoogleFormResponseItem
): EnquiryInput {
  let fullName = '';
  let phone = '';
  let email = response.respondentEmail || '';
  let location = '';
  let preferredDate = '';
  let contactAnswer = '';
  let serviceAnswer = '';

  const summaryLines: string[] = [];

  for (const ans of response.formattedAnswers) {
    const qLower = ans.questionTitle.toLowerCase();
    summaryLines.push(`${ans.questionTitle}: ${ans.answerText}`);

    if (!fullName && /name|client|organization|company/.test(qLower)) {
      fullName = ans.answerText;
    } else if (!phone && /phone|whatsapp|mobile|tel|contact number/.test(qLower)) {
      phone = ans.answerText;
    } else if (!email && /email/.test(qLower)) {
      email = ans.answerText;
    } else if (!location && /location|address|city|state|premises|site/.test(qLower)) {
      location = ans.answerText;
    } else if (!preferredDate && /date|timeline/.test(qLower)) {
      preferredDate = ans.answerText;
    } else if (!contactAnswer && /contact channel|preferred contact|reach/.test(qLower)) {
      contactAnswer = ans.answerText;
    } else if (!serviceAnswer && /service|division|scope|system/.test(qLower)) {
      serviceAnswer = ans.answerText;
    }
  }

  const safeFullName = fullName.trim().length >= 2 ? fullName.trim().slice(0, 120) : 'Google Form Respondent';
  const safePhone = phone.trim().length >= 6 ? phone.trim().slice(0, 32) : 'Not provided';
  const safeLocation = location.trim().length >= 2 ? location.trim().slice(0, 160) : 'Not specified';

  const rawDescription =
    summaryLines.length > 0
      ? summaryLines.join('\n')
      : `Imported Google Form submission (${response.responseId}) from "${form.title}".`;
  const safeDescription =
    rawDescription.trim().length >= 5
      ? rawDescription.trim().slice(0, 2000)
      : 'Imported from Google Forms';

  const serviceType = inferServiceType(
    serviceAnswer ? '' : form.title,
    serviceAnswer || rawDescription
  );
  const preferredContact = inferPreferredContact(contactAnswer || (email && !phone ? 'email' : 'whatsapp'));

  return {
    fullName: safeFullName,
    phone: safePhone,
    email: email.trim().slice(0, 160) || undefined,
    serviceType,
    location: safeLocation,
    preferredContact,
    preferredDate: preferredDate.trim().slice(0, 40) || undefined,
    projectDescription: safeDescription,
    technicalSummary: `Imported from Google Form: ${form.title} (Response ${response.responseId})`.slice(
      0,
      1000
    ),
  };
}

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase/client';
import type {
  EnquiryInput,
  EnquiryRecord,
  EnquiryStatus,
  InsightArticle,
  ProjectItem,
  PublicGoogleFormConfig,
  SheetsIntegrationConfig,
  TestimonialItem,
} from '../types/teracore';

function generateSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_\-]/g, '');
}

function cleanStr(val: string | undefined, maxLen: number): string {
  return (val ?? '').trim().slice(0, maxLen);
}

function toDateOrNull(ts: unknown): Date | null {
  if (ts && typeof ts === 'object' && 'toDate' in ts && typeof (ts as Timestamp).toDate === 'function') {
    return (ts as Timestamp).toDate();
  }
  return null;
}

export async function submitEnquiry(input: EnquiryInput): Promise<string> {
  const id = generateSafeId('enq');
  const path = `enquiries/${id}`;
  const payload: Record<string, unknown> = {
    id,
    fullName: cleanStr(input.fullName, 120),
    phone: cleanStr(input.phone, 32),
    serviceType: input.serviceType,
    location: cleanStr(input.location, 160),
    preferredContact: input.preferredContact,
    projectDescription: cleanStr(input.projectDescription, 2000),
    status: 'new',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const email = cleanStr(input.email, 160);
  if (email) payload.email = email;

  const preferredDate = cleanStr(input.preferredDate, 40);
  if (preferredDate) payload.preferredDate = preferredDate;

  const technicalSummary = cleanStr(input.technicalSummary, 1000);
  if (technicalSummary) payload.technicalSummary = technicalSummary;

  try {
    await setDoc(doc(db, 'enquiries', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeEnquiries(
  onData: (items: EnquiryRecord[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'enquiries';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: EnquiryRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: String(data.id ?? d.id),
          fullName: String(data.fullName ?? ''),
          phone: String(data.phone ?? ''),
          email: data.email ? String(data.email) : undefined,
          serviceType: data.serviceType,
          location: String(data.location ?? ''),
          preferredContact: data.preferredContact,
          preferredDate: data.preferredDate ? String(data.preferredDate) : undefined,
          projectDescription: String(data.projectDescription ?? ''),
          technicalSummary: data.technicalSummary ? String(data.technicalSummary) : undefined,
          status: data.status,
          createdAt: toDateOrNull(data.createdAt),
          updatedAt: toDateOrNull(data.updatedAt),
        };
      });
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function updateEnquiryStatus(
  id: string,
  status: EnquiryStatus,
  technicalSummary?: string
): Promise<void> {
  const path = `enquiries/${id}`;
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (technicalSummary !== undefined) {
    updateData.technicalSummary = cleanStr(technicalSummary, 1000);
  }
  try {
    await updateDoc(doc(db, 'enquiries', id), updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteEnquiry(id: string): Promise<void> {
  const path = `enquiries/${id}`;
  try {
    await deleteDoc(doc(db, 'enquiries', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Projects
export async function fetchPublishedProjects(): Promise<ProjectItem[]> {
  const path = 'projects';
  try {
    const q = query(collection(db, path), where('published', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id ?? d.id),
        title: String(data.title ?? ''),
        category: data.category,
        location: String(data.location ?? ''),
        description: String(data.description ?? ''),
        equipmentUsed: String(data.equipmentUsed ?? ''),
        results: data.results ? String(data.results) : undefined,
        imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
        published: Boolean(data.published),
        createdAt: toDateOrNull(data.createdAt),
        updatedAt: toDateOrNull(data.updatedAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeAllProjects(
  onData: (items: ProjectItem[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'projects';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            title: String(data.title ?? ''),
            category: data.category,
            location: String(data.location ?? ''),
            description: String(data.description ?? ''),
            equipmentUsed: String(data.equipmentUsed ?? ''),
            results: data.results ? String(data.results) : undefined,
            imageUrl: data.imageUrl ? String(data.imageUrl) : undefined,
            published: Boolean(data.published),
            createdAt: toDateOrNull(data.createdAt),
            updatedAt: toDateOrNull(data.updatedAt),
          };
        })
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function createProject(
  input: Omit<ProjectItem, 'id' | 'createdAt' | 'updatedAt' | 'isReferenceBlueprint'>
): Promise<string> {
  const id = generateSafeId('proj');
  const path = `projects/${id}`;
  const payload: Record<string, unknown> = {
    id,
    title: cleanStr(input.title, 140),
    category: input.category,
    location: cleanStr(input.location, 120),
    description: cleanStr(input.description, 1500),
    equipmentUsed: cleanStr(input.equipmentUsed, 300),
    published: Boolean(input.published),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (cleanStr(input.results, 500)) payload.results = cleanStr(input.results, 500);
  if (cleanStr(input.imageUrl, 500)) payload.imageUrl = cleanStr(input.imageUrl, 500);

  try {
    await setDoc(doc(db, 'projects', id), payload);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleProjectPublished(id: string, published: boolean): Promise<void> {
  const path = `projects/${id}`;
  try {
    await updateDoc(doc(db, 'projects', id), { published, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProject(id: string): Promise<void> {
  const path = `projects/${id}`;
  try {
    await deleteDoc(doc(db, 'projects', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Insights
export async function fetchPublishedInsights(): Promise<InsightArticle[]> {
  const path = 'insights';
  try {
    const q = query(collection(db, path), where('published', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id ?? d.id),
        title: String(data.title ?? ''),
        category: data.category,
        summary: String(data.summary ?? ''),
        body: String(data.body ?? ''),
        readTime: String(data.readTime ?? '4 min read'),
        published: Boolean(data.published),
        createdAt: toDateOrNull(data.createdAt),
        updatedAt: toDateOrNull(data.updatedAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeAllInsights(
  onData: (items: InsightArticle[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'insights';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            title: String(data.title ?? ''),
            category: data.category,
            summary: String(data.summary ?? ''),
            body: String(data.body ?? ''),
            readTime: String(data.readTime ?? '4 min read'),
            published: Boolean(data.published),
            createdAt: toDateOrNull(data.createdAt),
            updatedAt: toDateOrNull(data.updatedAt),
          };
        })
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function createInsight(
  input: Omit<InsightArticle, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = generateSafeId('ins');
  const path = `insights/${id}`;
  try {
    await setDoc(doc(db, 'insights', id), {
      id,
      title: cleanStr(input.title, 160),
      category: input.category,
      summary: cleanStr(input.summary, 400),
      body: cleanStr(input.body, 8000),
      readTime: cleanStr(input.readTime, 30) || '4 min read',
      published: Boolean(input.published),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleInsightPublished(id: string, published: boolean): Promise<void> {
  const path = `insights/${id}`;
  try {
    await updateDoc(doc(db, 'insights', id), { published, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteInsight(id: string): Promise<void> {
  const path = `insights/${id}`;
  try {
    await deleteDoc(doc(db, 'insights', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Testimonials
export async function fetchApprovedTestimonials(): Promise<TestimonialItem[]> {
  const path = 'testimonials';
  try {
    const q = query(collection(db, path), where('approved', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: String(data.id ?? d.id),
        clientName: String(data.clientName ?? ''),
        organization: String(data.organization ?? ''),
        serviceReceived: data.serviceReceived,
        quote: String(data.quote ?? ''),
        approved: Boolean(data.approved),
        createdAt: toDateOrNull(data.createdAt),
        updatedAt: toDateOrNull(data.updatedAt),
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export function subscribeAllTestimonials(
  onData: (items: TestimonialItem[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'testimonials';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onData(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            clientName: String(data.clientName ?? ''),
            organization: String(data.organization ?? ''),
            serviceReceived: data.serviceReceived,
            quote: String(data.quote ?? ''),
            approved: Boolean(data.approved),
            createdAt: toDateOrNull(data.createdAt),
            updatedAt: toDateOrNull(data.updatedAt),
          };
        })
      );
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function createTestimonial(
  input: Omit<TestimonialItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = generateSafeId('test');
  const path = `testimonials/${id}`;
  try {
    await setDoc(doc(db, 'testimonials', id), {
      id,
      clientName: cleanStr(input.clientName, 120),
      organization: cleanStr(input.organization, 120),
      serviceReceived: input.serviceReceived,
      quote: cleanStr(input.quote, 1000),
      approved: Boolean(input.approved),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function toggleTestimonialApproved(id: string, approved: boolean): Promise<void> {
  const path = `testimonials/${id}`;
  try {
    await updateDoc(doc(db, 'testimonials', id), { approved, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTestimonial(id: string): Promise<void> {
  const path = `testimonials/${id}`;
  try {
    await deleteDoc(doc(db, 'testimonials', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Google Sheets Integration Configuration
const SHEETS_INTEGRATION_ID = 'sheets';

export async function fetchSheetsIntegration(): Promise<SheetsIntegrationConfig | null> {
  const path = `integrations/${SHEETS_INTEGRATION_ID}`;
  try {
    const snap = await getDoc(doc(db, 'integrations', SHEETS_INTEGRATION_ID));
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      id: String(data.id ?? snap.id),
      spreadsheetId: String(data.spreadsheetId ?? ''),
      spreadsheetUrl: String(data.spreadsheetUrl ?? ''),
      spreadsheetTitle: String(data.spreadsheetTitle ?? ''),
      sheetName: String(data.sheetName ?? ''),
      syncMode: data.syncMode === 'apps_script' ? 'apps_script' : 'oauth',
      webhookUrl: data.webhookUrl ? String(data.webhookUrl) : undefined,
      lastSyncedCount:
        typeof data.lastSyncedCount === 'number' ? data.lastSyncedCount : undefined,
      updatedBy: String(data.updatedBy ?? ''),
      updatedAt: toDateOrNull(data.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveSheetsIntegration(input: {
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  sheetName: string;
  syncMode?: 'oauth' | 'apps_script';
  webhookUrl?: string;
  lastSyncedCount?: number;
}): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Administrator sign-in is required to save spreadsheet settings.');
  }
  const path = `integrations/${SHEETS_INTEGRATION_ID}`;
  const payload: Record<string, unknown> = {
    id: SHEETS_INTEGRATION_ID,
    spreadsheetId: cleanStr(input.spreadsheetId, 200),
    spreadsheetUrl: cleanStr(input.spreadsheetUrl, 400),
    spreadsheetTitle: cleanStr(input.spreadsheetTitle, 200),
    sheetName: cleanStr(input.sheetName, 120),
    updatedBy: cleanStr(uid, 128),
    updatedAt: serverTimestamp(),
  };
  if (input.syncMode === 'oauth' || input.syncMode === 'apps_script') {
    payload.syncMode = input.syncMode;
  }
  const cleanedWebhook = cleanStr(input.webhookUrl, 400);
  if (cleanedWebhook) {
    payload.webhookUrl = cleanedWebhook;
  }
  if (typeof input.lastSyncedCount === 'number' && input.lastSyncedCount >= 0) {
    payload.lastSyncedCount = Math.floor(input.lastSyncedCount);
  }
  try {
    await setDoc(doc(db, 'integrations', SHEETS_INTEGRATION_ID), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function clearSheetsIntegration(): Promise<void> {
  const path = `integrations/${SHEETS_INTEGRATION_ID}`;
  try {
    await deleteDoc(doc(db, 'integrations', SHEETS_INTEGRATION_ID));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Public Google Form Configuration (for visitors on /quote and /contact)
const PUBLIC_FORM_DOC_ID = 'active';
const GOOGLE_FORM_URL_PATTERN = /^https:\/\/docs\.google\.com\/forms\/.+$/;

export async function fetchPublishedGoogleForm(): Promise<PublicGoogleFormConfig | null> {
  const path = 'publicForms';
  try {
    const q = query(collection(db, path), where('published', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    const data = d.data();
    return {
      id: String(data.id ?? d.id),
      formId: String(data.formId ?? ''),
      title: String(data.title ?? 'Teracore Google Form'),
      description: data.description ? String(data.description) : undefined,
      responderUri: String(data.responderUri ?? ''),
      published: Boolean(data.published),
      updatedBy: String(data.updatedBy ?? ''),
      updatedAt: toDateOrNull(data.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function publishPublicGoogleForm(input: {
  formId: string;
  title: string;
  description?: string;
  responderUri: string;
}): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Administrator sign-in is required to publish a Google Form.');
  }

  const cleanUri = cleanStr(input.responderUri, 400);
  if (cleanUri.length < 20 || !GOOGLE_FORM_URL_PATTERN.test(cleanUri)) {
    throw new Error('Google Form link must start with https://docs.google.com/forms/');
  }

  const rawFormId = cleanStr(input.formId, 200);
  const safeFormId = rawFormId.length >= 5 ? rawFormId : 'external-google-form';

  const payload: Record<string, unknown> = {
    id: PUBLIC_FORM_DOC_ID,
    formId: safeFormId,
    title: cleanStr(input.title, 200) || 'Teracore Intake Form',
    responderUri: cleanUri,
    published: true,
    updatedBy: cleanStr(uid, 128),
    updatedAt: serverTimestamp(),
  };

  const cleanDesc = cleanStr(input.description, 1000);
  if (cleanDesc) {
    payload.description = cleanDesc;
  }

  const path = `publicForms/${PUBLIC_FORM_DOC_ID}`;
  try {
    await setDoc(doc(db, 'publicForms', PUBLIC_FORM_DOC_ID), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function unpublishPublicGoogleForm(): Promise<void> {
  const path = `publicForms/${PUBLIC_FORM_DOC_ID}`;
  try {
    await deleteDoc(doc(db, 'publicForms', PUBLIC_FORM_DOC_ID));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

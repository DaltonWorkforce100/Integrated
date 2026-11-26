export type ServiceDivision = 'solar' | 'cctv' | 'it';
export type EnquiryServiceType = ServiceDivision | 'multiple' | 'general';
export type PreferredContactMethod = 'whatsapp' | 'phone' | 'email';
export type EnquiryStatus = 'new' | 'contacted' | 'quoted' | 'completed' | 'archived';

export interface EnquiryRecord {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  serviceType: EnquiryServiceType;
  location: string;
  preferredContact: PreferredContactMethod;
  preferredDate?: string;
  projectDescription: string;
  technicalSummary?: string;
  status: EnquiryStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface EnquiryInput {
  fullName: string;
  phone: string;
  email?: string;
  serviceType: EnquiryServiceType;
  location: string;
  preferredContact: PreferredContactMethod;
  preferredDate?: string;
  projectDescription: string;
  technicalSummary?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: ServiceDivision;
  location: string;
  description: string;
  equipmentUsed: string;
  results?: string;
  imageUrl?: string;
  published: boolean;
  isReferenceBlueprint?: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface InsightArticle {
  id: string;
  title: string;
  category: ServiceDivision | 'general';
  summary: string;
  body: string;
  readTime: string;
  published: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface TestimonialItem {
  id: string;
  clientName: string;
  organization: string;
  serviceReceived: EnquiryServiceType;
  quote: string;
  approved: boolean;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface ApplianceItem {
  id: string;
  name: string;
  watts: number;
  defaultHours: number;
  category: 'Cooling' | 'Computing & Office' | 'Lighting & Home' | 'Pumps & Heavy';
}

export type SheetsSyncMode = 'oauth' | 'apps_script';

export interface SheetsIntegrationConfig {
  id: string;
  spreadsheetId: string;
  spreadsheetUrl: string;
  spreadsheetTitle: string;
  sheetName: string;
  syncMode?: SheetsSyncMode;
  webhookUrl?: string;
  lastSyncedCount?: number;
  updatedBy: string;
  updatedAt: Date | null;
}

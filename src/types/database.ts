import {
  ProjectListItem,
  ProjectDetailItem,
  EstimateItem,
  CostPackageItem,
  InspectionItem,
  LegalDocItem,
  CompanyInfo,
  PlanTaskItem,
  ProjectTask,
  CostBreakdownItem,
  ContractAppendixItem,
} from './project';
import { DraftingDatabase } from './drafting';

export interface DatabaseMetadata {
  version: string;
  appName: string;
  exportedAt: string;
  lastSavedAt: string;
  totalProjects: number;
}

export interface AppDatabase {
  metadata: DatabaseMetadata;
  projects: ProjectListItem[];
  projectDetails: Record<string, ProjectDetailItem>;
  estimates: Record<string, EstimateItem[]>;
  costPackages: Record<string, CostPackageItem[]>;
  inspections: Record<string, InspectionItem[]>;
  legalDocs: Record<string, LegalDocItem[]>;
  companies: CompanyInfo[];
  planTasks?: Record<string, PlanTaskItem[]>;
  costBreakdowns?: Record<string, CostBreakdownItem[]>;
  contractAppendices?: Record<string, ContractAppendixItem[]>;
  tasks?: Record<string, ProjectTask[]>;
  drafting?: DraftingDatabase;
}


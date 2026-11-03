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
} from './project';

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
  tasks?: Record<string, ProjectTask[]>;
}


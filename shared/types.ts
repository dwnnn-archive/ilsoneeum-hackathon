import { z } from "zod";

export const CropSchema = z.enum(["반시", "사과", "복숭아", "기타"]);
export const DifficultySchema = z.enum(["쉬움", "보통", "어려움"]);
export const JobStatusSchema = z.enum(["모집중", "마감"]);
export const ApplicationStatusSchema = z.enum(["신청", "확정", "취소"]);

export const JobSchema = z.object({
  id: z.string(),
  crop: CropSchema,
  title: z.string().min(2),
  workDate: z.string(),
  startTime: z.string(),
  durationHours: z.number().min(1).max(12),
  workersNeeded: z.number().int().min(1).max(100),
  wagePerHour: z.number().int().min(0),
  difficulty: DifficultySchema,
  location: z.string().min(1),
  description: z.string().min(2),
  supplies: z.string(),
  safetyNotes: z.string(),
  status: JobStatusSchema,
  createdAt: z.string(),
});

export const JobDraftSchema = JobSchema.omit({
  id: true,
  status: true,
  createdAt: true,
}).extend({
  missingFields: z.array(z.string()),
});

export const ApplicantSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  availableDate: z.string(),
  maxHours: z.number().min(1).max(12),
  minimumWage: z.number().int().min(0),
  preferredDifficulty: DifficultySchema,
  languages: z.array(z.string()),
  status: ApplicationStatusSchema,
  isDemo: z.boolean().default(false),
});

export const WorkerProfileSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  availableDate: z.string(),
  maxHours: z.number().min(1).max(12),
  minimumWage: z.number().int().min(0),
  preferredDifficulty: DifficultySchema,
  languages: z.array(z.string()),
  isDemo: z.boolean().default(false),
});

export const MatchSchema = z.object({
  applicant: WorkerProfileSchema,
  score: z.number().min(0).max(100),
  reasons: z.array(z.string()),
});

export const MatchingSummarySchema = z.object({
  evaluatedWorkers: z.number().int().nonnegative(),
  eligibleWorkers: z.number().int().nonnegative(),
  excludedByCriteria: z.object({
    dateUnavailable: z.number().int().nonnegative(),
    insufficientHours: z.number().int().nonnegative(),
    wageMismatch: z.number().int().nonnegative(),
  }),
});

export const SafetyReviewSchema = z.object({
  warnings: z.array(z.string()),
  checks: z.array(z.string()),
});

export const WorkflowStepSchema = z.object({
  id: z.enum(["matching", "information_review", "action_planning"]),
  title: z.string(),
  summary: z.string(),
});

export const WorkflowActionSchema = z.object({
  id: z.enum(["applicants", "safety", "notice"]),
  title: z.string(),
  summary: z.string(),
});

export const MatchWorkflowResponseSchema = z.object({
  matches: z.array(MatchSchema),
  matchingSummary: MatchingSummarySchema,
  safetyReview: SafetyReviewSchema,
  workflowSteps: z.array(WorkflowStepSchema),
  nextActions: z.array(WorkflowActionSchema),
});

export type Job = z.infer<typeof JobSchema>;
export type JobDraft = z.infer<typeof JobDraftSchema>;
export type Applicant = z.infer<typeof ApplicantSchema>;
export type WorkerProfile = z.infer<typeof WorkerProfileSchema>;
export type Match = z.infer<typeof MatchSchema>;
export type MatchingSummary = z.infer<typeof MatchingSummarySchema>;
export type SafetyReview = z.infer<typeof SafetyReviewSchema>;
export type WorkflowStep = z.infer<typeof WorkflowStepSchema>;
export type WorkflowAction = z.infer<typeof WorkflowActionSchema>;

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ApplicantSchema,
  JobSchema,
  WorkerProfileSchema,
  type Applicant,
  type Job,
  type WorkerProfile,
} from "../shared/types";

type Store = {
  jobs: Job[];
  applicants: Record<string, Applicant[]>;
  workers: WorkerProfile[];
};

const defaultDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "data");
const dataDir = process.env.DATA_DIR || defaultDir;
const dataFile = path.join(dataDir, "jobs.json");
let writeQueue: Promise<void> = Promise.resolve();

function futureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function seedStore(): Store {
  const now = new Date().toISOString();
  const jobs = [
    {
      id: "demo-job-1",
      crop: "반시",
      title: "반시밭 감 따기",
      workDate: futureDate(1),
      startTime: "08:00",
      durationHours: 5,
      workersNeeded: 4,
      wagePerHour: 12000,
      difficulty: "쉬움",
      location: "청도읍",
      description: "낮은 가지의 반시를 수확하고 바구니에 담습니다.",
      supplies: "편한 복장, 운동화",
      safetyNotes: "미끄럼 방지 신발 착용, 무거운 바구니는 나누어 운반",
      status: "모집중",
      createdAt: now,
    },
    {
      id: "demo-job-2",
      crop: "사과",
      title: "사과 선별 및 포장",
      workDate: futureDate(2),
      startTime: "09:00",
      durationHours: 4,
      workersNeeded: 3,
      wagePerHour: 12500,
      difficulty: "쉬움",
      location: "이서면",
      description: "수확된 사과의 크기와 상태를 확인해 포장합니다.",
      supplies: "작업 장갑",
      safetyNotes: "선별기 사용 전 작업 안내를 받습니다.",
      status: "모집중",
      createdAt: now,
    },
    {
      id: "demo-job-3",
      crop: "반시",
      title: "반시 포장 상자 정리",
      workDate: futureDate(3),
      startTime: "13:00",
      durationHours: 3,
      workersNeeded: 2,
      wagePerHour: 12000,
      difficulty: "보통",
      location: "각북면",
      description: "포장 상자를 접고 출하용으로 정리합니다.",
      supplies: "없음",
      safetyNotes: "상자를 무리하게 높이 쌓지 않습니다.",
      status: "모집중",
      createdAt: now,
    },
  ].map((job) => JobSchema.parse(job));

  const workers = [
    { id: "demo-worker-1", name: "민지", availableDate: jobs[0].workDate, maxHours: 6, minimumWage: 11000, preferredDifficulty: "쉬움", languages: ["한국어"], isDemo: true },
    { id: "demo-worker-2", name: "준호", availableDate: jobs[0].workDate, maxHours: 4, minimumWage: 12000, preferredDifficulty: "보통", languages: ["한국어"], isDemo: true },
    { id: "demo-worker-3", name: "린", availableDate: jobs[1].workDate, maxHours: 8, minimumWage: 12000, preferredDifficulty: "쉬움", languages: ["한국어", "베트남어"], isDemo: true },
    { id: "demo-worker-4", name: "수빈", availableDate: jobs[2].workDate, maxHours: 4, minimumWage: 10000, preferredDifficulty: "보통", languages: ["한국어"], isDemo: true },
  ].map((worker) => WorkerProfileSchema.parse(worker));

  return { jobs, applicants: {}, workers };
}

async function loadStore(): Promise<Store> {
  await mkdir(dataDir, { recursive: true });
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "jobs" in parsed &&
      "applicants" in parsed &&
      "workers" in parsed
    ) {
      const value = parsed as Store;
      return {
        jobs: value.jobs.map((item) => JobSchema.parse(item)),
        applicants: Object.fromEntries(
          Object.entries(value.applicants).map(([id, entries]) => [
            id,
            (entries as Applicant[]).map((item) => ApplicantSchema.parse(item)),
          ]),
        ),
        workers: value.workers.map((item) => WorkerProfileSchema.parse(item)),
      };
    }
    throw new Error("저장된 농작업 데이터 형식이 올바르지 않습니다.");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const initial = seedStore();
    await saveStore(initial);
    return initial;
  }
}

async function saveStore(store: Store): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  const pendingWrite = writeQueue.catch(() => undefined).then(async () => {
    const temporaryFile = `${dataFile}.${process.pid}.tmp`;
    await writeFile(temporaryFile, JSON.stringify(store, null, 2), "utf8");
    await rename(temporaryFile, dataFile);
  });
  writeQueue = pendingWrite;
  await pendingWrite;
}

export async function getJobs(): Promise<Job[]> {
  return (await loadStore()).jobs;
}

export async function createJob(job: Job): Promise<void> {
  const store = await loadStore();
  store.jobs.unshift(JobSchema.parse(job));
  await saveStore(store);
}

export async function getJob(jobId: string): Promise<Job | undefined> {
  return (await loadStore()).jobs.find((job) => job.id === jobId);
}

export async function updateJob(job: Job): Promise<void> {
  const store = await loadStore();
  const index = store.jobs.findIndex((item) => item.id === job.id);
  if (index < 0) throw new Error("작업을 찾을 수 없습니다.");
  store.jobs[index] = JobSchema.parse(job);
  await saveStore(store);
}

export async function getWorkers(): Promise<WorkerProfile[]> {
  return (await loadStore()).workers;
}

export async function getApplicants(jobId: string): Promise<Applicant[]> {
  return (await loadStore()).applicants[jobId] ?? [];
}

export async function addApplicant(jobId: string, applicant: Applicant): Promise<void> {
  const store = await loadStore();
  if (!store.jobs.some((job) => job.id === jobId)) throw new Error("작업을 찾을 수 없습니다.");
  const entries = store.applicants[jobId] ?? [];
  if (entries.some((entry) => entry.id === applicant.id)) {
    throw new Error("이미 신청한 작업입니다.");
  }
  store.applicants[jobId] = [...entries, ApplicantSchema.parse(applicant)];
  await saveStore(store);
}

export async function updateApplicant(
  jobId: string,
  applicantId: string,
  status: Applicant["status"],
): Promise<Applicant | undefined> {
  const store = await loadStore();
  const applicant = store.applicants[jobId]?.find((entry) => entry.id === applicantId);
  if (!applicant) return undefined;
  applicant.status = status;
  await saveStore(store);
  return applicant;
}

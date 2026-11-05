import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  ApplicantSchema,
  JobDraftSchema,
  JobSchema,
  MatchWorkflowResponseSchema,
  WorkerProfileSchema,
  type Applicant,
  type Job,
} from "../shared/types";
import { seasonalDemand } from "../shared/seasonal-demand";
import { draftChangeNotice, draftJob } from "./copilot";
import {
  addApplicant,
  createJob,
  getApplicants,
  getJob,
  getJobs,
  getWorkers,
  updateApplicant,
  updateJob,
} from "./store";

const app = express();
app.use(express.json({ limit: "100kb" }));

let copilotWindowStart = Date.now();
let copilotWindowRequests = 0;
const copilotRateLimit: express.RequestHandler = (_req, res, next) => {
  const now = Date.now();
  if (now - copilotWindowStart >= 60_000) {
    copilotWindowStart = now;
    copilotWindowRequests = 0;
  }
  if (copilotWindowRequests >= 10) {
    res.status(429).json({ error: "AI 요청이 잠시 많습니다. 1분 후 다시 시도해 주세요." });
    return;
  }
  copilotWindowRequests += 1;
  next();
};

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.get("/api/seasonal-demand", (_req, res) => {
  res.json(seasonalDemand);
});

app.get("/api/jobs", async (_req, res) => {
  try {
    res.json(await getJobs());
  } catch (error) {
    console.error("[jobs:list] failed:", error);
    res.status(500).json({ error: "작업 목록을 불러오지 못했습니다." });
  }
});

app.post("/api/jobs/parse", copilotRateLimit, async (req, res) => {
  const parsed = z.object({ note: z.string().trim().min(4).max(2000) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "농작업 내용을 4자 이상 입력해 주세요." });
    return;
  }
  try {
    res.json(await draftJob(parsed.data.note));
  } catch (error) {
    console.error("[jobs:parse] failed:", error);
    res.status(502).json({ error: "작업 공고 초안을 만들지 못했습니다. 직접 입력하거나 다시 시도해 주세요." });
  }
});

app.post("/api/jobs", async (req, res) => {
  const parsed = JobDraftSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "작업 정보를 확인해 주세요.", details: parsed.error.flatten() });
    return;
  }
  const missingFields = [
    !parsed.data.title.trim() && "작업명",
    !parsed.data.workDate && "작업 날짜",
    !parsed.data.startTime && "시작 시간",
    parsed.data.workersNeeded < 1 && "필요 인원",
    parsed.data.wagePerHour <= 0 && "시급",
    !parsed.data.location.trim() && "작업 위치",
    !parsed.data.description.trim() && "상세 업무",
  ].filter((field): field is string => typeof field === "string");
  if (missingFields.length > 0) {
    res.status(400).json({
      error: "필수 작업 정보를 확인해 주세요.",
      missingFields,
    });
    return;
  }
  const { missingFields: _missingFields, ...draft } = parsed.data;
  const job = JobSchema.parse({
    ...draft,
    id: randomUUID(),
    status: "모집중",
    createdAt: new Date().toISOString(),
  });
  try {
    await createJob(job);
    res.status(201).json(job);
  } catch (error) {
    console.error("[jobs:create] failed:", error);
    res.status(500).json({ error: "작업을 등록하지 못했습니다." });
  }
});

app.get("/api/jobs/:jobId/applicants", async (req, res) => {
  try {
    if (!(await getJob(req.params.jobId))) {
      res.status(404).json({ error: "작업을 찾을 수 없습니다." });
      return;
    }
    res.json(await getApplicants(req.params.jobId));
  } catch (error) {
    console.error("[applicants:list] failed:", error);
    res.status(500).json({ error: "신청자 목록을 불러오지 못했습니다." });
  }
});

app.get("/api/jobs/:jobId/matches", async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "작업을 찾을 수 없습니다." });
    return;
  }
  try {
    const [demoWorkers, applicants] = await Promise.all([
      getWorkers(),
      getApplicants(req.params.jobId),
    ]);
    const applicantWorkers = applicants
      .filter((applicant) => applicant.status === "신청")
      .map(({ id, name, availableDate, maxHours, minimumWage, preferredDifficulty, languages, isDemo }) => ({
        id,
        name,
        availableDate,
        maxHours,
        minimumWage,
        preferredDifficulty,
        languages,
        isDemo,
      }));
    const workers = [...demoWorkers, ...applicantWorkers];
    const result = await runAgentWorkflow({ job, workers });
    const response = MatchWorkflowResponseSchema.parse(result);
    res.json(response);
  } catch (error) {
    console.error("[jobs:matches] Agent Framework workflow failed:", error);
    res.status(503).json({ error: "추천 워크플로를 실행하지 못했습니다. Agent Framework 환경을 확인해 주세요." });
  }
});

const ApplyRequest = WorkerProfileSchema.omit({ id: true }).extend({
  name: z.string().trim().min(1).max(60),
});

app.post("/api/jobs/:jobId/applicants", async (req, res) => {
  const parsed = ApplyRequest.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "이름과 가능한 날짜, 시간, 희망 급여를 확인해 주세요." });
    return;
  }
  try {
    const job = await getJob(req.params.jobId);
    if (!job) {
      res.status(404).json({ error: "작업을 찾을 수 없습니다." });
      return;
    }
    if (job.status !== "모집중") {
      res.status(409).json({ error: "모집이 마감된 작업입니다." });
      return;
    }
    if (parsed.data.availableDate !== job.workDate) {
      res.status(400).json({ error: "작업 날짜에 참여할 수 있는지 확인해 주세요." });
      return;
    }
    if (parsed.data.maxHours < job.durationHours) {
      res.status(400).json({ error: "작업 예상 시간을 모두 소화할 수 있는지 확인해 주세요." });
      return;
    }
    if (parsed.data.minimumWage > job.wagePerHour) {
      res.status(400).json({ error: "희망 시급이 작업 공고의 시급보다 높습니다." });
      return;
    }
    const applicant: Applicant = ApplicantSchema.parse({
      ...parsed.data,
      id: randomUUID(),
      status: "신청",
      isDemo: false,
    });
    await addApplicant(job.id, applicant);
    res.status(201).json(applicant);
  } catch (error) {
    const message = error instanceof Error ? error.message : "지원 등록에 실패했습니다.";
    res.status(400).json({ error: message });
  }
});

app.patch("/api/jobs/:jobId/applicants/:applicantId", async (req, res) => {
  const parsed = z.object({ status: z.enum(["확정", "취소"]) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "지원 상태가 올바르지 않습니다." });
    return;
  }
  try {
    const applicant = await updateApplicant(
      req.params.jobId,
      req.params.applicantId,
      parsed.data.status,
    );
    if (!applicant) {
      res.status(404).json({ error: "지원 내역을 찾을 수 없습니다." });
      return;
    }
    if (parsed.data.status === "확정") {
      const job = await getJob(req.params.jobId);
      if (job) {
        const applicants = await getApplicants(job.id);
        const confirmed = applicants.filter((entry) => entry.status === "확정").length;
        if (confirmed >= job.workersNeeded) {
          job.status = "마감";
          await updateJob(job);
        }
      }
    }
    res.json(applicant);
  } catch (error) {
    console.error("[applicants:update] failed:", error);
    res.status(500).json({ error: "지원 상태를 변경하지 못했습니다." });
  }
});

app.post("/api/jobs/:jobId/change-notice", copilotRateLimit, async (req, res) => {
  const parsed = z.object({ change: z.string().trim().min(3).max(1000) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "변경 내용을 입력해 주세요." });
    return;
  }
  const job = await getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ error: "작업을 찾을 수 없습니다." });
    return;
  }
  try {
    const applicants = await getApplicants(job.id);
    const notice = await draftChangeNotice(
      job.title,
      parsed.data.change,
      applicants.filter((entry) => entry.status !== "취소").map((entry) => entry.name),
    );
    res.json({ notice });
  } catch (error) {
    console.error("[jobs:change-notice] failed:", error);
    res.status(502).json({ error: "변경 안내 초안을 만들지 못했습니다." });
  }
});

async function runAgentWorkflow(input: { job: Job; workers: Awaited<ReturnType<typeof getWorkers>> }) {
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "agent_service", "match.py");
  const command = process.env.PYTHON_EXECUTABLE || (process.platform === "win32" ? "python" : "python3");

  return new Promise<unknown>((resolve, reject) => {
    const child = spawn(command, [script], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Agent Framework workflow timed out."));
    }, 30_000);

    child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(new Error(stderr || `Agent Framework exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout) as unknown);
      } catch (error) {
        reject(new Error(`Invalid Agent Framework response: ${String(error)}`));
      }
    });
    child.stdin.end(JSON.stringify(input));
  });
}

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API 경로를 찾을 수 없습니다." });
});

const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
app.use(express.static(distDir));
app.get("*", (_req, res) => res.sendFile(path.join(distDir, "index.html")));

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`Cheongdo Hands-on listening on :${port}`));

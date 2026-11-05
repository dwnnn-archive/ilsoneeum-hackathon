import { useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Applicant,
  Job,
  JobDraft,
  Match,
  MatchingSummary,
  SafetyReview,
  WorkflowAction,
  WorkflowStep,
} from "../shared/types";

type Role = "farmer" | "worker";
type WorkerTab = "jobs" | "saved" | "applied";
type TrackedApplication = {
  applicantId: string;
  jobId: string;
  status: Applicant["status"];
};

const crops = ["반시", "사과", "복숭아", "기타"] as const;
const difficulties = ["쉬움", "보통", "어려움"] as const;
const today = new Date().toISOString().slice(0, 10);
const BOOKMARKS_STORAGE_KEY = "ilson.bookmarks.v1";
const APPLICATIONS_STORAGE_KEY = "ilson.applications.v1";

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "요청을 처리하지 못했습니다.");
  return body as T;
}

function makeInitialDraft(): JobDraft {
  return {
    crop: "반시",
    title: "",
    workDate: "",
    startTime: "",
    durationHours: 4,
    workersNeeded: 1,
    wagePerHour: 12000,
    difficulty: "쉬움",
    location: "",
    description: "",
    supplies: "",
    safetyNotes: "",
    missingFields: [],
  };
}

function startVoiceInput(onText: (text: string) => void, onError: (message: string) => void) {
  type RecognitionResult = { 0: { transcript: string } };
  type RecognitionEvent = { results: ArrayLike<RecognitionResult> };
  type Recognition = {
    lang: string;
    onresult: ((event: RecognitionEvent) => void) | null;
    onerror: (() => void) | null;
    onend: (() => void) | null;
    start: () => void;
  };
  type RecognitionConstructor = new () => Recognition;
  const windowWithSpeech = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  const SpeechRecognition =
    windowWithSpeech.SpeechRecognition ?? windowWithSpeech.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    onError("이 브라우저는 음성 입력을 지원하지 않습니다. 내용을 직접 입력해 주세요.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "ko-KR";
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ");
    onText(transcript);
  };
  recognition.onerror = () => onError("음성을 인식하지 못했습니다. 다시 시도하거나 직접 입력해 주세요.");
  recognition.start();
}

export function App() {
  const [role, setRole] = useState<Role>("farmer");
  const [workerTab, setWorkerTab] = useState<WorkerTab>("jobs");
  const [applyingJobId, setApplyingJobId] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [draft, setDraft] = useState<JobDraft | null>(null);
  const [jobNote, setJobNote] = useState("");
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchingSummary, setMatchingSummary] = useState<MatchingSummary | null>(null);
  const [safetyReview, setSafetyReview] = useState<SafetyReview | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [nextActions, setNextActions] = useState<WorkflowAction[]>([]);
  const [name, setName] = useState("");
  const [availableDate, setAvailableDate] = useState("");
  const [maxHours, setMaxHours] = useState(6);
  const [minimumWage, setMinimumWage] = useState(11000);
  const [preferredDifficulty, setPreferredDifficulty] = useState<(typeof difficulties)[number]>("쉬움");
  const [cropFilter, setCropFilter] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<string[]>([]);
  const [trackedApplications, setTrackedApplications] = useState<TrackedApplication[]>([]);
  const [change, setChange] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedJob = jobs.find((job) => job.id === selectedJobId);
  const openJobs = useMemo(() => jobs.filter((job) => job.status === "모집중"), [jobs]);
  const visibleJobs = useMemo(
    () =>
      openJobs.filter(
        (job) =>
          (cropFilter === "전체" || job.crop === cropFilter) &&
          (workerTab === "saved" ||
            ((!availableDate || job.workDate === availableDate) &&
              job.durationHours <= maxHours &&
              job.wagePerHour >= minimumWage)) &&
          `${job.title} ${job.description} ${job.location} ${job.crop} ${job.difficulty}`
            .toLocaleLowerCase()
            .includes(searchQuery.trim().toLocaleLowerCase()) &&
          (workerTab !== "saved" || bookmarkedJobIds.includes(job.id)),
      ),
    [availableDate, bookmarkedJobIds, cropFilter, maxHours, minimumWage, openJobs, searchQuery, workerTab],
  );
  const appliedJobs = useMemo(
    () =>
      trackedApplications.flatMap((application) => {
        const job = jobs.find((entry) => entry.id === application.jobId);
        return job ? [{ application, job }] : [];
      }),
    [jobs, trackedApplications],
  );

  async function refreshJobs() {
    const nextJobs = await api<Job[]>("/api/jobs");
    setJobs(nextJobs);
    if (!selectedJobId && nextJobs.length > 0) await loadJobDetails(nextJobs[0].id);
  }

  useEffect(() => {
    try {
      const savedBookmarks = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (savedBookmarks !== null) {
        const parsed: unknown = JSON.parse(savedBookmarks);
        if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === "string")) {
          throw new Error("관심 작업 저장 형식이 올바르지 않습니다.");
        }
        setBookmarkedJobIds(parsed);
      }

      const savedApplications = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
      if (savedApplications !== null) {
        const parsed: unknown = JSON.parse(savedApplications);
        if (
          !Array.isArray(parsed) ||
          !parsed.every(
            (entry) =>
              typeof entry === "object" &&
              entry !== null &&
              "jobId" in entry &&
              typeof entry.jobId === "string" &&
              "applicantId" in entry &&
              typeof entry.applicantId === "string" &&
              "status" in entry &&
              (entry.status === "신청" || entry.status === "확정" || entry.status === "취소"),
          )
        ) {
          throw new Error("지원 현황 저장 형식이 올바르지 않습니다.");
        }
        setTrackedApplications(parsed);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "브라우저에 저장된 이용 정보를 읽지 못했습니다.");
    }
    refreshJobs().catch((cause: unknown) =>
      setError(cause instanceof Error ? cause.message : "작업 목록을 불러오지 못했습니다."),
    );
  }, []);

  async function refreshTrackedApplications() {
    if (trackedApplications.length === 0) return;
    setLoading("applications");
    setError("");
    try {
      const refreshed = await Promise.all(
        trackedApplications.map(async (application) => {
          const applicants = await api<Applicant[]>(`/api/jobs/${application.jobId}/applicants`);
          const current = applicants.find((entry) => entry.id === application.applicantId);
          if (!current) throw new Error("지원 기록을 서버에서 찾을 수 없습니다.");
          return { ...application, status: current.status };
        }),
      );
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(refreshed));
      setTrackedApplications(refreshed);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "지원 현황을 새로고침하지 못했습니다.");
    } finally {
      setLoading("");
    }
  }

  function selectWorkerTab(tab: WorkerTab) {
    setWorkerTab(tab);
    setError("");
    if (tab === "applied") void refreshTrackedApplications();
  }

  function switchRole() {
    const nextRole = role === "farmer" ? "worker" : "farmer";
    setRole(nextRole);
    setError("");
    setSuccess("");
    if (nextRole === "farmer" && selectedJobId) void loadJobDetails(selectedJobId);
  }

  function toggleBookmark(jobId: string) {
    const next = bookmarkedJobIds.includes(jobId)
      ? bookmarkedJobIds.filter((id) => id !== jobId)
      : [...bookmarkedJobIds, jobId];
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(next));
      setBookmarkedJobIds(next);
    } catch {
      setError("관심 작업을 이 브라우저에 저장하지 못했습니다.");
    }
  }

  async function loadJobDetails(jobId: string) {
    setSelectedJobId(jobId);
    setError("");
    setSuccess("");
    setLoading("details");
    setMatches([]);
    setMatchingSummary(null);
    setSafetyReview(null);
    setWorkflowSteps([]);
    setNextActions([]);
    try {
      const [nextApplicants, recommendation] = await Promise.all([
        api<Applicant[]>(`/api/jobs/${jobId}/applicants`),
        api<{
          matches: Match[];
          matchingSummary: MatchingSummary;
          safetyReview: SafetyReview;
          workflowSteps: WorkflowStep[];
          nextActions: WorkflowAction[];
        }>(`/api/jobs/${jobId}/matches`),
      ]);
      setApplicants(nextApplicants);
      setMatches(recommendation.matches);
      setMatchingSummary(recommendation.matchingSummary);
      setSafetyReview(recommendation.safetyReview);
      setWorkflowSteps(recommendation.workflowSteps);
      setNextActions(recommendation.nextActions);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "작업 정보를 불러오지 못했습니다.");
      setApplicants([]);
      setMatches([]);
      setMatchingSummary(null);
      setSafetyReview(null);
      setWorkflowSteps([]);
      setNextActions([]);
    } finally {
      setLoading("");
    }
  }

  async function parseJob() {
    setLoading("parse");
    setError("");
    setSuccess("");
    try {
      const result = await api<JobDraft>("/api/jobs/parse", {
        method: "POST",
        body: JSON.stringify({ note: jobNote }),
      });
      setDraft(result);
      setSuccess("AI가 공고 초안을 만들었어요. 빠진 정보와 조건을 확인해 주세요.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "공고 초안을 만들지 못했습니다.");
    } finally {
      setLoading("");
    }
  }

  async function publishJob() {
    if (!draft) return;
    setLoading("publish");
    setError("");
    setSuccess("");
    try {
      const created = await api<Job>("/api/jobs", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      setDraft(null);
      setJobNote("");
      await refreshJobs();
      await loadJobDetails(created.id);
      setSuccess("작업 공고를 등록했어요.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "공고를 등록하지 못했습니다.");
    } finally {
      setLoading("");
    }
  }

  async function apply(job: Job) {
    if (trackedApplications.some((application) => application.jobId === job.id)) {
      setError("이미 지원한 작업입니다. 지원 현황에서 상태를 확인해 주세요.");
      return;
    }
    if (!name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    setLoading(`apply-${job.id}`);
    setError("");
    setSuccess("");
    try {
      const applicant = await api<Applicant>(`/api/jobs/${job.id}/applicants`, {
        method: "POST",
        body: JSON.stringify({
          name,
          availableDate: availableDate || job.workDate,
          maxHours,
          minimumWage,
          preferredDifficulty,
          languages: ["한국어"],
        }),
      });
      const nextApplications = [
        ...trackedApplications,
        { jobId: job.id, applicantId: applicant.id, status: applicant.status },
      ];
      setApplyingJobId("");
      try {
        localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(nextApplications));
        setTrackedApplications(nextApplications);
        setSuccess(`${job.title} 작업에 지원 의사를 보냈어요. 지원 현황에서 진행 상태를 확인할 수 있습니다.`);
      } catch {
        setTrackedApplications(nextApplications);
        setError("지원은 등록됐지만 이 브라우저에 지원 현황을 저장하지 못했습니다.");
      }
      await refreshJobs();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "지원을 등록하지 못했습니다.");
    } finally {
      setLoading("");
    }
  }

  async function confirmApplicant(applicant: Applicant) {
    if (!selectedJob) return;
    setLoading(`confirm-${applicant.id}`);
    setError("");
    try {
      await api(`/api/jobs/${selectedJob.id}/applicants/${applicant.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "확정" }),
      });
      await refreshJobs();
      await loadJobDetails(selectedJob.id);
      setSuccess(`${applicant.name} 님을 작업 참여자로 확정했어요.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "확정 처리에 실패했습니다.");
    } finally {
      setLoading("");
    }
  }

  async function makeNotice() {
    if (!selectedJob) return;
    setLoading("notice");
    setError("");
    try {
      const result = await api<{ notice: string }>(
        `/api/jobs/${selectedJob.id}/change-notice`,
        { method: "POST", body: JSON.stringify({ change }) },
      );
      setNotice(result.notice);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "안내문을 만들지 못했습니다.");
    } finally {
      setLoading("");
    }
  }

  function followWorkflowAction(action: WorkflowAction) {
    const targetId = {
      applicants: "applicant-review",
      safety: "safety-review",
      notice: "change-notice",
    }[action.id];
    const target = document.getElementById(targetId);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (action.id === "notice") {
      document.getElementById("change-input")?.focus({ preventScroll: true });
    }
  }

  function updateDraft<K extends keyof JobDraft>(key: K, value: JobDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="일손이음 홈">
          <span className="brand-mark">손</span>
          <span>일손이음</span>
        </a>
        <div className="topbar-right">
          <span className="location-pill"><span className="dot" /> 청도군 농작업 연결</span>
          <button className="role-switch" onClick={switchRole}>
            {role === "farmer" ? "구직자 화면 보기" : "농가 화면 보기"}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{role === "farmer" ? "농가 업무 생산성 도구" : "청도 농촌 일자리"}</p>
          <h1>{role === "farmer" ? <>반복되는 농가 업무를<br /><em>더 가볍게</em>.</> : <>청도의 농장에서<br /><em>새로운 경험</em>을 시작해요.</>}</h1>
          <p className="hero-description">
            {role === "farmer"
              ? "공고 작성부터 지원자 검토와 일정 조율까지, 반복되는 인력 업무를 한곳에서 도와요."
              : "작업 내용과 시간, 급여를 미리 확인하고 나에게 맞는 농작업을 찾아보세요."}
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="sun" />
          <span className="hill hill-back" />
          <span className="hill hill-front" />
          <div className="fruit fruit-one">柿</div>
          <div className="fruit fruit-two">🍎</div>
          <div className="field-label">CHEONGDO<br />LOCAL WORK</div>
        </div>
      </section>

      <nav className="role-tabs" aria-label="사용자 화면">
        <button className={role === "farmer" ? "active" : ""} onClick={() => setRole("farmer")}>
          <span>01</span> 농가예요
        </button>
        <button className={role === "worker" ? "active" : ""} onClick={() => setRole("worker")}>
          <span>02</span> 일자리를 찾아요
        </button>
        <div className="demo-label">로그인 없이 체험하는 데모</div>
      </nav>

      {error && <div className="toast error-toast" role="alert">{error}<button onClick={() => setError("")}>닫기</button></div>}
      {success && <div className="toast success-toast" role="status">{success}<button onClick={() => setSuccess("")}>닫기</button></div>}

      {role === "farmer" ? (
        <section className="farmer-layout">
          <div className="primary-column">
            <section className="panel create-panel">
              <div className="section-heading">
                <div><p className="eyebrow">빠른 작업 등록</p><h2>어떤 일손이 필요하세요?</h2></div>
                <span className="step-chip">메모로 초안 시작</span>
              </div>
              <p className="muted">말하듯 적으면 GitHub Copilot SDK가 공고 필드로 정리해요. 빠진 정보는 표시하고, 게시 전 농가가 직접 확인합니다.</p>
              <label className="field-label" htmlFor="job-note">작업 내용을 편하게 적어주세요</label>
              <div className="voice-input-wrap">
                <textarea id="job-note" rows={3} value={jobNote} onChange={(event) => setJobNote(event.target.value)} placeholder="예) 내일 오전 8시부터 청도읍 반시밭 감 따기, 4명, 5시간, 시급 12,000원. 편한 복장으로 오세요." />
                <button className="mic-button" title="음성으로 입력" onClick={() => startVoiceInput((text) => setJobNote((current) => `${current}${current ? " " : ""}${text}`), setError)}>
                  <span aria-hidden="true">●</span><small>말하기</small>
                </button>
              </div>
              <div className="form-actions">
                <span className="privacy-note">음성 인식을 지원하는 브라우저에서 사용할 수 있어요.</span>
                <button className="button-primary" disabled={loading === "parse" || jobNote.trim().length < 4} onClick={parseJob}>
                  {loading === "parse" ? <><span className="spinner" /> 정리 중...</> : <>Copilot SDK로 공고 정리 <span>→</span></>}
                </button>
              </div>
              {draft && (
                <div className="draft-editor">
                  <div className="draft-title"><div><span className="ai-chip">GitHub Copilot SDK · 초안</span><h3>공고 내용을 확인해 주세요</h3></div><button className="text-button" onClick={() => setDraft(null)}>초안 닫기</button></div>
                  {draft.missingFields.length > 0 && <p className="missing-note">확인할 정보: {draft.missingFields.join(" · ")}</p>}
                  <div className="draft-grid">
                    <Field label="작물"><select value={draft.crop} onChange={(event) => updateDraft("crop", event.target.value as JobDraft["crop"])}>{crops.map((crop) => <option key={crop}>{crop}</option>)}</select></Field>
                    <Field label="작업명"><input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} /></Field>
                    <Field label="작업 날짜"><input type="date" min={today} value={draft.workDate} onChange={(event) => updateDraft("workDate", event.target.value)} /></Field>
                    <Field label="시작 시간"><input type="time" value={draft.startTime} onChange={(event) => updateDraft("startTime", event.target.value)} /></Field>
                    <Field label="예상 시간"><input type="number" min={1} max={12} value={draft.durationHours} onChange={(event) => updateDraft("durationHours", Number(event.target.value))} /></Field>
                    <Field label="필요 인원"><input type="number" min={1} value={draft.workersNeeded} onChange={(event) => updateDraft("workersNeeded", Number(event.target.value))} /></Field>
                    <Field label="시급 (원)"><input type="number" min={0} step={500} value={draft.wagePerHour} onChange={(event) => updateDraft("wagePerHour", Number(event.target.value))} /></Field>
                    <Field label="작업 강도"><select value={draft.difficulty} onChange={(event) => updateDraft("difficulty", event.target.value as JobDraft["difficulty"])}>{difficulties.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select></Field>
                    <Field label="작업 위치"><input value={draft.location} onChange={(event) => updateDraft("location", event.target.value)} placeholder="예: 청도읍" /></Field>
                    <Field label="준비물"><input value={draft.supplies} onChange={(event) => updateDraft("supplies", event.target.value)} /></Field>
                    <Field label="상세 업무" wide><textarea rows={2} value={draft.description} onChange={(event) => updateDraft("description", event.target.value)} /></Field>
                    <Field label="안전 유의사항" wide><textarea rows={2} value={draft.safetyNotes} onChange={(event) => updateDraft("safetyNotes", event.target.value)} placeholder="작업 전 확인할 안전 안내를 입력해 주세요." /></Field>
                  </div>
                  <div className="form-actions"><span className="privacy-note">내용을 확인하고 수정한 뒤 게시하세요.</span><button className="button-primary" disabled={loading === "publish"} onClick={publishJob}>{loading === "publish" ? "등록 중..." : "확인하고 공고 게시 →"}</button></div>
                </div>
              )}
            </section>

            <section className="panel jobs-panel">
              <div className="section-heading"><div><p className="eyebrow">농가 작업 현황</p><h2>내 작업 공고</h2></div><span className="count-pill">{jobs.length}건</span></div>
              {jobs.map((job) => (
                <button className={`job-row ${selectedJobId === job.id ? "selected" : ""}`} key={job.id} onClick={() => loadJobDetails(job.id)}>
                  <span className={`crop-avatar crop-${job.crop}`}>{job.crop === "반시" ? "柿" : job.crop === "사과" ? "🍎" : "🌱"}</span>
                  <span className="job-row-main"><strong>{job.title}</strong><small>{job.workDate} · {job.startTime} · {job.location}</small></span>
                  <span className={`status-tag ${job.status === "모집중" ? "open" : "closed"}`}>{job.status}</span>
                  <span className="row-arrow">›</span>
                </button>
              ))}
            </section>

            {selectedJob && (
              <section className="panel management-panel">
                <div className="section-heading"><div><p className="eyebrow">선택한 작업</p><h2>{selectedJob.title}</h2></div><span className="count-pill">{applicants.filter((person) => person.status === "확정").length}/{selectedJob.workersNeeded}명 확정</span></div>
                <p className="muted">{selectedJob.workDate} {selectedJob.startTime} · {selectedJob.durationHours}시간 · 시급 {selectedJob.wagePerHour.toLocaleString()}원 · {selectedJob.location}</p>
                <section className="farm-agent" aria-labelledby="farm-agent-title">
                  <div className="farm-agent-heading">
                    <div><p className="eyebrow">Microsoft Agent Framework</p><h3 id="farm-agent-title">농가 업무 에이전트</h3></div>
                    <button className="button-secondary agent-rerun" disabled={loading === "details"} onClick={() => loadJobDetails(selectedJob.id)}>
                      {loading === "details" ? "실행 중..." : "업무 흐름 다시 실행"}
                    </button>
                  </div>
                  <p className="farm-agent-intro">후보 조건 비교 → 작업 정보 검토 → 다음 업무 정리. 게시·채용·안내 발송은 농가가 직접 결정합니다.</p>
                  {loading === "details" ? (
                    <div className="agent-running" role="status"><span className="spinner" /> Agent Framework가 작업 흐름을 실행하고 있어요.</div>
                  ) : workflowSteps.length > 0 ? (
                    <>
                      <ol className="workflow-steps">
                        {workflowSteps.map((step, index) => (
                          <li key={step.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{step.title}</strong><p>{step.summary}</p></div></li>
                        ))}
                      </ol>
                      <div className="workflow-next-actions">
                        <strong>이어 할 수 있는 작업</strong>
                        {nextActions.map((action) => (
                          <button key={action.id} className="workflow-action" onClick={() => followWorkflowAction(action)}>
                            <span><b>{action.title}</b><small>{action.summary}</small></span><span aria-hidden="true">→</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : <p className="empty-note">업무 흐름 결과가 없습니다. 다시 실행해 주세요.</p>}
                </section>
                <div className="management-grid">
                  <div>
                    <h3 className="subheading">후보 조건 분석 <span className="ai-chip">Microsoft Agent Framework</span></h3>
                    {matchingSummary && <div className="workflow-summary">
                      <strong>조건별 후보 분석 결과</strong>
                      <p>등록 후보 {matchingSummary.evaluatedWorkers}명 검토 · 필수 조건 통과 {matchingSummary.eligibleWorkers}명</p>
                      <small>날짜 미일치 {matchingSummary.excludedByCriteria.dateUnavailable} · 시간 부족 {matchingSummary.excludedByCriteria.insufficientHours} · 희망 시급 초과 {matchingSummary.excludedByCriteria.wageMismatch}</small>
                      <small>조건별 제외 수는 중복될 수 있습니다. 점수는 날짜 40·시간 25·급여 25·선호 강도 10점 기준입니다.</small>
                    </div>}
                    {loading === "details" ? <p className="muted">조건을 확인하고 있어요...</p> : matches.length === 0 ? <p className="empty-note">조건이 맞는 체험용 구직자가 없어요.</p> : matches.map((match) => (
                      <article className="match-card" key={match.applicant.id}>
                        <div className="avatar">{match.applicant.name.slice(0, 1)}</div>
                        <div className="match-content"><strong>{match.applicant.name}{match.applicant.isDemo && <small className="demo-tag">데모 프로필</small>}</strong><p>{match.reasons.join(" · ")}</p></div>
                        <span className="match-score">{match.score}<small>점</small></span>
                      </article>
                    ))}
                    {safetyReview && <div id="safety-review" className={`safety-box ${safetyReview.warnings.length ? "has-warning" : ""}`}><strong>작업 정보 확인</strong>{safetyReview.warnings.length ? safetyReview.warnings.map((warning) => <p key={warning}>• {warning}</p>) : safetyReview.checks.map((check) => <p key={check}>✓ {check}</p>)}</div>}
                  </div>
                  <div>
                    <h3 id="applicant-review" className="subheading">지원 현황 <span className="count-pill">{applicants.length}</span></h3>
                    {applicants.length === 0 ? <p className="empty-note">아직 지원한 사람이 없어요.</p> : applicants.map((person) => (
                      <article className="applicant-row" key={person.id}><span className="avatar">{person.name.slice(0, 1)}</span><div className="applicant-info"><strong>{person.name}</strong><small>{person.availableDate} · 최대 {person.maxHours}시간 · 희망 시급 {person.minimumWage.toLocaleString()}원</small></div>{person.status === "신청" ? <button className="button-small" disabled={loading === `confirm-${person.id}`} onClick={() => confirmApplicant(person)}>확정</button> : <span className="status-tag open">{person.status}</span>}</article>
                    ))}
                  </div>
                </div>
                <div id="change-notice" className="notice-maker"><div><h3>일정 변경 안내</h3><p className="muted">Copilot SDK가 입력한 변경 내용으로 안내문 초안을 만듭니다. 발송 전 직접 확인해 주세요.</p></div><div className="notice-input"><input id="change-input" value={change} onChange={(event) => setChange(event.target.value)} placeholder="예: 비 예보로 오후 1시로 변경" /><button className="button-secondary" disabled={!change.trim() || loading === "notice"} onClick={makeNotice}>{loading === "notice" ? "초안 작성 중..." : "초안 만들기"}</button></div>{notice && <div className="notice-result"><strong>Copilot SDK 안내문 초안</strong><p>{notice}</p><button className="text-button" onClick={() => navigator.clipboard.writeText(notice)}>복사</button></div>}</div>
              </section>
            )}
          </div>
          <aside className="side-column">
            <div className="stats-card"><p className="eyebrow">농가 업무 현황</p><div className="stat-line"><strong>{openJobs.length}</strong><span>모집 중인 작업</span></div><div className="stat-line"><strong>{jobs.filter((job) => job.status === "모집중").reduce((sum, job) => sum + job.workersNeeded, 0)}</strong><span>필요한 손길</span></div><p className="stats-foot">공고부터 지원자 확인·일정 조율까지</p></div>
            <div className="tip-card"><span className="tip-icon">✳</span><p className="eyebrow">일손이음 팁</p><h3>작업 조건을 자세히 적을수록 더 잘 연결돼요.</h3><p>날짜, 시간, 시급, 작업 강도와 안전 유의사항을 확인해 주세요.</p></div>
            <div className="agent-card"><span className="ai-chip">두 필수 기술의 실제 역할</span><ol><li><span>01</span> 짧은 메모를 검토 가능한 공고 초안으로 구조화 <small>GitHub Copilot SDK · 누락 항목 확인 · 변경 안내 초안</small></li><li><span>02</span> 후보 조건 매칭과 작업정보·안전 확인을 순서대로 실행 <small>Microsoft Agent Framework · 근거와 집계 결과 표시</small></li><li><span>03</span> 초안 승인·지원자 선택·최종 확정 <small>농가가 결정 · AI는 자동 게시·채용하지 않음</small></li></ol></div>
          </aside>
        </section>
      ) : (
        <section className="worker-layout">
          <nav className="worker-nav" role="tablist" aria-label="구직자 메뉴">
            <button role="tab" aria-selected={workerTab === "jobs"} className={workerTab === "jobs" ? "active" : ""} onClick={() => selectWorkerTab("jobs")}>일자리 찾기</button>
            <button role="tab" aria-selected={workerTab === "saved"} className={workerTab === "saved" ? "active" : ""} onClick={() => selectWorkerTab("saved")}>관심 <span>{bookmarkedJobIds.length}</span></button>
            <button role="tab" aria-selected={workerTab === "applied"} className={workerTab === "applied" ? "active" : ""} onClick={() => selectWorkerTab("applied")}>지원 현황 <span>{trackedApplications.length}</span></button>
          </nav>
          {workerTab !== "applied" && <div className="panel worker-profile">
            <div className="section-heading"><div><p className="eyebrow">내 조건 설정</p><h2>나에게 맞는 일 찾기</h2></div><span className="step-chip">조건을 바꾸면 목록에 반영돼요</span></div>
            <div className="profile-grid">
              <Field label="이름"><input value={name} onChange={(event) => setName(event.target.value)} placeholder="이름 또는 별칭" /></Field>
              <Field label="가능한 날짜"><input type="date" min={today} value={availableDate} onChange={(event) => setAvailableDate(event.target.value)} /></Field>
              <Field label="하루 가능 시간"><select value={maxHours} onChange={(event) => setMaxHours(Number(event.target.value))}>{[2, 3, 4, 5, 6, 8, 10, 12].map((hours) => <option key={hours} value={hours}>{hours}시간까지</option>)}</select></Field>
              <Field label="희망 시급 (원)"><input type="number" step={500} value={minimumWage} onChange={(event) => setMinimumWage(Number(event.target.value))} /></Field>
              <Field label="선호 작업 강도"><select value={preferredDifficulty} onChange={(event) => setPreferredDifficulty(event.target.value as typeof preferredDifficulty)}>{difficulties.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select></Field>
            </div>
            <p className="privacy-note">데모에서는 이름과 조건이 이 기기의 서버에 저장되어 농가 화면에 표시됩니다.</p>
          </div>}
          {workerTab === "applied" ? (
            <section className="worker-applications">
              <div className="worker-list-heading"><div><p className="eyebrow">MY APPLICATIONS</p><h2>내 지원 현황 <span>{appliedJobs.length}</span></h2></div><button className="button-secondary" disabled={loading === "applications"} onClick={refreshTrackedApplications}>{loading === "applications" ? "확인 중..." : "상태 새로고침"}</button></div>
              {appliedJobs.length === 0 ? <div className="panel empty-state">아직 지원한 작업이 없어요. 일자리 찾기에서 조건에 맞는 작업을 살펴보세요.</div> : <div className="worker-job-grid">{appliedJobs.map(({ application, job }) => (
                <article className="worker-job-card" key={application.applicantId}>
                  <div className="worker-card-top"><span className={`crop-avatar crop-${job.crop}`}>{job.crop === "반시" ? "柿" : job.crop === "사과" ? "🍎" : "🌱"}</span><span className={`status-tag ${application.status === "취소" ? "closed" : "open"}`}>{application.status}</span></div>
                  <p className="eyebrow">{job.crop} · {job.location}</p><h3>{job.title}</h3>
                  <p className="job-description">{job.workDate} {job.startTime} · {job.durationHours}시간</p>
                  <div className="wage-row"><strong>{job.wagePerHour.toLocaleString()}<small>원/시간</small></strong><span>농가 확인 후 상태가 갱신됩니다.</span></div>
                </article>
              ))}</div>}
            </section>
          ) : <>
          <div className="worker-list-heading"><div><p className="eyebrow">{workerTab === "saved" ? "SAVED JOBS" : "CHEONGDO JOBS"}</p><h2>{workerTab === "saved" ? "관심 작업" : "모집 중인 농작업"} <span>{visibleJobs.length}</span></h2></div><select value={cropFilter} onChange={(event) => setCropFilter(event.target.value)} aria-label="작물 필터"><option value="전체">전체 작물</option>{crops.map((crop) => <option key={crop}>{crop}</option>)}</select></div>
          <label className="worker-search"><span aria-hidden="true">⌕</span><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="작업명, 장소, 작물로 검색" aria-label="작업명, 장소, 작물로 검색" /><kbd>검색</kbd></label>
          {visibleJobs.length === 0 ? <div className="panel empty-state">{workerTab === "saved" && bookmarkedJobIds.length === 0 ? "아직 관심 작업이 없어요. 공고에서 저장해 두면 여기서 다시 볼 수 있어요." : "조건에 맞는 작업이 없어요. 검색어, 작물 또는 내 작업 조건을 바꿔보세요."}</div> : <div className="worker-job-grid">{visibleJobs.map((job) => (
            <article className="worker-job-card" key={job.id}>
              <div className="worker-card-top"><span className={`crop-avatar crop-${job.crop}`}>{job.crop === "반시" ? "柿" : job.crop === "사과" ? "🍎" : "🌱"}</span><div className="worker-card-actions"><span className="status-tag open">모집중</span><button className={`bookmark-button ${bookmarkedJobIds.includes(job.id) ? "saved" : ""}`} aria-label={bookmarkedJobIds.includes(job.id) ? `${job.title} 관심 해제` : `${job.title} 관심 저장`} aria-pressed={bookmarkedJobIds.includes(job.id)} onClick={() => toggleBookmark(job.id)}>{bookmarkedJobIds.includes(job.id) ? "♥" : "♡"}</button></div></div>
              <p className="eyebrow">{job.crop} · {job.location}</p><h3>{job.title}</h3>
              <p className="job-description">{job.description}</p>
              <div className="job-facts"><span>▣ {job.workDate} {job.startTime}</span><span>◷ {job.durationHours}시간</span><span>♧ {job.difficulty}</span><span>필요 인원 {job.workersNeeded}명</span></div>
              <div className="wage-row"><strong>{job.wagePerHour.toLocaleString()}<small>원/시간</small></strong><span>급여 기준은 농가 등록 정보</span></div>
              {job.safetyNotes && <p className="safety-inline">안전 안내 · {job.safetyNotes}</p>}
              {trackedApplications.some((application) => application.jobId === job.id) ? (
                <button className="button-primary full-button" onClick={() => selectWorkerTab("applied")}>지원 완료 · 지원 현황 보기</button>
              ) : (
                <button
                  className="button-primary full-button"
                  aria-expanded={applyingJobId === job.id}
                  aria-controls={`apply-form-${job.id}`}
                  onClick={() => {
                    setError("");
                    setApplyingJobId((current) => current === job.id ? "" : job.id);
                  }}
                >
                  {applyingJobId === job.id ? "지원서 닫기" : "이 작업에 지원하기 →"}
                </button>
              )}
              {applyingJobId === job.id && !trackedApplications.some((application) => application.jobId === job.id) && (
                <div className="application-form" id={`apply-form-${job.id}`}>
                  <strong>지원 내용을 확인해 주세요</strong>
                  <p>{job.workDate} · 최대 {maxHours}시간 · 희망 시급 {minimumWage.toLocaleString()}원 · 선호 강도 {preferredDifficulty}</p>
                  <Field label="지원자 이름 또는 별칭">
                    <input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="이름 또는 별칭" maxLength={60} />
                  </Field>
                  <p className="privacy-note">지원 정보는 데모 서버에 저장되어 농가 화면에 표시됩니다. 실제 개인정보는 입력하지 마세요.</p>
                  <button className="button-primary full-button" disabled={loading === `apply-${job.id}`} onClick={() => apply(job)}>
                    {loading === `apply-${job.id}` ? "지원 등록 중..." : "내용 확인 후 지원 등록"}
                  </button>
                  {error && <p className="application-error" role="alert">{error}</p>}
                </div>
              )}
            </article>
          ))}</div>}</>}
        </section>
      )}

      <footer><span>일손이음</span><span>농가의 반복 업무를 돕는 청도 농촌 데모 · 채용과 근로조건은 당사자가 확인합니다.</span></footer>
    </main>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return <label className={`field ${wide ? "wide" : ""}`}><span>{label}</span>{children}</label>;
}

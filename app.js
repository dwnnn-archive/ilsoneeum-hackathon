const seedJobs = [
  { id: 1, title: "청도 반시 수확 도와주실 분", farm: "이서면 · 햇살농원", category: "수확", date: "11월 6일 (금)", time: "08:00–13:00", pay: 75000, people: 3, due: "오늘 마감", urgent: true, description: "잘 익은 청도 반시를 수확하고 상자에 담는 작업입니다. 처음 하시는 분도 농장주가 옆에서 차근차근 알려드려요. 점심과 생수를 제공합니다." },
  { id: 2, title: "감말랭이 포장 작업 함께해요", farm: "화양읍 · 청도한입", category: "선별", date: "11월 7일 (토)", time: "09:00–16:00", pay: 90000, people: 2, due: "내일 마감", urgent: false, description: "완성된 감말랭이를 선별하고 소포장하는 작업입니다. 실내 작업이며 점심시간 1시간을 포함합니다." },
  { id: 3, title: "주말 농장 정리 도와주실 분", farm: "각북면 · 초록들농장", category: "농장관리", date: "11월 8일 (일)", time: "07:30–11:30", pay: 52000, people: 1, due: "2일 남음", urgent: false, description: "밭 주변 정리와 간단한 농장 관리 작업입니다. 작업 도구는 농장에서 제공합니다." },
  { id: 4, title: "반시 수확 및 건조장 정리", farm: "풍각면 · 산들바람농원", category: "수확", date: "11월 9일 (월)", time: "08:00–15:00", pay: 95000, people: 4, due: "3일 남음", urgent: true, description: "반시를 수확해 옮기고 건조장을 정리하는 작업입니다. 작업 장갑과 점심을 제공합니다." },
  { id: 5, title: "청도 반시 선별 보조", farm: "매전면 · 반시마루", category: "선별", date: "11월 10일 (화)", time: "10:00–16:00", pay: 80000, people: 2, due: "4일 남음", urgent: false, description: "수확한 감의 크기와 상태를 보고 상자에 나눠 담는 작업입니다. 선별 기준은 현장에서 안내해 드립니다." },
  { id: 6, title: "농장 주변 정리와 포장 보조", farm: "운문면 · 새벽농장", category: "농장관리", date: "11월 11일 (수)", time: "08:30–12:30", pay: 55000, people: 2, due: "5일 남음", urgent: false, description: "밭 주변을 정리하고 농산물 포장을 돕습니다. 무리하지 않고 쉬어가며 진행합니다." },
  { id: 7, title: "반시 포장 · 택배 준비", farm: "이서면 · 과수원길", category: "선별", date: "11월 12일 (목)", time: "09:00–15:00", pay: 85000, people: 3, due: "6일 남음", urgent: false, description: "반시를 크기별로 나누고 완충재와 함께 포장하는 작업입니다. 실내 작업 공간에서 진행해요." },
  { id: 8, title: "감 건조장 관리 작업", farm: "각남면 · 들꽃농원", category: "농장관리", date: "11월 13일 (금)", time: "07:00–12:00", pay: 65000, people: 2, due: "7일 남음", urgent: false, description: "감 건조장을 살펴보고 주변을 정리합니다. 익숙하지 않아도 함께 일하며 알려드려요." },
  { id: 9, title: "반시 수확과 바구니 옮기기", farm: "청도읍 · 달빛농원", category: "수확", date: "11월 14일 (토)", time: "07:30–12:30", pay: 70000, people: 2, due: "8일 남음", urgent: false, description: "반시를 따서 바구니에 담고 지정 장소로 옮기는 작업입니다. 간식과 물을 준비해 드립니다." },
  { id: 10, title: "농산물 꾸러미 포장 도우미", farm: "화양읍 · 청도곳간", category: "선별", date: "11월 15일 (일)", time: "09:00–14:00", pay: 65000, people: 2, due: "9일 남음", urgent: false, description: "지역 농산물 꾸러미에 담을 상품을 확인하고 박스 포장을 도와주세요." },
  { id: 11, title: "감나무 밭 주변 정리 작업", farm: "금천면 · 별빛농원", category: "농장관리", date: "11월 16일 (월)", time: "08:00–12:00", pay: 60000, people: 3, due: "10일 남음", urgent: false, description: "감나무 주변을 정리하고 떨어진 가지를 모읍니다. 기본 도구는 농장에서 준비합니다." },
  { id: 12, title: "청도 반시 선별 및 포장", farm: "각북면 · 자두정원", category: "선별", date: "11월 17일 (화)", time: "08:00–14:00", pay: 85000, people: 3, due: "11일 남음", urgent: false, description: "반시를 상태와 크기별로 분류하고 상자에 포장합니다. 작업 후 농산물도 조금 나눠드려요." },
];

const storageKeys = { jobs: "ilson.jobs.v1", applications: "ilson.applications.v1", bookmarks: "ilson.bookmarks.v1" };
const jobsFromStorage = readStorage(storageKeys.jobs);
let jobs = Array.isArray(jobsFromStorage) ? jobsFromStorage : seedJobs;
let activeFilter = "전체";
let activeTab = "home";
let visibleCount = 6;
let currentDraft = null;
let assistantAvailability = { copilot: false, agentFramework: false };
let toastTimeout;

const grid = document.querySelector("#jobs-grid");
const jobModal = document.querySelector("#job-modal");
const applicantsModal = document.querySelector("#applicants-modal");
const postModal = document.querySelector("#post-modal");
const toast = document.querySelector("#toast");

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch (error) {
    console.warn(`저장된 데이터(${key})를 읽지 못했습니다.`, error);
    return null;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`데이터(${key})를 저장하지 못했습니다.`, error);
    showToast("브라우저 저장 공간에 저장하지 못했어요.");
  }
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function getApplications() {
  const value = readStorage(storageKeys.applications);
  return Array.isArray(value) ? value.flatMap((application) => {
    if (Number.isInteger(application)) return [{ jobId: application, appliedAt: "", name: "", phone: "", message: "" }];
    if (!application || !Number.isInteger(application.jobId)) return [];
    return [{
      jobId: application.jobId,
      appliedAt: typeof application.appliedAt === "string" ? application.appliedAt : "",
      name: typeof application.name === "string" ? application.name : "",
      phone: typeof application.phone === "string" ? application.phone : "",
      message: typeof application.message === "string" ? application.message : "",
    }];
  }) : [];
}

function getBookmarks() {
  const value = readStorage(storageKeys.bookmarks);
  return Array.isArray(value) ? value : [];
}

function renderJobs() {
  const savedIds = getBookmarks();
  const applications = getApplications();
  const appliedIds = applications.map((application) => application.jobId);
  const userJobs = jobs.filter((job) => job.postedByMe);
  const isFarmerView = activeTab === "my";
  const baseJobs = activeTab === "saved"
    ? jobs.filter((job) => savedIds.includes(job.id))
    : activeTab === "applied"
      ? jobs.filter((job) => appliedIds.includes(job.id))
      : activeTab === "my" ? userJobs : jobs;
  const query = document.querySelector("#search-input").value.trim().toLowerCase();
  const filtered = baseJobs.filter((job) => {
    const categoryMatches = activeFilter === "전체" || job.category === activeFilter;
    const queryMatches = !query || `${job.title} ${job.category}`.toLowerCase().includes(query);
    return categoryMatches && queryMatches;
  });
  const shown = filtered.slice(0, visibleCount);
  grid.innerHTML = shown.map((job) => jobCardMarkup(job, {
    savedIds,
    showOwned: activeTab === "my",
    applicantCount: applications.filter((application) => application.jobId === job.id).length,
  })).join("");
  document.querySelector("#home-jobs").innerHTML = jobs.slice(0, 3)
    .map((job) => jobCardMarkup(job, { savedIds }))
    .join("");
  const emptyState = document.querySelector("#empty-state");
  emptyState.classList.toggle("hidden", filtered.length > 0);
  document.querySelector("#empty-title").textContent = emptyTitle();
  document.querySelector("#empty-description").textContent = emptyDescription();
  document.querySelector("#load-more").classList.toggle("hidden", activeTab === "my" || filtered.length <= visibleCount);
  document.querySelector(".job-toolbar").classList.toggle("hidden", activeTab === "my");
  document.querySelector(".jobs-section > .section-heading").classList.toggle("hidden", isFarmerView);
  document.querySelector("#farmer-dashboard").classList.toggle("hidden", !isFarmerView);
  document.querySelector("#farmer-job-count").textContent = userJobs.length;
  document.querySelector("#farmer-app-count").textContent = applications.filter((application) => userJobs.some((job) => job.id === application.jobId)).length;
  document.querySelector("#open-post").classList.toggle("hidden", true);
  document.querySelector("#view-title").innerHTML = viewTitle();
  document.querySelector("#view-description").textContent = viewDescription();
  document.querySelector("#home-view").classList.toggle("hidden", activeTab !== "home");
  document.querySelector("#jobs").classList.toggle("hidden", activeTab === "home");
  document.querySelector("#match-assist").classList.toggle("hidden", activeTab !== "jobs");
  document.querySelector("footer").classList.toggle("hidden", activeTab !== "home");
  document.querySelector("#count-all").textContent = jobs.length;
  document.querySelector("#stat-jobs").textContent = String(jobs.length).padStart(2, "0");
  updateTabCounts(savedIds.length, appliedIds.length);
}

function jobCardMarkup(job, { savedIds = [], showOwned = false, applicantCount = 0 } = {}) {
  const isSaved = savedIds.includes(job.id);
  return `
    <article class="job-card" data-job-id="${job.id}">
      <div class="job-topline">
        <div class="job-tags"><span class="job-tag">${categoryLabel(job.category)}</span>${job.postedByMe ? '<span class="job-tag status-tag">내가 등록</span>' : '<span class="job-tag sample-tag">시연용 샘플</span>'}${activeTab === "applied" ? '<span class="job-tag status-tag">시연 신청 기록</span>' : ""}</div>
        ${showOwned ? "" : `<button class="bookmark ${isSaved ? "saved" : ""}" data-bookmark="${job.id}" aria-label="${isSaved ? "관심 해제" : "관심 등록"}" aria-pressed="${isSaved}">♡</button>`}
      </div>
      <h3><button class="job-open" type="button" aria-label="${escapeHtml(job.title)} 상세 보기">${escapeHtml(job.title)}</button></h3>
      <p class="job-farm">${escapeHtml(jobLocation(job))}</p>
      <div class="job-meta"><span>▦ ${escapeHtml(job.date)}</span><span>◷ ${escapeHtml(job.time)}</span><span>♧ ${job.people}명 모집</span></div>
      <div class="job-bottom"><span class="job-pay">${formatWon(job.pay)}<small> / 일</small></span>${showOwned ? `<button class="applicants-button" type="button" data-view-applicants="${job.id}">지원 기록 ${applicantCount}건 보기</button>` : ""}</div>
    </article>
  `;
}

function jobLocation(job) {
  if (typeof job.location === "string" && job.location.trim()) return job.location.trim();
  if (typeof job.farm === "string" && job.farm.trim()) return job.farm.split("·")[0].trim();
  return "지역 확인 필요";
}

function viewTitle() {
  if (activeTab === "jobs") return "지금 필요한 <span>일손</span>";
  if (activeTab === "saved") return "관심 있는 <span>일자리</span>";
  if (activeTab === "applied") return "나의 <span>지원현황</span>";
  if (activeTab === "my") return "내가 등록한 <span>공고</span>";
  return "지금 필요한 <span>일손</span>";
}

function viewDescription() {
  if (activeTab === "jobs") return "작업 내용과 급여를 미리 확인하고 편하게 신청하세요.";
  if (activeTab === "saved") return "마음에 담아둔 청도 일자리를 다시 확인해보세요.";
  if (activeTab === "applied") return "지원 내역은 이 브라우저에만 시연용으로 기록됩니다.";
  if (activeTab === "my") return "등록한 시연 공고와 이 브라우저의 지원 기록을 확인해요.";
  return "작업 내용과 급여를 미리 확인하고 편하게 신청하세요.";
}

function emptyTitle() {
  if (activeTab === "saved") return "아직 관심 등록한 일자리가 없어요";
  if (activeTab === "applied") return "아직 지원한 일자리가 없어요";
  if (activeTab === "my") return "등록한 공고가 없어요";
  return "조건에 맞는 일자리가 없어요";
}

function emptyDescription() {
  if (activeTab === "saved") return "일자리 카드의 하트 버튼을 눌러 저장해보세요.";
  if (activeTab === "applied") return "공고에 지원하면 이 브라우저에 시연용 기록이 남아요.";
  if (activeTab === "my") return "농가 일자리 등록 버튼으로 첫 공고를 만들어보세요.";
  return "검색어를 바꾸거나 다른 작업을 둘러보세요.";
}

function updateTabCounts(savedCount, appliedCount) {
  for (const [id, count] of [["saved-count", savedCount], ["applied-count", appliedCount]]) {
    const badge = document.querySelector(`#${id}`);
    badge.textContent = count > 9 ? "9+" : String(count);
    badge.classList.toggle("hidden", count === 0);
  }
}

function switchTab(tab) {
  activeTab = tab;
  activeFilter = "전체";
  visibleCount = 6;
  document.querySelector("#search-input").value = "";
  document.querySelectorAll(".filter-tab").forEach((button) => {
    const isSelected = button.dataset.filter === "전체";
    button.classList.toggle("selected", isSelected);
  });
  document.querySelectorAll(".mobile-tab").forEach((button) => {
    const isSelected = button.dataset.tab === tab;
    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-selected", String(isSelected));
  });
  renderJobs();
  loadAssistantAvailability();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function categoryLabel(category) {
  return category === "선별" ? "선별·포장" : category;
}

function formatWon(amount) {
  return `${Number(amount).toLocaleString("ko-KR")}원`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

async function requestAssistant(path, value) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
    signal: AbortSignal.timeout(25_000),
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("AI 서버 응답을 읽지 못했습니다.");
  }
  if (!response.ok) {
    throw new Error(typeof result?.error === "string" ? result.error : "AI 요청을 처리하지 못했습니다.");
  }
  if (typeof result?.text !== "string" || !result.text.trim()) {
    throw new Error("AI가 비어 있는 답변을 반환했습니다.");
  }
  return result.text.trim();
}

function assistantErrorMessage(error) {
  if (error?.name === "TimeoutError") return "AI 응답 시간이 초과됐습니다. 조건을 직접 확인하고 다시 시도해 주세요.";
  if (error instanceof TypeError) return "AI 서버에 연결할 수 없습니다. 기본 기능은 계속 사용할 수 있습니다.";
  return error instanceof Error ? error.message : "AI 요청을 처리하지 못했습니다.";
}

async function loadAssistantAvailability() {
  const copilotStatus = document.querySelector("#copilot-status");
  const agentStatus = document.querySelector("#agent-status");
  try {
    const response = await fetch("/api/assist/status", { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`AI 상태 요청 실패 (${response.status}).`);
    const status = await response.json();
    assistantAvailability = {
      copilot: status.copilot === true,
      agentFramework: status.agentFramework === true,
    };
    copilotStatus.textContent = assistantAvailability.copilot
      ? "설정 확인됨 · 실제 추천은 요청 시 확인합니다."
      : "미설정 · 기본 공고 탐색은 계속 이용할 수 있습니다.";
    agentStatus.textContent = assistantAvailability.agentFramework
      ? "설정 확인됨 · 실제 초안은 요청 시 확인합니다."
      : "미설정 · 규칙 기반 초안은 계속 이용할 수 있습니다.";
  } catch (error) {
    console.warn("AI 설정 상태를 확인하지 못했습니다.", error);
    copilotStatus.textContent = "AI 연결 상태를 확인하지 못했습니다 · 기본 탐색은 계속 이용할 수 있습니다.";
    agentStatus.textContent = "AI 연결 상태를 확인하지 못했습니다 · 규칙 기반 초안은 계속 이용할 수 있습니다.";
    copilotStatus.classList.add("error");
    agentStatus.classList.add("error");
  }
  document.querySelector("#match-submit").disabled = !assistantAvailability.copilot;
  document.querySelector("#request-ai-draft").disabled = !assistantAvailability.agentFramework;
}

function toMatchJob(job) {
  if (!job || typeof job.time !== "string") return null;
  const timeRange = job.time.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  const pay = Number(job.pay);
  if (!timeRange || !Number.isInteger(pay) || pay < 1) return null;
  return {
    id: String(job.id),
    title: String(job.title ?? ""),
    category: String(job.category ?? ""),
    location: jobLocation(job),
    date: String(job.date ?? ""),
    start: normalizeTime(...timeRange[1].split(":")),
    end: normalizeTime(...timeRange[2].split(":")),
    pay,
  };
}

function matchCandidates() {
  const query = document.querySelector("#search-input").value.trim().toLowerCase();
  const seen = new Set();
  return jobs
    .filter((job) =>
      (activeFilter === "전체" || job.category === activeFilter) &&
      (!query || `${job.title} ${job.category}`.toLowerCase().includes(query)),
    )
    .map(toMatchJob)
    .filter((job) => {
      if (!job || !job.id || !job.title || !job.category || !job.date || !job.start || !job.end || seen.has(job.id)) return false;
      seen.add(job.id);
      return true;
    })
    .slice(0, 10);
}

function openJob(jobId) {
  const job = jobs.find((entry) => entry.id === Number(jobId));
  if (!job) return;
  renderJobDetails(job);
  jobModal.showModal();
}

function renderJobDetails(job) {
  const application = getApplications().find((entry) => entry.jobId === job.id);
  const applied = Boolean(application);
  document.querySelector("#job-detail").innerHTML = `
    <div class="detail-tags"><span class="job-tag">${categoryLabel(job.category)}</span>${job.postedByMe ? '<span class="job-tag status-tag">내가 등록한 시연 공고</span>' : '<span class="job-tag sample-tag">시연용 샘플 공고</span>'}</div>
    <h2 class="detail-title" id="modal-title">${escapeHtml(job.title)}</h2>
    <div class="detail-info">
      <div class="draft-field"><small>작업 지역</small><b>${escapeHtml(jobLocation(job))}</b></div>
      <div class="draft-field"><small>작업 날짜</small><b>${escapeHtml(job.date)}</b></div>
      <div class="draft-field"><small>작업 시간</small><b>${escapeHtml(job.time)}</b></div>
      <div class="draft-field"><small>일급</small><b>${formatWon(job.pay)}</b></div>
      <div class="draft-field"><small>모집 인원</small><b>${job.people}명</b></div>
    </div>
    <p class="detail-description">${escapeHtml(job.description)}</p>
    ${applied ? `<div class="application-confirmation"><b>이 브라우저에서 지원서를 작성했어요.</b><span>${escapeHtml(application.name || "시연 지원자")} · 농가나 서버로 전송되지는 않았습니다.</span></div>` : `<p class="detail-safety">시연용 지원서입니다. 실제 개인정보 대신 예시 정보를 입력해주세요. 입력한 내용은 이 브라우저에만 저장되며 농가나 서버로 전송되지 않습니다.</p>
    <button class="button button-primary detail-apply" data-apply="${job.id}">이 일자리에 지원하기</button>`}
  `;
}

function renderApplicationForm(job) {
  document.querySelector("#job-detail").innerHTML = `
    <button class="back-to-job" type="button" data-back-to-job="${job.id}">‹ 공고 내용으로</button>
    <div class="modal-eyebrow">DEMO APPLICATION · 지원서 작성</div>
    <h2 class="detail-title" id="modal-title">지원자 정보를 입력해주세요</h2>
    <p class="application-job-title">${escapeHtml(job.title)} · ${escapeHtml(job.date)}</p>
    <form id="application-form" data-job-id="${job.id}">
      <label class="field-label" for="applicant-name">이름 <span>시연용</span></label>
      <input class="application-input" id="applicant-name" name="name" type="text" maxlength="40" autocomplete="name" placeholder="예: 홍길동" required />
      <label class="field-label" for="applicant-phone">연락처 <span>시연용</span></label>
      <input class="application-input" id="applicant-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" pattern="[0-9+() -]{8,20}" placeholder="예: 010-1234-5678" required />
      <label class="field-label" for="applicant-message">지원 한마디 <span>선택</span></label>
      <textarea class="application-textarea" id="applicant-message" name="message" maxlength="300" placeholder="가능한 일정이나 작업 경험을 적어주세요."></textarea>
      <p class="application-privacy">실제 이름·전화번호는 입력하지 마세요. 입력 내용은 시연을 위해 이 브라우저에 저장되며, 농가나 서버로 전송되지 않습니다.</p>
      <button class="button button-primary detail-apply" type="submit">시연 지원서 제출</button>
    </form>
  `;
  document.querySelector("#applicant-name").focus();
}

function openApplicants(jobId) {
  const job = jobs.find((entry) => entry.id === Number(jobId));
  if (!job) return;
  const applications = getApplications().filter((application) => application.jobId === job.id);
  const applicantsDetail = document.querySelector("#applicants-detail");
  applicantsDetail.innerHTML = `
    <div class="modal-eyebrow">SAMPLE APPLICATIONS · 시연 기록</div>
    <h2 class="detail-title" id="applicants-title">${escapeHtml(job.title)}</h2>
    <p class="applicants-note">같은 브라우저에 저장된 시연 지원서입니다. 이름·연락처는 예시 정보만 입력하도록 안내하며 실제 농가에는 전달되지 않습니다.</p>
    ${applications.length
      ? `<div class="applicant-list">${applications.map((application, index) => {
        const appliedAt = application.appliedAt ? new Date(application.appliedAt) : null;
        const dateLabel = appliedAt && !Number.isNaN(appliedAt.getTime())
          ? new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(appliedAt)
          : "기존 시연 기록";
        return `<article class="applicant-row"><span class="applicant-avatar" aria-hidden="true">✓</span><span class="applicant-content"><b>${escapeHtml(application.name || `익명 지원 ${index + 1}`)}</b><small>${escapeHtml(application.phone || "연락처 미입력")} · ${escapeHtml(dateLabel)}</small>${application.message ? `<p>${escapeHtml(application.message)}</p>` : ""}</span><span class="applicant-status">시연 접수</span></article>`;
      }).join("")}</div>`
      : '<div class="empty-applicants">아직 이 브라우저에 기록된 지원이 없습니다.</div>'}
  `;
  applicantsModal.showModal();
}

function openPostModal() {
  document.querySelector("#post-form").classList.remove("hidden");
  document.querySelector("#draft-panel").classList.add("hidden");
  document.querySelector("#ai-draft-result").classList.add("hidden");
  document.querySelector("#agent-status").classList.remove("error");
  document.querySelector("#job-description").value = "";
  currentDraft = null;
  postModal.showModal();
}

function parseDraft(text) {
  const category = /선별|포장|분류/.test(text) ? "선별" : /관리|잡초|물주기|정리|모종/.test(text) ? "농장관리" : /수확|따기|따서/.test(text) ? "수확" : "";
  const payMatch = text.match(/(\d{1,3}(?:,\d{3})*|\d{4,6})\s*만\s*원/);
  const wonMatch = text.match(/(\d{1,3}(?:,\d{3})*|\d{4,6})\s*원/);
  const pay = payMatch ? Number(payMatch[1].replaceAll(",", "")) * 10000 : wonMatch ? Number(wonMatch[1].replaceAll(",", "")) : null;
  const personMatch = text.match(/(\d{1,2})\s*명/);
  const people = personMatch ? Number(personMatch[1]) : null;
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2})|시)\s*(?:부터|[~–-])\s*(\d{1,2})(?::(\d{2})|시)(?:까지)?/);
  const start = timeMatch ? normalizeTime(timeMatch[1], timeMatch[2]) : "";
  const end = timeMatch ? normalizeTime(timeMatch[3], timeMatch[4]) : "";
  const explicitDate = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  const weekdayMatch = text.match(/(?:(다음\s*주)\s*)?(월|화|수|목|금|토|일)요일/);
  const locationMatch = text.match(/([가-힣]{1,6}(?:읍|면|리))/);
  let dateLabel = "";
  if (explicitDate) {
    dateLabel = `${Number(explicitDate[1])}월 ${Number(explicitDate[2])}일`;
  } else if (weekdayMatch) {
    const now = new Date();
    const targetDay = ["일", "월", "화", "수", "목", "금", "토"].indexOf(weekdayMatch[2]);
    let daysAhead = (targetDay - now.getDay() + 7) % 7;
    if (daysAhead === 0 || weekdayMatch[1]) daysAhead += 7;
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead);
    dateLabel = `${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일 (${weekdayMatch[2]})`;
  }
  const taskName = category === "수확" ? "농작물 수확" : category === "선별" ? "농산물 선별·포장" : category === "농장관리" ? "농장 관리" : "농작업";
  const title = `${taskName} 일손 모집`;
  return {
    title,
    category,
    location: locationMatch ? `청도군 ${locationMatch[1]}` : "",
    date: dateLabel,
    start,
    end,
    pay,
    people,
    description: text.trim(),
  };
}

function normalizeTime(hour, minute = "00") {
  const hours = Number(hour);
  const minutes = Number(minute);
  if (hours > 23 || minutes > 59) return "";
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function renderDraft(draft) {
  document.querySelector("#draft-content").innerHTML = `
    <form id="draft-review-form" class="draft-review-form">
      <label class="draft-field full"><small>공고 제목</small><input name="title" value="${escapeHtml(draft.title)}" maxlength="80" required /></label>
      <label class="draft-field"><small>작업 종류</small>
        <select name="category" required>
          <option value="">작업 종류 선택</option>
          <option value="수확" ${draft.category === "수확" ? "selected" : ""}>수확</option>
          <option value="선별" ${draft.category === "선별" ? "selected" : ""}>선별·포장</option>
          <option value="농장관리" ${draft.category === "농장관리" ? "selected" : ""}>농장 관리</option>
        </select>
      </label>
      <label class="draft-field"><small>작업 지역</small><input name="location" value="${escapeHtml(draft.location)}" maxlength="50" placeholder="예: 청도군 이서면" required /></label>
      <label class="draft-field"><small>작업 날짜</small><input name="date" value="${escapeHtml(draft.date)}" maxlength="24" placeholder="예: 11월 8일" required /></label>
      <label class="draft-field"><small>시작 시간</small><input name="start" type="time" value="${escapeHtml(draft.start)}" required /></label>
      <label class="draft-field"><small>종료 시간</small><input name="end" type="time" value="${escapeHtml(draft.end)}" required /></label>
      <label class="draft-field"><small>일급 (원)</small><input name="pay" type="number" min="1" max="10000000" step="1" value="${draft.pay ?? ""}" required /></label>
      <label class="draft-field"><small>모집 인원</small><input name="people" type="number" min="1" max="20" step="1" value="${draft.people ?? ""}" required /></label>
      <label class="field-label full" for="draft-description">공고 설명 확인·수정</label>
      <textarea class="draft-description full" id="draft-description" name="description" maxlength="400" minlength="8" required>${escapeHtml(draft.description)}</textarea>
    </form>
    <p class="draft-warning">추출되지 않은 조건은 직접 입력해야 등록할 수 있습니다. 예시 공고이며 실제 등록이나 농가 전달은 되지 않습니다.</p>
  `;
  document.querySelector("#post-form").classList.add("hidden");
  document.querySelector("#draft-panel").classList.remove("hidden");
}

document.querySelector("#open-post").addEventListener("click", openPostModal);
document.querySelector("#farmer-open-post").addEventListener("click", openPostModal);
document.querySelector("#search-input").addEventListener("input", () => {
  visibleCount = 6;
  renderJobs();
  loadAssistantAvailability();
});
document.querySelectorAll(".filter-tab").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelector(".filter-tab.selected").classList.remove("selected");
  tab.classList.add("selected");
  activeFilter = tab.dataset.filter;
  visibleCount = 6;
  renderJobs();
}));
document.querySelector("#load-more").addEventListener("click", () => {
  visibleCount += 6;
  renderJobs();
});
function handleJobGridClick(event) {
  const applicantsButton = event.target.closest("[data-view-applicants]");
  if (applicantsButton) {
    event.stopPropagation();
    openApplicants(applicantsButton.dataset.viewApplicants);
    return;
  }
  const bookmark = event.target.closest("[data-bookmark]");
  if (bookmark) {
    event.stopPropagation();
    const id = Number(bookmark.dataset.bookmark);
    const bookmarks = getBookmarks();
    saveStorage(storageKeys.bookmarks, bookmarks.includes(id) ? bookmarks.filter((item) => item !== id) : [...bookmarks, id]);
    renderJobs();
    return;
  }
  const card = event.target.closest("[data-job-id]");
  if (card && (event.target.closest(".job-open") || activeTab !== "my")) openJob(card.dataset.jobId);
}
grid.addEventListener("click", handleJobGridClick);
document.querySelector("#home-jobs").addEventListener("click", handleJobGridClick);
document.querySelectorAll(".mobile-tab").forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});
document.querySelector("#match-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const result = document.querySelector("#match-result");
  const button = document.querySelector("#match-submit");
  const candidates = matchCandidates();
  if (!candidates.length) {
    result.textContent = "현재 조건에 맞는 상세 정보가 있는 공고가 없습니다. 검색어나 필터를 바꿔보세요.";
    result.classList.remove("hidden", "error");
    return;
  }
  result.textContent = "시연 공고의 조건을 비교하고 있습니다.";
  result.classList.remove("hidden", "error");
  result.setAttribute("aria-busy", "true");
  button.disabled = true;
  try {
    const text = await requestAssistant("/api/assist/match", {
      question: document.querySelector("#match-question").value.trim(),
      jobs: candidates,
    });
    result.textContent = `${text}\n\nAI 제안입니다. 공고 상세에서 조건을 직접 확인하세요.`;
  } catch (error) {
    result.textContent = assistantErrorMessage(error);
    result.classList.add("error");
  } finally {
    result.removeAttribute("aria-busy");
    button.disabled = !assistantAvailability.copilot;
  }
});
document.querySelectorAll("[data-view-link]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    switchTab(button.dataset.viewLink);
  });
});
document.querySelectorAll("[data-open-guide]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector("#guide-modal").showModal();
  });
});
document.querySelector("#job-detail").addEventListener("click", (event) => {
  const applyButton = event.target.closest("[data-apply]");
  if (applyButton) {
    const job = jobs.find((entry) => entry.id === Number(applyButton.dataset.apply));
    if (job && !getApplications().some((application) => application.jobId === job.id)) renderApplicationForm(job);
    return;
  }
  const backButton = event.target.closest("[data-back-to-job]");
  if (backButton) {
    const job = jobs.find((entry) => entry.id === Number(backButton.dataset.backToJob));
    if (job) renderJobDetails(job);
  }
});
document.querySelector("#job-detail").addEventListener("submit", (event) => {
  if (event.target.id !== "application-form") return;
  event.preventDefault();
  const form = event.target;
  if (!form.reportValidity()) return;
  const jobId = Number(form.dataset.jobId);
  const job = jobs.find((entry) => entry.id === jobId);
  if (!job || getApplications().some((application) => application.jobId === jobId)) return;
  const formData = new FormData(form);
  const application = {
    jobId,
    appliedAt: new Date().toISOString(),
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    message: String(formData.get("message") ?? "").trim(),
  };
  if (!application.name || !application.phone) return;
  saveStorage(storageKeys.applications, [...getApplications(), application]);
  renderJobs();
  renderJobDetails(job);
  showToast("시연 지원서를 이 브라우저에 저장했어요. 실제 농가에는 전달되지 않습니다.");
});
document.querySelector("#post-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const description = document.querySelector("#job-description").value.trim();
  if (description.length < 8) {
    showToast("작업 내용을 조금 더 자세히 적어주세요.");
    return;
  }
  currentDraft = parseDraft(description);
  document.querySelector("#ai-draft-result").classList.add("hidden");
  renderDraft(currentDraft);
});
document.querySelector("#request-ai-draft").addEventListener("click", async () => {
  const form = document.querySelector("#post-form");
  if (!form.reportValidity()) return;
  const description = document.querySelector("#job-description").value.trim();
  currentDraft = parseDraft(description);
  const button = document.querySelector("#request-ai-draft");
  const status = document.querySelector("#agent-status");
  button.disabled = true;
  status.classList.remove("error");
  status.textContent = "Agent Framework에 문장 제안을 요청하고 있습니다.";
  try {
    const text = await requestAssistant("/api/assist/posting", {
      title: currentDraft.title,
      category: currentDraft.category || "농작업",
      location: currentDraft.location || "미입력",
      description,
    });
    document.querySelector("#ai-draft-text").value = text;
    document.querySelector("#ai-draft-result").classList.remove("hidden");
    status.textContent = "제안이 준비됐습니다. 날짜·시간·급여 등 조건은 별도로 확인해 주세요.";
  } catch (error) {
    status.textContent = assistantErrorMessage(error);
    status.classList.add("error");
  } finally {
    button.disabled = !assistantAvailability.agentFramework;
  }
});
document.querySelector("#apply-ai-draft").addEventListener("click", () => {
  const suggestedText = document.querySelector("#ai-draft-text").value.trim();
  if (!suggestedText || !currentDraft) return;
  currentDraft = { ...currentDraft, description: suggestedText };
  renderDraft(currentDraft);
});
document.querySelector("#edit-draft").addEventListener("click", () => {
  document.querySelector("#draft-panel").classList.add("hidden");
  document.querySelector("#post-form").classList.remove("hidden");
});
document.querySelector("#draft-panel").addEventListener("submit", (event) => {
  if (event.target.id !== "draft-review-form") return;
  event.preventDefault();
  if (!event.target.reportValidity()) return;
  const formData = new FormData(event.target);
  const start = String(formData.get("start") ?? "");
  const end = String(formData.get("end") ?? "");
  if (start >= end) {
    showToast("종료 시간은 시작 시간보다 늦게 입력해주세요.");
    return;
  }
  const newJob = {
    id: Date.now(),
    title: String(formData.get("title") ?? "").trim(),
    category: String(formData.get("category") ?? ""),
    location: String(formData.get("location") ?? "").trim(),
    date: String(formData.get("date") ?? "").trim(),
    time: `${start}–${end}`,
    pay: Number(formData.get("pay")),
    people: Number(formData.get("people")),
    description: String(formData.get("description") ?? "").trim(),
    postedByMe: true,
  };
  jobs = [newJob, ...jobs];
  saveStorage(storageKeys.jobs, jobs);
  activeFilter = "전체";
  visibleCount = 6;
  document.querySelectorAll(".filter-tab").forEach((tab) => tab.classList.toggle("selected", tab.dataset.filter === "전체"));
  renderJobs();
  postModal.close();
  document.querySelector("#jobs").scrollIntoView({ behavior: "smooth" });
  showToast("공고 초안이 등록됐어요. 데모 브라우저에 저장했습니다.");
});
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
}));
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    document.querySelector("#search-input").focus();
    document.querySelector("#jobs").scrollIntoView({ behavior: "smooth" });
  }
});

renderJobs();

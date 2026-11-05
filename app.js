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
let activeTab = "jobs";
let visibleCount = 6;
let currentDraft = null;
let toastTimeout;

const grid = document.querySelector("#jobs-grid");
const jobModal = document.querySelector("#job-modal");
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
  return Array.isArray(value) ? value : [];
}

function getBookmarks() {
  const value = readStorage(storageKeys.bookmarks);
  return Array.isArray(value) ? value : [];
}

function renderJobs() {
  const query = document.querySelector("#search-input").value.trim().toLowerCase();
  const savedIds = getBookmarks();
  const appliedIds = getApplications();
  const userJobs = jobs.filter((job) => job.postedByMe);
  const baseJobs = activeTab === "saved"
    ? jobs.filter((job) => savedIds.includes(job.id))
    : activeTab === "applied"
      ? jobs.filter((job) => appliedIds.includes(job.id))
      : activeTab === "my" ? userJobs : jobs;
  const filtered = baseJobs.filter((job) => {
    const categoryMatches = activeFilter === "전체" || job.category === activeFilter;
    const queryMatches = !query || `${job.title} ${job.farm} ${job.category} ${job.description}`.toLowerCase().includes(query);
    return categoryMatches && queryMatches;
  });
  const shown = filtered.slice(0, visibleCount);
  grid.innerHTML = shown.map((job) => `
    <article class="job-card" data-job-id="${job.id}">
      <div class="job-topline">
        <div class="job-tags"><span class="job-tag">${categoryLabel(job.category)}</span>${job.urgent ? '<span class="job-tag urgent">마감 임박</span>' : ""}${activeTab === "applied" ? '<span class="job-tag status-tag">농가 확인 대기</span>' : ""}</div>
        ${activeTab === "my" ? '<span class="job-tag status-tag">내가 등록한 공고</span>' : `<button class="bookmark ${savedIds.includes(job.id) ? "saved" : ""}" data-bookmark="${job.id}" aria-label="${savedIds.includes(job.id) ? "관심 해제" : "관심 등록"}" aria-pressed="${savedIds.includes(job.id)}">♡</button>`}
      </div>
      <h3><button class="job-open" type="button" aria-label="${escapeHtml(job.title)} 상세 보기">${escapeHtml(job.title)}</button></h3>
      <div class="job-farm">⌖ ${escapeHtml(job.farm)}</div>
      <div class="job-meta"><span>▦ ${escapeHtml(job.date)}</span><span>◷ ${escapeHtml(job.time)}</span><span>♧ ${job.people}명 모집</span></div>
      <div class="job-bottom"><span class="job-pay">${formatWon(job.pay)}<small> / 일</small></span><span class="job-due">${escapeHtml(job.due)}</span></div>
    </article>
  `).join("");
  const emptyState = document.querySelector("#empty-state");
  emptyState.classList.toggle("hidden", filtered.length > 0);
  document.querySelector("#empty-title").textContent = emptyTitle();
  document.querySelector("#empty-description").textContent = emptyDescription();
  document.querySelector("#load-more").classList.toggle("hidden", activeTab === "my" || filtered.length <= visibleCount);
  document.querySelector(".job-toolbar").classList.toggle("hidden", activeTab === "my");
  document.querySelector("#open-post").classList.toggle("hidden", activeTab !== "my");
  document.querySelector("#view-title").innerHTML = viewTitle();
  document.querySelector("#view-description").textContent = viewDescription();
  document.querySelector(".hero").classList.toggle("hidden", activeTab !== "jobs");
  document.querySelector(".stats").classList.toggle("hidden", activeTab !== "jobs");
  document.querySelector(".how-section").classList.toggle("hidden", activeTab !== "jobs");
  document.querySelector("footer").classList.toggle("hidden", activeTab !== "jobs");
  document.querySelector("#count-all").textContent = jobs.length;
  document.querySelector("#stat-jobs").textContent = String(jobs.length).padStart(2, "0");
  updateTabCounts(savedIds.length, appliedIds.length);
}

function viewTitle() {
  if (activeTab === "saved") return "관심 있는 <span>일자리</span>";
  if (activeTab === "applied") return "나의 <span>지원현황</span>";
  if (activeTab === "my") return "내가 등록한 <span>공고</span>";
  return "지금 필요한 <span>일손</span>";
}

function viewDescription() {
  if (activeTab === "saved") return "마음에 담아둔 청도 일자리를 다시 확인해보세요.";
  if (activeTab === "applied") return "지원한 일자리와 진행 상태를 확인할 수 있어요.";
  if (activeTab === "my") return "농가 공고를 등록하고 참여 신청을 기다려보세요.";
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
  if (activeTab === "applied") return "관심 있는 공고를 열고 지원해보세요.";
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

function openJob(jobId) {
  const job = jobs.find((entry) => entry.id === Number(jobId));
  if (!job) return;
  const applied = getApplications().includes(job.id);
  document.querySelector("#job-detail").innerHTML = `
    <div class="modal-eyebrow">청도 일자리 · ${categoryLabel(job.category)}</div>
    <h2 class="detail-title" id="modal-title">${escapeHtml(job.title)}</h2>
    <div class="detail-farm">⌖ ${escapeHtml(job.farm)}</div>
    <div class="detail-info">
      <div class="draft-field"><small>작업 날짜</small><b>${escapeHtml(job.date)}</b></div>
      <div class="draft-field"><small>작업 시간</small><b>${escapeHtml(job.time)}</b></div>
      <div class="draft-field"><small>일급</small><b>${formatWon(job.pay)}</b></div>
      <div class="draft-field"><small>모집 인원</small><b>${job.people}명</b></div>
    </div>
    <div class="detail-description">${escapeHtml(job.description)}</div>
    <p class="detail-safety">지원 전 작업 시간·급여·작업 내용을 확인해주세요. 지원 정보는 농가에 전달되며, 매칭 결과는 농가 확인 후 안내됩니다.</p>
    <button class="button button-primary detail-apply" data-apply="${job.id}" ${applied ? "disabled" : ""}>${applied ? "지원 완료" : "이 일자리에 지원하기"}</button>
  `;
  jobModal.showModal();
}

function openPostModal() {
  document.querySelector("#post-form").classList.remove("hidden");
  document.querySelector("#draft-panel").classList.add("hidden");
  document.querySelector("#job-description").value = "";
  currentDraft = null;
  postModal.showModal();
}

function parseDraft(text) {
  const category = /선별|포장|분류/.test(text) ? "선별" : /관리|잡초|물주기|정리|모종/.test(text) ? "농장관리" : "수확";
  const districts = ["청도읍", "화양읍", "각남면", "풍각면", "각북면", "이서면", "운문면", "금천면", "매전면"];
  const district = districts.find((name) => text.includes(name)) ?? "청도읍";
  const payMatch = text.match(/(\d{1,3}(?:,\d{3})*|\d{4,6})\s*만\s*원/);
  const wonMatch = text.match(/(\d{1,3}(?:,\d{3})*|\d{4,6})\s*원/);
  const pay = payMatch ? Number(payMatch[1].replaceAll(",", "")) * 10000 : wonMatch ? Number(wonMatch[1].replaceAll(",", "")) : 80000;
  const personMatch = text.match(/(\d{1,2})\s*명/);
  const people = personMatch ? Math.min(Number(personMatch[1]), 20) : 2;
  const timeMatch = text.match(/(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
  const time = timeMatch ? `${String(timeMatch[1]).padStart(2, "0")}:${String(timeMatch[2] ?? "00").padStart(2, "0")} 시작` : "08:00 시작";
  const explicitDate = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  const weekdayMatch = text.match(/(?:(다음\s*주)\s*)?(월|화|수|목|금|토|일)요일/);
  let dateLabel = "일정 협의";
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
  const taskName = category === "수확" ? "농작물 수확" : category === "선별" ? "농산물 선별·포장" : "농장 관리";
  const title = `${taskName} 일손 모집`;
  return {
    title,
    farm: `${district} · 청도 농가`,
    category,
    date: dateLabel,
    time,
    pay,
    people,
    due: "신규 공고",
    urgent: false,
    description: text.trim(),
  };
}

function renderDraft(draft) {
  document.querySelector("#draft-content").innerHTML = `
    <div class="draft-grid">
      <div class="draft-field full"><small>공고 제목</small><b>${escapeHtml(draft.title)}</b></div>
      <div class="draft-field"><small>지역</small><b>${escapeHtml(draft.farm.split(" · ")[0])}</b></div>
      <div class="draft-field"><small>작업 종류</small><b>${categoryLabel(draft.category)}</b></div>
      <div class="draft-field"><small>일정</small><b>${escapeHtml(draft.date)} · ${escapeHtml(draft.time)}</b></div>
      <div class="draft-field"><small>급여 · 모집</small><b>${formatWon(draft.pay)} · ${draft.people}명</b></div>
    </div>
    <p class="draft-warning">데모용 AI 초안입니다. 금액·날짜 등 조건이 실제 입력 내용과 다른지 꼭 확인해 주세요.</p>
  `;
  document.querySelector("#post-form").classList.add("hidden");
  document.querySelector("#draft-panel").classList.remove("hidden");
}

document.querySelector("#open-post").addEventListener("click", openPostModal);
document.querySelector("#open-post-top").addEventListener("click", openPostModal);
document.querySelector("#search-input").addEventListener("input", () => {
  visibleCount = 6;
  renderJobs();
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
grid.addEventListener("click", (event) => {
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
});
document.querySelectorAll(".mobile-tab").forEach((button) => {
  button.addEventListener("click", () => switchTab(button.dataset.tab));
});
document.querySelector("#job-detail").addEventListener("click", (event) => {
  const button = event.target.closest("[data-apply]");
  if (!button) return;
  const id = Number(button.dataset.apply);
  const applications = getApplications();
  if (applications.includes(id)) return;
  saveStorage(storageKeys.applications, [...applications, id]);
  button.disabled = true;
  button.textContent = "지원 완료";
  showToast("지원이 접수됐어요. 농가 확인 후 안내드릴게요.");
});
document.querySelector("#post-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const description = document.querySelector("#job-description").value.trim();
  if (description.length < 8) {
    showToast("작업 내용을 조금 더 자세히 적어주세요.");
    return;
  }
  currentDraft = parseDraft(description);
  renderDraft(currentDraft);
});
document.querySelector("#edit-draft").addEventListener("click", () => {
  document.querySelector("#draft-panel").classList.add("hidden");
  document.querySelector("#post-form").classList.remove("hidden");
});
document.querySelector("#publish-draft").addEventListener("click", () => {
  if (!currentDraft) return;
  const newJob = { ...currentDraft, id: Date.now(), postedByMe: true };
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

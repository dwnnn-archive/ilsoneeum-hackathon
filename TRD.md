# TRD — 일손이음

## 시스템 구성

```text
React + Vite (모바일 웹, 브라우저 음성 받아쓰기)
                  │ HTTPS / JSON
Express API ──────┼── Copilot SDK (@github/copilot-sdk)
                  │     작업 메모 구조화·변경 안내 초안
                  │
                  └── Python 프로세스
                        Microsoft Agent Framework Workflow
                        조건 매칭 → 작업정보·안전 누락 점검
                  │
             JSON 파일 저장소 (데모 전용)
```

## GitHub Copilot SDK 및 Agent Framework

- **GitHub Copilot SDK (`server/copilot.ts`):** 농가의 자연어 메모를 `JobDraftSchema`에 맞춰 작물·작업·일정·인원·급여·위치·안전정보 필드로 구조화하고, 모르는 조건은 추측하지 않고 누락 항목으로 표시한다. 일정 변경 안내도 작성한다. 응답은 Zod로 검증하고 사람의 확인 전에는 게시·발송하지 않는다.
- **Microsoft Agent Framework (`agent_service/match.py`):** `WorkflowBuilder`가 `MatchWorkers` → `ReviewSafetyInfo` → `PlanFarmActions` 실행기를 연결한다. 첫 단계는 날짜·가능 시간·희망 급여 조건을 적용하고, 조건 충족 후보를 선호 작업 강도와 일치도에 따라 점수화한다. 두 번째 단계는 작업정보·안전 확인사항을 검토하고, 세 번째 단계는 결과에 근거해 농가가 직접 이어서 할 지원자 검토·정보 확인·변경 안내 초안을 우선순위로 정리한다. 규칙은 코드로 명시되고 각 단계의 실행 결과가 UI에 표시된다.
- **결과의 가시성:** 농가 화면에 3단계 워크플로 실행 요약, 검토 후보 수, 조건 통과 수, 조건별 제외 수, 점수 기준, 안전 확인사항, 이어서 할 수 있는 작업 링크를 노출한다. 이는 Agent Framework가 실제 조율 흐름을 실행한 근거이며, “자율 채용 에이전트” 또는 LLM 기반 매칭이라고 주장하지 않는다.
- **사람의 최종 결정:** AI는 게시, 지원자 선택, 고용을 확정하지 않는다. 농가가 공고를 승인하고 지원자를 최종 확정한다. 위험·정보 플래그는 안전 인증이 아니다.
- **입출력 검증:** 공용 Zod 스키마로 API 데이터와 SDK 응답을 검증한다. Python 워크플로의 입출력은 JSON 직렬화로 전달하고, 실패는 API 오류로 노출한다.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | 프로세스 상태 확인 |
| GET | `/api/jobs` | 작업 공고 목록 |
| POST | `/api/jobs/parse` | Copilot SDK 공고 초안 생성 |
| POST | `/api/jobs` | 농가가 검토한 공고 저장 |
| GET | `/api/jobs/:id/matches` | Agent Framework 후보 추천·작업정보 검토 |
| GET | `/api/jobs/:id/applicants` | 신청자 조회 |
| POST | `/api/jobs/:id/applicants` | 지원 의사 등록 |
| PATCH | `/api/jobs/:id/applicants/:applicantId` | 농가 확정 또는 취소 |
| POST | `/api/jobs/:id/change-notice` | 변경 안내 초안 생성 |

## 데이터 저장

현재 데모는 `DATA_DIR/jobs.json`에 작업·지원·데모 구직자 데이터를 저장한다. 단일 인스턴스 해커톤 시연용이며 동시 쓰기/다중 인스턴스 환경의 데이터베이스로 간주하지 않는다. 실제 Azure 서비스에서는 Azure SQL 또는 Azure Storage를 사용하고 마이그레이션·접근제어를 추가한다.

구직자의 관심 공고 ID와 이 브라우저에서 시작한 지원 ID는 브라우저 `localStorage`에 둔다. 지원 상태 자체는 `/api/jobs/:id/applicants`에서 다시 읽어 서버의 최신 상태를 표시한다. 로그인 없는 데모의 브라우저별 기록이므로 사용자 계정 간 동기화나 실제 신원 확인을 제공하지 않는다.

## Azure 배포 및 운영

- Azure 리소스: Korea Central의 Linux App Service B1, Azure Container Registry Basic.
- `Dockerfile`이 Node 22와 Python Agent Framework 런타임을 함께 구성한다. GitHub Actions (`.github/workflows/deploy-azure.yml`)가 `ilsoneeum-submit` 브랜치에서 이미지를 빌드하고 ACR에 게시한 뒤 App Service에 배포한다.
- 배포 workflow는 저장소 Actions secrets `ACR_USERNAME`, `ACR_PASSWORD`, `AZURE_WEBAPP_PUBLISH_PROFILE`을 사용한다. 앱 설정은 `PORT=8080`, `WEBSITES_PORT=8080`, `DATA_DIR=/home/data`, `PYTHON_EXECUTABLE=/opt/agent-venv/bin/python`이며 컨테이너 저장소 영속성을 활성화한다.
- Copilot SDK 인증에 필요한 `GITHUB_TOKEN`은 Azure App Service의 서버 전용 설정으로 관리한다. 브라우저 번들, 소스 저장소, GitHub Actions 로그에 토큰을 노출하지 않는다.
- 비로그인 데모의 AI 호출은 인스턴스당 분당 10건으로 제한해 공개 SDK 엔드포인트의 우발적 과다 호출을 완화한다. 이는 사용자 인증이나 완전한 남용 방지 대책은 아니다.
- 배포 검증 전에는 URL을 제출용 배포 완료로 간주하지 않는다. `/api/health`, SDK 호출, Agent Framework 호출 및 데이터 저장을 확인한다.

## 심사 항목과 구현 근거

| 심사 항목 | 구현·검증 근거 |
|---|---|
| Copilot SDK + Agent Framework (25%) | **Copilot SDK:** 자연어→스키마 검증 공고 초안, 일정 변경 안내 초안. **Agent Framework:** 후보 매칭→작업정보 검토→후속 업무 정리의 세 단계 실행, 추천 근거·조건별 제외 집계·검토 결과 화면 표시 |
| 생산성·문제 적합성 (18%) | 공고 작성·지원자 검토·변경 조율의 반복 업무를 한 흐름으로 지원. 절감 시간과 생산성 향상은 파일럿 측정 전까지 수치로 주장하지 않음 |
| Azure 통합 (18%) | Azure App Service 배포 및 서버 측 SDK 운영을 목표로 하며 배포 후 증빙 필요 |
| 기능 완성도·기술 구현 (16%) | 공고·지원·최종 확정의 E2E 사용자 흐름 |
| UX·워크플로 (12%) | 모바일 반응형, 음성 받아쓰기, 쉬운 공고 입력, 로그인 없는 데모 |
| 책임 있는 AI·신뢰 (6%) | AI 초안의 사용자 승인, 추천 근거, 위험정보 플래그, 허위 안전 보증 금지 |
| 혁신성 (5%) | 고령 농가의 짧은 음성 메모를 실제 인력 조율 과정에 연결 |

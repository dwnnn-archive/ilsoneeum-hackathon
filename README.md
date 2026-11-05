# 일손이음

일손이음은 구인·구직 연결에 그치지 않고, 농가가 **공고 작성·지원자 검토·일정 조율에 반복해서 쓰는 시간을 줄이고 업무 생산성을 높이도록 돕는** 모바일 반응형 업무 도구입니다. **GitHub Copilot SDK**는 농가 메모를 검토 가능한 공고 초안과 변경 안내문으로 구조화하고, **Microsoft Agent Framework**는 명시된 조건으로 후보와 확인할 정보를 단계별로 정리합니다. 실제 생산성 향상은 파일럿에서 측정하며, 채용·급여·작업 확정은 사람이 결정합니다.

## 핵심 흐름

1. 농가가 작업을 말하거나 입력하면 GitHub Copilot SDK가 공고 초안을 구조화하고 스키마를 검증해 빠진 정보를 표시합니다.
2. 농가가 날짜·시간·급여·업무·안전 유의사항을 확인하고 게시합니다.
3. 구직자는 조건을 확인한 뒤 지원 의사를 보냅니다.
4. Microsoft Agent Framework의 3단계 워크플로가 후보를 조건별로 분석·점수화하고 작업정보·안전 확인사항을 검토한 뒤, 농가가 이어서 할 업무를 정리합니다. 단계별 결과와 조건별 제외 집계, 다음 작업 바로가기를 화면에 표시합니다.
5. 농가가 신청자를 검토해 최종 확정하고, Copilot SDK로 일정 변경 안내 초안을 필요에 따라 만듭니다.

구직자는 작업명·장소·작물로 공고를 검색·필터링하고, 관심 작업을 저장하거나 이 브라우저에서 시작한 지원의 최신 상태를 다시 확인할 수 있습니다.

## 해커톤 시연 순서

1. 농가 화면에서 작업을 말하거나 적고 **Copilot SDK로 공고 정리**를 실행합니다. 초안 필드와 누락 정보가 만들어지는 것을 확인한 뒤 직접 검토합니다.
2. 공고를 게시하고 후보 조건 분석에서 후보 검토 수, 조건별 제외 수, 추천 사유와 안전 확인 결과를 확인합니다.
3. 일정 변경 안내 초안을 생성해 SDK가 공고 작성뿐 아니라 반복되는 후속 일정 조율도 돕는 것을 보여줍니다.
4. 구직자 화면에서 조건을 확인하고 지원한 뒤, 농가 화면으로 돌아와 사람이 직접 최종 확정합니다.

## 로컬 실행

필요 환경: Node.js 22.12 이상, Python 3.11 이상, GitHub Copilot SDK를 사용할 수 있는 계정/인증.

```powershell
npm install
npm run setup:agent-framework
Copy-Item .env.example .env
# .env에 GITHUB_TOKEN 설정(또는 Copilot SDK가 지원하는 로컬 인증 사용)
npm run dev
```

웹은 `http://localhost:5173`, API는 `http://localhost:3000`에서 실행됩니다. 서버 API의 작업 데이터는 `DATA_DIR` 아래 JSON 파일에 저장되며, 기본 경로는 `server/data/`입니다.

## 검증

```powershell
npm run typecheck
npm run build
```

## 구조

```text
src/             React 모바일 웹 UI, 브라우저 음성 입력
server/          Express API, Copilot SDK, 데모 작업 데이터 저장
shared/          Zod 스키마와 공용 타입
agent_service/   Microsoft Agent Framework 기반 후보 매칭·안전정보 워크플로
```

## Azure 배포

`Dockerfile`은 Node와 Python Agent Framework를 한 컨테이너에 구성합니다. `dwnnn-archive/ilsoneeum-hackathon` 저장소의 `ilsoneeum-submit` 브랜치에 push하면 GitHub Actions가 Azure Container Registry에 이미지를 빌드·게시하고 Azure App Service에 배포합니다.

GitHub 저장소 Actions secrets에 `ACR_USERNAME`, `ACR_PASSWORD`, `AZURE_WEBAPP_PUBLISH_PROFILE`을 등록해야 합니다. Azure App Service는 `PORT=8080`, `WEBSITES_PORT=8080`, `DATA_DIR=/home/data`, `PYTHON_EXECUTABLE=/opt/agent-venv/bin/python`, 영속 저장소 설정을 사용합니다. Copilot SDK를 쓰려면 Azure App Service의 서버 전용 `GITHUB_TOKEN` 설정도 필요하며, 저장소나 브라우저 번들에 토큰을 넣지 마세요. 첫 배포 뒤 `/api/health`, Copilot SDK 호출, Agent Framework 실행을 검증해야 합니다.

이 저장소 버전의 JSON 파일 저장소는 단일 데모 인스턴스용입니다. 실제 서비스 운영 전에는 Azure SQL 또는 Azure Storage로 전환하고, 인증·권한·개인정보 보호·근로조건 검증을 추가해야 합니다.

## 데모와 신뢰 경계

- 예시 작업과 추천 프로필은 화면에서 데모 데이터로 표시합니다.
- AI 초안은 농가가 검토·수정한 뒤에만 공고로 등록됩니다.
- 추천은 명시된 날짜·시간·급여 조건을 기준으로 하며 채용 결정을 자동화하지 않습니다.
- 안전 검토는 입력된 정보의 누락이나 확인 필요성을 표시하는 보조 기능이며, 안전 적합성을 인증하지 않습니다.
- 현재 버전은 지원 의사와 상태를 시연합니다. 실제 고용계약, 급여 지급, 보험·자격 판정 기능은 제공하지 않습니다.

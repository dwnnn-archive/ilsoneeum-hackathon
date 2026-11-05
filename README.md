# 일손이음

청도군 농가와 청년을 잇는 모바일 우선 웹 프로토타입입니다. 공고 조회·검색·신청과 농가 공고 등록을 로그인 없이 체험할 수 있습니다. 공고와 신청은 예시이며 현재 브라우저에만 저장되고 실제 농가로 전달되지 않습니다.

## 로컬 실행

```powershell
npm.cmd install
npm.cmd run dev
```

AI API를 함께 확인하려면 별도 터미널에서 다음을 실행합니다. Vite는 `/api` 요청을 이 Node 서버로 전달합니다.

```powershell
npm.cmd start
```

Vite가 출력하는 주소(기본 `http://localhost:5173`)에서 웹 앱을 확인할 수 있습니다. Node 서버는 기본적으로 3001 포트를 사용하며 정적 앱 파일과 AI API를 제공합니다. Copilot SDK와 Foundry 기능은 선택 사항이며, 설정하지 않아도 핵심 데모 흐름을 사용할 수 있습니다. 변수 이름과 AI 데이터 처리 범위는 `.env.example`과 `TRD.md`를 참고하세요. 비밀 값은 채팅, 코드, 공개 저장소에 넣지 마세요.

Foundry 설명 초안을 로컬에서 실행하려면 Python 의존성을 설치하고 PowerShell 현재 세션에 Foundry 설정과 인증을 준비한 뒤 실행합니다.

```powershell
python -m pip install -r agent_service/requirements.txt
$env:FOUNDRY_PROJECT_ENDPOINT = "https://<your-foundry-endpoint>"
$env:FOUNDRY_MODEL = "<your-model-deployment>"
python -m uvicorn agent_service.main:app --host 127.0.0.1 --port 8001
```

## Azure App Service 설정

저장소에는 Azure App Service for Linux용 단일 컨테이너 `Dockerfile`이 포함되어 있습니다. Azure 리소스 생성이나 실제 배포는 이 저장소에서 수행하지 않았습니다.

1. 공개 컨테이너 레지스트리에 이미지를 게시하거나 Azure Container Registry(ACR)에 푸시합니다.
2. Linux App Service를 해당 컨테이너 이미지로 구성하고 컨테이너 포트를 `8080`으로 지정합니다.
3. Copilot 또는 Foundry 기능을 사용할 경우 앱 설정에 필요한 값만 구성하고, Foundry에는 관리 ID를 우선 사용합니다.
4. 배포 후 `/api/health`를 확인합니다. `/api/assist/status`는 자격 증명 설정 여부만 표시하며 공급자 연결을 보증하지 않습니다.

```powershell
docker build -t ilsonieum .
```

AI 답변은 안내용이며 실제 일정·급여·모집 여부를 확인해야 합니다. 운영 환경에서 실제 지원자를 처리하기 전에는 인증, 영속 저장소, 개인정보 동의·보관 정책, 모니터링과 분산 요청 제한이 추가되어야 합니다. 제품 요구사항은 `PRD.md`, 구조·API·보안 제약은 `TRD.md`에 있습니다.

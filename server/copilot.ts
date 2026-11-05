import { CopilotClient, approveAll } from "@github/copilot-sdk";
import { JobDraftSchema, type JobDraft } from "../shared/types";

const MODEL = process.env.COPILOT_MODEL ?? "gpt-5";

let clientPromise: Promise<CopilotClient> | null = null;

function getClient(): Promise<CopilotClient> {
  clientPromise ??= (async () => {
    const client = new CopilotClient({
      gitHubToken: process.env.GITHUB_TOKEN || undefined,
    });
    await client.start();
    return client;
  })();
  clientPromise.catch(() => (clientPromise = null));
  return clientPromise;
}

const JOB_PROMPT = `당신은 청도 농가의 작업 등록을 돕는 공고 작성 도우미입니다.
사용자의 짧은 메모를 농작업 공고 초안으로 정리합니다.
- 모르는 정보를 추측하지 말고 해당 필드는 빈 문자열 또는 0으로 두고 missingFields에 넣습니다.
- 날짜는 YYYY-MM-DD, 시간은 24시간제 HH:mm으로 씁니다.
- 청도 농작업에 맞는 crop, difficulty 값을 선택합니다. crop은 반시, 사과, 복숭아, 기타 중 하나이고 difficulty는 쉬움, 보통, 어려움 중 하나입니다.
- 급여는 시간당 원 단위입니다. 일급 등 기준이 불명확하면 추측하지 말고 missingFields에 "급여 기준"을 추가합니다.
- 작업 안전정보는 사용자가 제공한 내용만 정리하며, 임의의 농약·장비 안전 지침을 만들지 않습니다.
- 반드시 아래 JSON만 출력하고 다른 설명은 하지 않습니다.
{"crop":"반시|사과|복숭아|기타","title":"작업명","workDate":"YYYY-MM-DD 또는 빈 문자열","startTime":"HH:mm 또는 빈 문자열","durationHours":1,"workersNeeded":0,"wagePerHour":0,"difficulty":"쉬움|보통|어려움","location":"","description":"","supplies":"","safetyNotes":"","missingFields":[]}
모든 자유문자 필드는 한국어로 씁니다.`;

function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("AI 응답에서 JSON을 찾지 못했습니다.");
  return JSON.parse(text.slice(start, end + 1));
}

export async function draftJob(note: string): Promise<JobDraft> {
  const client = await getClient();
  const session = await client.createSession({
    model: MODEL,
    onPermissionRequest: approveAll,
    systemMessage: { mode: "replace", content: JOB_PROMPT },
  });
  try {
    const reply = await session.sendAndWait(
      { prompt: `농가가 말한 작업 내용:\n${note}` },
      60_000,
    );
    const content = reply?.data.content;
    if (!content) throw new Error("AI가 빈 응답을 반환했습니다.");
    return JobDraftSchema.parse(extractJson(content));
  } finally {
    await session.disconnect();
  }
}

export async function draftChangeNotice(jobTitle: string, change: string, recipients: string[]) {
  const client = await getClient();
  const session = await client.createSession({
    model: MODEL,
    onPermissionRequest: approveAll,
    systemMessage: {
      mode: "replace",
      content:
        "당신은 농가의 작업 일정 변경 안내문을 작성합니다. 제공된 변경사항만 사용하고, 급여나 근로조건을 임의로 바꾸지 않습니다. 한국어로 짧고 명확하게 작성합니다.",
    },
  });
  try {
    const reply = await session.sendAndWait(
      {
        prompt: `작업: ${jobTitle}\n변경 내용: ${change}\n안내 대상: ${recipients.join(", ") || "지원자 없음"}\n\n안내문 초안만 작성해 주세요.`,
      },
      60_000,
    );
    const content = reply?.data.content;
    if (!content) throw new Error("AI가 빈 응답을 반환했습니다.");
    return content.trim();
  } finally {
    await session.disconnect();
  }
}

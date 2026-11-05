import asyncio
import json
import sys
from typing import Never

from agent_framework import Executor, WorkflowBuilder, WorkflowContext, handler


class MatchWorkers(Executor):
    @handler
    async def match(self, payload: str, ctx: WorkflowContext[str]) -> None:
        request = json.loads(payload)
        job = request["job"]
        matches = []
        excluded = {
            "dateUnavailable": 0,
            "insufficientHours": 0,
            "wageMismatch": 0,
        }
        for worker in request["workers"]:
            reasons = []
            score = 0

            eligible = True
            if worker["availableDate"] == job["workDate"]:
                score += 40
                reasons.append("작업 날짜에 참여 가능")
            else:
                excluded["dateUnavailable"] += 1
                eligible = False

            if worker["maxHours"] >= job["durationHours"]:
                score += 25
                reasons.append("작업 시간을 모두 소화 가능")
            else:
                excluded["insufficientHours"] += 1
                eligible = False

            if worker["minimumWage"] <= job["wagePerHour"]:
                score += 25
                reasons.append("희망 급여 조건에 부합")
            else:
                excluded["wageMismatch"] += 1
                eligible = False

            if not eligible:
                continue

            if worker["preferredDifficulty"] == job["difficulty"]:
                score += 10
                reasons.append("선호 작업 강도와 일치")
            else:
                reasons.append("선호 작업 강도와 다름")

            matches.append({"applicant": worker, "score": score, "reasons": reasons})

        matches.sort(key=lambda item: (-item["score"], item["applicant"]["name"]))
        await ctx.send_message(
            json.dumps(
                {
                    "job": job,
                    "matches": matches,
                    "matchingSummary": {
                        "evaluatedWorkers": len(request["workers"]),
                        "eligibleWorkers": len(matches),
                        "excludedByCriteria": excluded,
                    },
                    "workflowSteps": [
                        {
                            "id": "matching",
                            "title": "명시된 조건으로 후보 비교",
                            "summary": (
                                f'{len(request["workers"])}명을 날짜·가능 시간·희망 급여 '
                                f'기준으로 비교해 {len(matches)}명이 조건을 통과했습니다.'
                            ),
                        }
                    ],
                },
                ensure_ascii=False,
            )
        )


class ReviewSafetyInfo(Executor):
    @handler
    async def review(self, message: str, ctx: WorkflowContext[str, str]) -> None:
        result = json.loads(message)
        job = result["job"]
        description = f'{job["title"]} {job["description"]}'.lower()
        safety_notes = job.get("safetyNotes", "").strip()
        warnings = []
        checks = ["작업일·시간·급여·장소 정보 확인"]

        if not safety_notes:
            warnings.append("농가가 작업별 안전 유의사항을 입력하고 확인해야 합니다.")
        else:
            checks.append("농가가 입력한 안전 유의사항이 있습니다.")

        if any(word in description for word in ("사다리", "기계", "농약", "전정기", "고소")):
            if not safety_notes:
                warnings.append("위험 요소가 언급됐지만 작업별 안전 안내가 없습니다.")
            else:
                warnings.append("위험 요소가 포함된 작업입니다. 작업 전 사람의 안전 확인이 필요합니다.")

        if job["wagePerHour"] <= 0:
            warnings.append("급여 정보를 확인해야 합니다.")
        if not job["location"].strip():
            warnings.append("정확한 작업 장소를 확인해야 합니다.")

        result["safetyReview"] = {"warnings": warnings, "checks": checks}
        await ctx.send_message(json.dumps(result, ensure_ascii=False))


class PlanFarmActions(Executor):
    @handler
    async def plan(self, message: str, ctx: WorkflowContext[Never, str]) -> None:
        result = json.loads(message)
        matches = result["matches"]
        warnings = result["safetyReview"]["warnings"]
        eligible_count = result["matchingSummary"]["eligibleWorkers"]

        result["workflowSteps"].append(
            {
                "id": "information_review",
                "title": "작업 정보와 확인사항 검토",
                "summary": (
                    f'확인 결과 {len(warnings)}건의 주의 항목과 '
                    f'{len(result["safetyReview"]["checks"])}건의 기본 정보가 있습니다.'
                ),
            }
        )
        result["nextActions"] = [
            {
                "id": "applicants",
                "title": "지원자 직접 검토",
                "summary": (
                    f"명시된 조건을 통과한 후보 {eligible_count}명을 검토하고 "
                    "농가가 참여자를 결정합니다."
                    if matches
                    else "조건을 통과한 후보가 없습니다. 지원 현황과 모집 조건을 직접 확인해 주세요."
                ),
            },
            {
                "id": "safety",
                "title": "작업 정보 확인",
                "summary": (
                    " · ".join(warnings)
                    if warnings
                    else "작업별 안내를 확인하세요. 이 검토는 안전 적합성을 인증하지 않습니다."
                ),
            },
            {
                "id": "notice",
                "title": "필요 시 변경 안내 초안",
                "summary": "일정 변경 내용은 Copilot SDK로 초안을 만들고 발송 전에 직접 확인합니다.",
            },
        ]
        result["workflowSteps"].append(
            {
                "id": "action_planning",
                "title": "다음 업무 정리",
                "summary": "검토 결과를 바탕으로 농가가 이어서 처리할 업무를 정리했습니다.",
            }
        )
        await ctx.yield_output(json.dumps(result, ensure_ascii=False))


def build_workflow():
    matcher = MatchWorkers(id="match_workers")
    reviewer = ReviewSafetyInfo(id="review_safety")
    planner = PlanFarmActions(id="plan_farm_actions")
    return (
        WorkflowBuilder(start_executor=matcher, output_from=[planner])
        .add_edge(matcher, reviewer)
        .add_edge(reviewer, planner)
        .build()
    )


async def main():
    payload = sys.stdin.read()
    workflow = build_workflow()
    result = await workflow.run(payload)
    outputs = result.get_outputs()
    if not outputs:
        raise RuntimeError("Agent Framework workflow returned no output")
    output = json.loads(outputs[-1])
    print(
        json.dumps(
            {
                "matches": output["matches"],
                "matchingSummary": output["matchingSummary"],
                "safetyReview": output["safetyReview"],
                "workflowSteps": output["workflowSteps"],
                "nextActions": output["nextActions"],
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    sys.stdin.reconfigure(encoding="utf-8")
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    try:
        asyncio.run(main())
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

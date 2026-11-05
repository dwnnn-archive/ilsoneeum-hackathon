# Project instructions

## Product and scope

- Product name: **일손이음**. It is a mobile-responsive web demo for coordinating seasonal farm work in Cheongdo.
- Keep the core flow focused: farmer drafts and confirms a job post, worker reviews conditions and applies, farmer reviews and confirms applicants.
- The product improves personal productivity by reducing repeated job-description, applicant-review, and schedule-coordination work. Do not describe it as an automated hiring service.
- Keep the hackathon requirements visible in product and technical decisions: personal productivity web app, GitHub Copilot SDK, Microsoft Agent Framework, and Azure deployment.
- Make the required technologies' concrete roles and outputs visible in the product: Copilot SDK drafts and validates editable content; Agent Framework orchestrates explicit matching and information-review steps with explainable results. Do not claim autonomous hiring or LLM-based matching.

## Responsible behavior

- AI may draft, summarize, explain explicit matching criteria, and flag missing information. A person approves job posts and makes all hiring decisions.
- Never infer eligibility, immigration status, legal compliance, safety certification, or suitability from protected or unprovided personal attributes.
- Show demo profiles and sample jobs as demo data. Do not present fabricated participation, employment, or impact metrics as real.
- Treat AI-generated translations and notices as drafts that require human review. Do not invent pay, hours, work conditions, or safety instructions.
- Keep secrets server-side. Do not put Copilot credentials in browser code, documentation examples, screenshots, or commits.

## Implementation conventions

- Use the existing React/Vite, Express, TypeScript, shared Zod schemas, and Python Agent Framework service unless a documented constraint requires a change.
- Validate API inputs and AI output at the boundary. Surface operational failures; do not turn failed AI or workflow calls into success-shaped fallback data.
- Keep matching criteria explicit, inspectable, and explainable. The Agent Framework workflow coordinates the matching and information-review steps; deterministic criteria remain ordinary code.
- Preserve the no-login demo path. Do not add authentication, payments, GPS tracking, or external messaging without an explicit product decision.
- Keep responsive layouts usable on small phone screens and provide a non-voice input path.

## Documentation and multi-perspective review

- Update `IDEATION.md` when the product direction, audience, key assumptions, or rejected alternatives change.
- Update `PRD.md` when user journeys, scope, requirements, acceptance criteria, or success measures change.
- Update `TRD.md` when architecture, APIs, data, AI orchestration, deployment, or operational claims change.
- Keep `README.md` aligned with what is implemented and how to run it. Label planned capabilities and deployment as planned until verified.
- Before submission, review `IDEATION.md`, `PRD.md`, and `TRD.md` from distinct product, user/UX, engineering, and responsible-AI perspectives. Prefer independent model reviews where available; record reviewer/model and date only when actually performed. Never claim that multiple models reviewed a document if they did not.
- Resolve contradictions between the four documents and the running code before treating a review as complete. Put unresolved questions and unverified assumptions in the documents rather than presenting them as facts.

## Validation

- For code changes, run the narrowest relevant tests, then `npm run typecheck` and `npm run build` when applicable.
- For Agent Framework changes, execute the workflow with representative eligible, ineligible, and missing-safety-information inputs.
- For deployment claims, verify the deployed URL, health endpoint, Copilot SDK runtime, Agent Framework execution, and persistence in the target Azure environment.
- Documentation-only edits do not require a build. Cross-model reviews are not substitutes for executable validation.

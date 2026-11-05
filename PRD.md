# Product Requirements Document

## Product

**일손이음** is a mobile-first demo connecting Cheongdo farms with young people seeking short-term rural work.

## Problem

Farmers can struggle to find workers at seasonal peaks. Young people often cannot compare work, schedule, location, and pay before deciding whether to participate.

## Goals

- Let young people browse and filter clearly labeled example listings.
- Show task description, location, date, hours, daily pay, and headcount before a demo application.
- Let farmers create and review a listing draft without inventing missing work conditions.
- Offer optional GitHub Copilot matching guidance and Microsoft Agent Framework description suggestions.
- Keep browsing, applications, and rule-based posting available when AI is unconfigured.
- Provide a responsive interface for mobile and desktop.

## Users and primary flows

### Young worker

1. Browse example listings from the home screen.
2. Search or filter by work type and inspect conditions.
3. Optionally request a Copilot-assisted comparison of up to ten matching listings.
4. Save an example application locally and revisit it in the application tab.

### Farmer

1. Open the farmer dashboard and enter a work description.
2. Optionally ask Microsoft Agent Framework for a clearer description.
3. Review the extracted or manually completed title, category, location, date, hours, pay, headcount, and description.
4. Save an example listing in this browser and inspect demo applications.

## Scope and limitations

- Listings are illustrative and are not real vacancies or verified offers.
- Applications and farmer-created listings stay in this browser's local storage; applications are not sent to farms or the server.
- Do not enter real names, phone numbers, or other personal information in demo applications or AI prompts.
- Copilot receives the user's short preference and bounded listing fields. Microsoft Agent Framework receives the draft title, category, location, and description. The server rejects obvious phone and email patterns.
- AI output is advisory and may be inaccurate. It never sets authoritative schedule or pay, and the farmer must review all fields before saving a demo listing.
- No user authentication, persistent service database, real matching, payment, employment contract, or verified program outcomes are provided.
- Azure App Service container configuration is included; no Azure resource deployment or live provider connectivity is claimed.

## Success signals for a future pilot

Measure listing completion, successful condition searches, application-flow completion, and user-reported clarity in a supervised pilot before setting targets. This prototype has no production analytics.

# Preflight

**Preflight** is a full-stack developer tool that evaluates API integrations.  
It analyzes API schemas, sample payloads, and internal requirements to detect breaking changes, mismatches, and potential risk areas.

## What Preflight Does

Given:
- An **OpenAPI (Swagger) schema**
- A **sample JSON request/response payload**
- A set of **internal requirements** (plain English or structured)

Preflight will:
- Detect breaking API changes
- Validate payloads against schemas
- Identify missing or mismatched fields
- Highlight potential integration risks
- Generate an analysis report

## Tech Stack

### Frontend
- Vite
- React
- TailwindCSS

### Backend
- Node.js
- Express.js

### Lambda & AI
- AWS Lambda
- OpenAI API
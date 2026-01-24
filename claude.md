# Project: PensionDashboard
## Tech Stack
- Frontend: ReactJS 19.2, Tailwind CSS
- Backend: NodeJS 25.4.0
- Testing: Vitest (Unit), Playwright (UI/E2E)

## Agentic Rules
- **Plan First**: Always generate a `plan.md` before writing code.
- **TDD Workflow**: For new features, write the Vitest unit test first.
- **Visual Verification**: After UI changes, use the Playwright screenshot tool to verify layout.
- **Autonomous Fixes**: If a test fails, analyze the logs and attempt 3 autonomous fixes before asking for help.

## Common Commands
- Build: `npm run build`
- Unit Tests: `npm run test`
- UI Tests: `npm run test:e2e`
- Lint: `npm run lint`


# Kimi Fix-List - NASA System 6 Portal

## Priority 1 - Critical (Breaks Prod / Security)
- [ ] Fix 6 high-severity vulnerabilities in client (react-scripts dependency chain)
- [ ] Fix 2 critical + 9 high vulnerabilities in system-css-main
- [ ] Add security headers middleware to Express server
- [ ] Implement input validation on all API endpoints
- [ ] Add rate limiting to prevent API abuse

## Priority 2 - High Impact (No Tests / Type Safety)
- [ ] Set up Jest + React Testing Library in client
- [ ] Set up Jest + Supertest in server
- [ ] Write unit tests for all React components (Desktop, MenuBar, Window, Apps)
- [ ] Write integration tests for API routes (nasa proxy, resources)
- [ ] Write tests for database operations
- [ ] Add PropTypes to all React components
- [ ] Add JSDoc type annotations to all backend code

## Priority 3 - Medium Impact (Code Quality)
- [ ] Install and configure ESLint with React hooks rules
- [ ] Install and configure Prettier with pre-commit hook
- [ ] Add .editorconfig for consistent formatting
- [ ] Update framer-motion 10.18.0 → 12.23.24
- [ ] Document API endpoints with OpenAPI/Swagger
- [ ] Add error boundary component for React app
- [ ] Implement proper error handling in API client

## Priority 4 - Low Impact (Nice-to-Have)
- [ ] Set up TypeScript with incremental adoption (jsconfig.json)
- [ ] Add bundle size analyzer to client build
- [ ] Update React 18 → 19 (breaking change, needs testing)
- [ ] Update Express 4 → 5 (breaking change, needs testing)
- [ ] Add health check endpoint tests
- [ ] Add README badges for build status, coverage, vulnerabilities
- [ ] Set up GitHub Actions CI/CD pipeline

## Priority 5 - Infrastructure
- [ ] Add GitHub Actions workflow for test/lint/audit
- [ ] Set up branch protection rules (require tests to pass)
- [ ] Add codecov integration for coverage reporting
- [ ] Configure Dependabot for automated security updates
- [ ] Add bundle size tracking to PR comments

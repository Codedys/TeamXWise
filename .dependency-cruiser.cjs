/**
 * Enforces the Clean Architecture Dependency Rule: source code dependencies
 * point inward only. See docs/architecture.md for the full picture and
 * src/app/__architecture-violation-fixture.ts for a working example of a
 * rule this config is meant to catch.
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-no-outward-deps',
      severity: 'error',
      comment: 'domain must not depend on application, adapters, infrastructure, or app',
      from: { path: '^src/domain' },
      to: { path: '^src/(application|adapters|infrastructure|app)/' },
    },
    {
      name: 'domain-no-external-packages',
      severity: 'error',
      comment: 'domain must have zero external dependencies: no Next, no Zod, no Drizzle, no Node core modules',
      from: { path: '^src/domain' },
      to: { dependencyTypes: ['npm', 'npm-dev', 'npm-no-pkg', 'core'] },
    },
    {
      name: 'application-only-domain',
      severity: 'error',
      comment: 'application may only depend on domain',
      from: { path: '^src/application' },
      to: { path: '^src/(adapters|infrastructure|app)/' },
    },
    {
      name: 'application-no-framework-packages',
      severity: 'error',
      comment: 'application must not import framework or driver packages directly',
      from: { path: '^src/application' },
      to: { path: 'node_modules/(next|drizzle-orm|postgres|zod)' },
    },
    {
      name: 'adapters-no-app',
      severity: 'error',
      comment: 'adapters must not depend on src/app',
      from: { path: '^src/adapters' },
      to: { path: '^src/app/' },
    },
    {
      name: 'adapters-controllers-and-presenters-no-infrastructure',
      severity: 'error',
      comment: 'controllers and presenters have no reason to touch infrastructure at all',
      from: { path: '^src/adapters/(controllers|presenters)' },
      to: { path: '^src/infrastructure/' },
    },
    {
      name: 'gateways-no-infrastructure-except-db-schema',
      severity: 'error',
      comment:
        'a gateway may read the Drizzle table shape (infrastructure/db/schema.ts) to map rows, but never a live client, config, or the DI container',
      from: { path: '^src/adapters/gateways' },
      to: { path: '^src/infrastructure/', pathNot: '^src/infrastructure/db/schema\\.ts$' },
    },
    {
      name: 'adapters-no-next',
      severity: 'error',
      comment: 'Next.js is a framework concern that belongs to src/app, not adapters',
      from: { path: '^src/adapters' },
      to: { path: 'node_modules/next' },
    },
    {
      name: 'infrastructure-no-app',
      severity: 'error',
      comment: 'infrastructure is the composition root; it is used BY app, never depends on it',
      from: { path: '^src/infrastructure' },
      to: { path: '^src/app/' },
    },
    {
      name: 'app-no-domain',
      severity: 'error',
      comment: 'app/ never imports entities or value objects directly',
      from: { path: '^src/app/' },
      to: { path: '^src/domain/' },
    },
    {
      name: 'app-no-application',
      severity: 'error',
      comment: 'app/ never imports use cases or ports directly — go through infrastructure/di',
      from: { path: '^src/app/' },
      to: { path: '^src/application/' },
    },
    {
      name: 'app-no-controllers-or-gateways',
      severity: 'error',
      comment: 'app/ may only reach adapters for ViewModel types (presenters), never controllers or gateways',
      from: { path: '^src/app/' },
      to: { path: '^src/adapters/(controllers|gateways)/' },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: 'node_modules' },
    // Test files wire real cross-layer collaborators (e.g. an interactor test
    // using the in-memory repository) on purpose — that is what proves the
    // architecture works without a framework. The Dependency Rule governs
    // production source, not test wiring, so *.test.ts is exempt here.
    exclude: { path: '\\.test\\.ts$' },
  },
};

/**
 * Not imported anywhere. This file exists purely to demonstrate that
 * `pnpm lint:arch` catches a Dependency Rule violation.
 *
 * Uncomment the two lines below and run `pnpm lint:arch` — dependency-cruiser
 * fails because `src/app` is forbidden from importing a use case directly;
 * it may only reach the application layer through `infrastructure/di/container`.
 * See docs/architecture.md. (Both lines must be uncommented together, or
 * the unused import gets stripped before dependency-cruiser ever sees it.)
 */

// import { CreateCollectionInteractor } from '@/application/use-cases/collections/create-collection.interactor';
// export const bypassesTheContainer = CreateCollectionInteractor;

export {};

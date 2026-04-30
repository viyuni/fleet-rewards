<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.

<!--VITE PLUS END-->

<!-- PROJECT IMPORTS START -->

# Import Conventions

For imports that cross workspace package boundaries, prefer real package names:

- `@server/admin`, `@server/user`, `@server/shared`
- `@web/admin`, `@web/user`, `@web/ui`
- `@internal/shared`

Use `#...` imports only as TypeScript path aliases for code inside the current project/package, for example local server internals such as `#server/shared/...`.

<!-- PROJECT IMPORTS END -->

<!-- PROJECT SCRIPT START -->

# Project Scripts

## Lint

`vp lint`

## Test

`vpr test`

## Format

`vp fmt`

## Type Check

`vpr typecheck`

## Generate UI Component Metadata

`vpr gen:meta`

This command updates `webs/ui` component metadata: package exports, the component resolver map, and Vue global component types. Run it after adding, removing, or renaming components under `webs/ui/src/components`.

### Check

`vpr check`

This command executes linting, formatting, and type checking.

<!-- PROJECT SCRIPT END -->

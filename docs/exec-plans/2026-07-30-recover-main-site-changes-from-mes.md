# Recover Main-Site Changes From MES

## Goal

Recover the Beimei main-site changes that were committed together with the MES prototype, without merging the MES application or its delivery assets into `main`.

## Context

`MES` is one commit ahead of `main`. Commit `0d00a59` contains both an independent MES prototype and unrelated changes to Beimei process planning, production execution, and component catalog pages.

## Scope

- Restore the affected `src/app/` source files from `MES`.
- Restore the matching Beimei domain, frontend, and product documentation.
- Preserve the hidden layout-switch treatment requested for the main page.
- Keep the process-planning print log visible and interactive.

## Non-goals

- Do not merge `src/mes/`, MES entry files, build scripts, reference documents, or delivery artifacts.
- Do not add the `/mes` route to the main application.
- Do not commit or stage the recovered changes in this task.

## Steps

1. Verify the current `main` worktree and confirm that existing icon edits are contained in the MES source version.
2. Restore the selected Beimei source and documentation files from `MES`.
3. Remove only the MES print-log hiding wrapper while retaining the hidden layout switch.
4. Review the resulting diff for MES-only paths and component catalog synchronization.
5. Run the production build.

## Verification

- `git diff --check`
- Confirm the active Style C toolbar and Component Lab use `FeatureToolIcons`.
- Confirm the layout switch retains `opacity-0`.
- Confirm the print log does not have an `opacity-0 pointer-events-none` wrapper.
- `npm run build`

## Risks

- `BeimeiAssemblyLinePage.tsx` contains several unrelated recovered behaviors in one file; the final diff must be reviewed by feature group.
- Existing untracked MES delivery artifacts must remain untracked and unstaged.

# Rule: Git Pre-commit Staging

When the user attempts to run a `git commit` and it fails due to a pre-commit hook (e.g., `husky`, `lint-staged`, `prettier`, `eslint`), you must follow these steps to resolve the issue:

1. **Fix the Error:** Identify and resolve the syntax, typing, or linting error in the working directory file.
2. **Stage the Fix (CRITICAL):** You MUST run `git add <filepath>` on the modified file immediately after fixing it.
3. **Reason:** Pre-commit hooks typically lint the files in the git staging area (the index). If you do not stage your fix, the commit will continue to fail on the older staged version of the file, causing endless loops of failure.
4. **Notify the User:** Once fixed and staged, notify the user that they can safely re-run their `git commit` command.

# Commit Message Guidelines

This project follows a standardized format for commit messages to make the project history more readable and to facilitate generating changelogs.

## Commit Message Format

Each commit message consists of a **header**, a **body**, and a **footer**. The header has a special format that includes a **type**, a **scope**, and a **subject**:

```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

The **header** is mandatory and the **scope** of the header is optional.

Any line of the commit message cannot be longer than 60 characters.
This allows the message to be easier to read on GitHub as well as in various Git tools.

### Type

Must be one of the following:

* **feat**: A new feature
* **fix**: A bug fix
* **docs**: Documentation only changes
* **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* **refactor**: A code change that neither fixes a bug nor adds a feature
* **perf**: A code change that improves performance
* **test**: Adding missing tests or correcting existing tests
* **build**: Changes that affect the build system or external dependencies
* **ci**: Changes to our CI configuration files and scripts
* **chore**: Other changes that don't modify src or test files
* **revert**: Reverts a previous commit

### Scope

The scope should be the name of the module affected (folder name or other meaningful qualifier).

### Subject

The subject contains a succinct description of the change:

* use the imperative, present tense: "change" not "changed" nor "changes"
* don't capitalize the first letter
* no period (.) at the end

### Body

The body should include the motivation for the change and contrast this with previous behavior.

### Footer

The footer should contain any information about **Breaking Changes** and is also the place to reference GitHub issues that this commit **Closes**.

**Breaking Changes** should start with the word `BREAKING CHANGE:` with a space or two newlines. The rest of the commit message is then used for this.

## Examples

```
feat(expense): add ability to tag expenses

Implemented tag selection when adding expenses.
Tags are stored with each expense and can be used
for filtering and reporting.

Closes #123
```

```
fix(ui): resolve expense list scroll issue

The list would freeze when scrolling through many items.
This was due to a memory leak in the scroll handler.

Fixes #456
```

```
docs(readme): update install guide for macOS

Updated README with steps for setting up the dev
environment on macOS, including prerequisites.
```

```
refactor(api): convert expense API to async/await

Changed expense API to use async/await instead of
Promises for better readability & error handling.
```

```
BREAKING CHANGE: change format of expense data

The expense data format has changed to include tags.
Existing apps will need to migrate their data.

Migration guide: docs/migrations/expenses-v2.md
```

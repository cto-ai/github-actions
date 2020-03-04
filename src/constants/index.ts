export const REPO_OWNER_REGEX = /(?<=github\.com(\/|:))[a-z0-9A-Z-]+/g
export const REPO_NAME_REGEX = /(?<=github\.com(\/|:)[a-z0-9A-Z-]+\/)[a-z0-9A-Z-]+/g
export const EDIT_NAME = 'Edit a workflow name'
export const EDIT_TRIGGER = 'Edit a workflow trigger'
export const RUN_STR = 'Check workflow runs'
export const RERUN_STR = 'Re-run a workflow run'
export const SECRET_STR = 'Manage Secrets'
export const SECRET_LIST_STR = 'List all secrets'
export const SECRET_ADD_STR = 'Add or update a secret'
export const SECRET_DELETE_STR = 'Delete a secret'
export const REPO_CHANGE_STR = 'Change Working Repo'
export const EXIT_STR = 'Exit'
// There are many more triggers for workflows.
// https://help.github.com/en/actions/automating-your-workflow-with-github-actions/events-that-trigger-workflows
// NOTE: There are also many subchoices under these triggers, keep it simple for POC
export const TRIGGERS = ['push', 'pull_request', 'fork', 'issues']
export const ACTIONS = [
  'Edit a workflow name',
  'Edit a workflow trigger',
  'Check workflow runs',
  'Re-run a workflow run',
  'Manage Secrets',
  'Change Working Repo',
  'Exit',
]
export const SECRET_ACTIONS = [
  'List all secrets',
  'Add or update a secret',
  'Delete a secret',
]
export const ERROR_TAGS = ['track', 'slack-op-demo', 'github-actions', 'error']
export const SUCCESS_TAGS = [
  'track',
  'slack-op-demo',
  'github-actions',
  'success',
]
export const SLACK_CHARACTER_LIMIT = 3000

import Github from '@octokit/rest'
import axios from 'axios'
import { ux } from '@cto.ai/sdk'
import { readFileSync } from 'fs'
import { pExec, encryptSecret } from '../utils/helpers'
import { RepoName, WorkflowRun } from '../types/common'
import { handleError } from '../utils/handlers'
import { SLACK_CHARACTER_LIMIT } from '../constants'

export const validateGithubToken = async (github: Github): Promise<string> => {
  try {
    const { data } = await github.users.getAuthenticated()
    return data.login
  } catch (err) {
    return await handleError('❗️  Invalid access token entered!', err)
  }
}

// List commands use paginate to retrieve all available results
export const listRepoWorkflows = async (
  github: Github,
  { owner, repo }: RepoName,
): Promise<Github.ActionsListRepoWorkflowsResponseWorkflowsItem[]> => {
  try {
    const data = await github.paginate(
      `GET /repos/${owner}/${repo}/actions/workflows`,
    )
    const mappedData: Github.ActionsListRepoWorkflowsResponseWorkflowsItem[][] = data.map(
      dataSet => dataSet.workflows,
    )
    const workflows = mappedData.reduce((acc, cur) => acc.concat(cur))
    return workflows
  } catch (err) {
    return await handleError('❗️  Failed to list repo workflows', err)
  }
}

export const listRepoWorkflowRuns = async (
  github: Github,
  { owner, repo }: RepoName,
): Promise<WorkflowRun[]> => {
  try {
    const data = await github.paginate(
      `GET /repos/${owner}/${repo}/actions/runs`,
      {},
    )
    const mappedData: Github.ActionsListRepoWorkflowRunsResponseWorkflowRunsItem[][] = data.map(
      dataSet => dataSet.workflow_runs,
    )
    const workflowRuns = mappedData.reduce((acc, cur) => acc.concat(cur))
    const formattedWorkflowRuns: WorkflowRun[] = workflowRuns.map(
      workflowRun => {
        const { id, run_number, event, status, conclusion } = workflowRun
        return {
          id,
          run_number,
          event,
          status,
          conclusion,
        }
      },
    )
    return formattedWorkflowRuns.filter(
      workflowRun => workflowRun.conclusion !== null,
    )
  } catch (err) {
    return await handleError('❗️  Failed to list repo workflow runs!', err)
  }
}

export const printWorkflowRunLogs = async (
  githubToken: string,
  username: string,
  repoName: RepoName,
  workflowID: number,
): Promise<void> => {
  try {
    const { owner, repo } = repoName
    // Saves the log.zip into CWD inside container
    await pExec(
      `curl -v -L -u ${username}:${githubToken} -o logs.zip "https://api.github.com/repos/${owner}/${repo}/actions/runs/${workflowID}/logs"`,
    )
    await pExec('unzip logs.zip')
    await process.chdir('build')
    const { stdout } = await pExec('ls')
    const logFiles = stdout.split('\n').filter(line => line !== '')
    // Prints out logs with character limit for slack
    for (const logName of logFiles) {
      let log = readFileSync(logName, 'utf-8')
      await ux.print(logName)
      while (log.length > SLACK_CHARACTER_LIMIT) {
        const validLog = log.substring(0, SLACK_CHARACTER_LIMIT - 1)
        const cutoffIndex = validLog.lastIndexOf('\n')
        await ux.print(log.substring(0, cutoffIndex))
        log = log.substring(cutoffIndex)
      }
      await ux.print(log)
    }
  } catch (err) {
    return await handleError('❗️  Failed to get workflow run logs!', err)
  }
}

export const rerunWorkflow = async (
  github: Github,
  repoName: RepoName,
  workflowID: number,
): Promise<void> => {
  try {
    await github.actions.reRunWorkflow({ ...repoName, run_id: workflowID })
  } catch (err) {
    return await handleError('❗️  Failed to re-run chosen workflow', err)
  }
}

// Secrets are capped at 100 per repo, so doesn't need to be paginated
export const listRepoSecrets = async (
  github: Github,
  repoName: RepoName,
): Promise<Github.ActionsListSecretsForRepoResponseItemSecretsItem[]> => {
  try {
    const { data } = await github.actions.listSecretsForRepo({
      ...repoName,
      per_page: 100,
    })
    const secrets: Github.ActionsListSecretsForRepoResponseItemSecretsItem[] =
      //@ts-ignore here because octokit return typing here is incorrect
      data.secrets
    return secrets
  } catch (err) {
    return await handleError('❗️  Failed to list repo secrets', err)
  }
}

const getPublicKey = async (
  github: Github,
  repoName: RepoName,
): Promise<Github.ActionsGetPublicKeyResponse> => {
  try {
    const { data } = await github.actions.getPublicKey(repoName)
    return data
  } catch (error) {
    return await handleError('❗️  Failed to retrieve public key!', error)
  }
}

export const addSecret = async (
  github: Github,
  githubToken: string,
  repoName: RepoName,
  secretName: string,
  secretValue: string,
): Promise<void> => {
  try {
    const { owner, repo } = repoName
    const { key, key_id } = await getPublicKey(github, repoName)
    const encrypted = encryptSecret(secretValue, key)
    // Using axios here instead of octokit because the octokit implementation of this endpoint is incorrect. The API accepts key_id as a string instead of a number
    // There is the v.17 of Octokit released recently. Perhaps a fix will be included
    await axios.put(
      `https://api.github.com/repos/${owner}/${repo}/actions/secrets/${secretName}`,
      {
        encrypted_value: encrypted,
        key_id,
      },
      { headers: { authorization: `token ${githubToken}` } },
    )
  } catch (error) {
    return await handleError('❗️  Failed to add a secret', error)
  }
}

export const removeSecret = async (
  github: Github,
  repoName: RepoName,
  secretName: string,
): Promise<void> => {
  try {
    await github.actions.deleteSecretFromRepo({
      ...repoName,
      name: secretName,
    })
  } catch (error) {
    return await handleError(
      `❗️  Failed to remove secret ${secretName} from repo!`,
      error,
    )
  }
}

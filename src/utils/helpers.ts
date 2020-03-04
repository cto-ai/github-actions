import * as yaml from 'js-yaml'
import Github from '@octokit/rest'
import simpleGit from 'simple-git/promise'
import * as sodium from 'tweetsodium'
import { ux, sdk } from '@cto.ai/sdk'
import { createTokenAuth } from '@octokit/auth'
import { promisify } from 'util'
import { readFileSync, writeFileSync } from 'fs'
import { exec } from 'child_process'
import { REPO_OWNER_REGEX, REPO_NAME_REGEX } from '../constants'
import {
  listRepoWorkflows,
  listRepoWorkflowRuns,
  validateGithubToken,
} from '../requests/github'
import { getTriggers } from '../prompts/triggers'
import {
  RepoName,
  GitSetup,
  WorkflowYAML,
  WorkflowRun,
  Repo,
} from '../types/common'
import {
  getGitUser,
  getGitEmail,
  getChosenWorkflow,
  getNewName,
  getChosenWorkflowRun,
} from '../prompts/setup'
import { handleError } from './handlers'
import { AnsGithubToken } from '../types/answers'

export const pExec = promisify(exec)

const cto_terminal = `
      [94m██████[39m[33m╗[39m [94m████████[39m[33m╗[39m  [94m██████[39m[33m╗ [39m      [94m█████[39m[33m╗[39m  [94m██[39m[33m╗[39m
     [94m██[39m[33m╔════╝[39m [33m╚══[39m[94m██[39m[33m╔══╝[39m [94m██[39m[33m╔═══[39m[94m██[39m[33m╗[39m     [94m██[39m[33m╔══[39m[94m██[39m[33m╗[39m [94m██[39m[33m║[39m
     [94m██[39m[33m║     [39m [94m   ██[39m[33m║   [39m [94m██[39m[33m║[39m[94m   ██[39m[33m║[39m     [94m███████[39m[33m║[39m [94m██[39m[33m║[39m
     [94m██[39m[33m║     [39m [94m   ██[39m[33m║   [39m [94m██[39m[33m║[39m[94m   ██[39m[33m║[39m     [94m██[39m[33m╔══[39m[94m██[39m[33m║[39m [94m██[39m[33m║[39m
     [33m╚[39m[94m██████[39m[33m╗[39m [94m   ██[39m[33m║   [39m [33m╚[39m[94m██████[39m[33m╔╝[39m [94m██[39m[33m╗[39m [94m██[39m[33m║[39m[94m  ██[39m[33m║[39m [94m██[39m[33m║[39m
     [33m ╚═════╝[39m [33m   ╚═╝   [39m [33m ╚═════╝ [39m [33m╚═╝[39m [33m╚═╝  ╚═╝[39m [33m╚═╝[39m
 We’re building the world’s best developer experiences.
 `

const cto_slack = `:white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square:
:white_square::white_square::black_square::black_square::white_square::white_square::black_square::black_square::black_square::white_square::white_square::white_square::black_square::black_square::black_square::white_square:
:white_square::black_square::white_square::white_square::black_square::white_square::black_square::white_square::white_square::black_square::white_square::black_square::white_square::white_square::white_square::white_square:
:white_square::black_square::white_square::white_square::black_square::white_square::black_square::black_square::black_square::white_square::white_square::white_square::black_square::black_square::white_square::white_square:
:white_square::black_square::white_square::white_square::black_square::white_square::black_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::black_square::white_square:
:white_square::white_square::black_square::black_square::white_square::white_square::black_square::white_square::white_square::white_square::white_square::black_square::black_square::black_square::white_square::white_square:
:white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square::white_square:`

const getLogo = () => {
  const environment = process.env.SDK_INTERFACE_TYPE

  return environment === 'terminal' ? cto_terminal : cto_slack
}

export const showPreRunMessage = async () => {
  const logo = getLogo()
  await ux.print(logo)
  await ux.print(
    `\n🚀  ${ux.colors.bgRed('CTO.ai - GitHub Actions Manager')} 🙌\n`,
  )
}

export const getRepoName = async (url: string): Promise<RepoName> => {
  const ownerMatch = url.match(REPO_OWNER_REGEX)
  const repoMatch = url.match(REPO_NAME_REGEX)
  if (!ownerMatch || !repoMatch) {
    await ux.print('❗️  Failed to parse repo URL!')
    throw new Error('Invalid repo URL entered.')
  }
  return { owner: ownerMatch[0], repo: repoMatch[0] }
}

export const setupGit = async (): Promise<GitSetup> => {
  await ux.print('🔐  Please configure credentials and configuration')
  const { GITHUB_TOKEN }: AnsGithubToken = await sdk.getSecret('GITHUB_TOKEN')
  const github = new Github({
    authStrategy: createTokenAuth,
    auth: GITHUB_TOKEN,
  })
  const username = await validateGithubToken(github)
  return { GITHUB_TOKEN, github, username }
}

export const setupRepo = async (
  github: Github,
  githubToken: string,
  repoName: RepoName,
): Promise<Repo> => {
  await ux.print('⚙️  Setting up the environment')
  const gitUser = await getGitUser()
  const gitEmail = await getGitEmail()
  const remote = `https://${githubToken}@github.com/${repoName.owner}/${repoName.repo}.git`
  await pExec(`git clone ${remote} repo`)
  await process.chdir('repo')
  const git = simpleGit()
  await git.addConfig('user.name', gitUser)
  await git.addConfig('user.email', gitEmail)
  await ux.print('🚀  Finished setting up environment')
  await git.remote(['set-url', 'origin', remote])
  const workflows = await listRepoWorkflows(github, repoName)
  if (!workflows.length) {
    await ux.print('🤔  There no workflows to manage for this repo!')
    return process.exit(1)
  }
  const formattedWorkflows = workflows.map(workflow => workflow.path)
  const chosenWorkflow = await getChosenWorkflow(formattedWorkflows)
  await ux.print(`⚙️  Reading chosen workflow: ${chosenWorkflow}`)
  const rawYAML = readFileSync(chosenWorkflow, 'utf-8')
  const loadedYAML: WorkflowYAML = yaml.safeLoad(rawYAML)
  return { git, loadedYAML, chosenWorkflow }
}

export const getAndEditName = async (
  loadedYAML: WorkflowYAML,
  workflowPath: string,
): Promise<string> => {
  const newName = await getNewName()
  loadedYAML.name = newName
  writeFileSync(`./${workflowPath}`, yaml.safeDump(loadedYAML))
  return newName
}

export const getAndEditTriggers = async (
  loadedYAML: WorkflowYAML,
  workflowPath: string,
): Promise<string[]> => {
  const newTriggers = await getTriggers()
  loadedYAML.on = newTriggers
  writeFileSync(`./${workflowPath}`, yaml.safeDump(loadedYAML))
  return newTriggers
}

export const getWorkflowRun = async (
  github: Github,
  repoName: RepoName,
): Promise<WorkflowRun> => {
  const workflowRuns = await listRepoWorkflowRuns(github, repoName)
  if (!workflowRuns.length) {
    await handleError(
      '🤷‍♂️  There are no workflow runs for this repo!',
      new Error('No workflow runs'),
    )
  }
  const formattedWorkflowRuns = workflowRuns.map(
    workflowRun =>
      `Workflow Run ID: ${workflowRun.id} - Run Number: ${workflowRun.run_number} - Triggering Event: ${workflowRun.event}`,
  )
  const chosenWorkflowRun = await getChosenWorkflowRun(formattedWorkflowRuns)
  const filteredWorkflowRun = workflowRuns.filter(workflowRun =>
    chosenWorkflowRun.includes(workflowRun.id.toString()),
  )
  return filteredWorkflowRun[0]
}

export const getCancelledWorkflowRuns = async (
  github: Github,
  repoName: RepoName,
): Promise<WorkflowRun> => {
  const workflowRuns = await listRepoWorkflowRuns(github, repoName)
  if (!workflowRuns.length) {
    await handleError(
      '🤷‍♂️  There are no workflow runs for this repo!',
      new Error('No workflow runs'),
    )
  }
  const cancelledWorkflowRuns = workflowRuns.filter(
    workflowRun => workflowRun.conclusion === 'cancelled',
  )

  const formattedWorkflowRuns = cancelledWorkflowRuns.map(
    workflowRun =>
      `Workflow Run ID: ${workflowRun.id} - Run Number: ${workflowRun.run_number} - Triggering Event: ${workflowRun.event}`,
  )
  const chosenWorkflowRun = await getChosenWorkflowRun(formattedWorkflowRuns)
  const filteredWorkflowRun = cancelledWorkflowRuns.filter(workflowRun =>
    chosenWorkflowRun.includes(workflowRun.id.toString()),
  )
  return filteredWorkflowRun[0]
}

export const commitAndPushChanges = async (
  git: simpleGit.SimpleGit,
  commitMsg: string,
): Promise<void> => {
  try {
    await git.pull('origin', 'master')
    await git.add('.')
    await git.commit(commitMsg)
    await git.push('origin', 'master')
  } catch (err) {
    return await handleError(
      '😓  Failed to commit and push workflow changes',
      err,
    )
  }
}

export const encryptSecret = (message: string, publicKey: string): string => {
  const messageBytes = Buffer.from(message)
  const keyBytes = Buffer.from(publicKey, 'base64')

  const encryptedBytes = sodium.seal(messageBytes, keyBytes)
  const encrypted = Buffer.from(encryptedBytes).toString('base64')
  return encrypted
}

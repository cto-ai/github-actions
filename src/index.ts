import {
  showPreRunMessage,
  setupGit,
  setupRepo,
  commitAndPushChanges,
  getRepoName,
  getAndEditName,
  getAndEditTriggers,
  getWorkflowRun,
  getCancelledWorkflowRuns,
} from './utils/helpers'
import {
  rerunWorkflow,
  printWorkflowRunLogs,
  listRepoSecrets,
  addSecret,
  removeSecret,
} from './requests/github'
import {
  EDIT_NAME,
  EDIT_TRIGGER,
  RUN_STR,
  RERUN_STR,
  SECRET_STR,
  SECRET_ADD_STR,
  SECRET_DELETE_STR,
  SECRET_LIST_STR,
  REPO_CHANGE_STR,
  EXIT_STR,
} from './constants'
import { getRepoURL, getAction } from './prompts/general'
import { handleSuccess, handleError } from './utils/handlers'
import { ux } from '@cto.ai/sdk'
import { RepoName, GitSetup } from './types/common'
import {
  getSecretAction,
  getSecretName,
  getSecretValue,
  getSecretToDelete,
  confirmDeleteSecret,
} from './prompts/secrets'

const execAction = async (
  { github, GITHUB_TOKEN, username }: GitSetup,
  repoName: RepoName,
  repoURL: string,
  action: string,
): Promise<boolean> => {
  switch (action) {
    case EDIT_NAME: {
      const { git, loadedYAML, chosenWorkflow } = await setupRepo(
        github,
        GITHUB_TOKEN,
        repoName,
      )
      const newName = await getAndEditName(loadedYAML, chosenWorkflow)
      await commitAndPushChanges(git, 'Update workflow name')
      return await handleSuccess(
        `✅  Successfully updated workflow ${chosenWorkflow}'s name to ${newName}`,
        { editedWorkflow: chosenWorkflow, repo: repoName },
        true,
      )
    }
    case EDIT_TRIGGER: {
      const { git, loadedYAML, chosenWorkflow } = await setupRepo(
        github,
        GITHUB_TOKEN,
        repoName,
      )
      const newTriggers = await getAndEditTriggers(loadedYAML, chosenWorkflow)
      await commitAndPushChanges(git, 'Update workflow trigger')
      return await handleSuccess(
        `✅  Successfully updated workflow ${chosenWorkflow}'s trigger event`,
        { editedWorkflow: chosenWorkflow, repo: repoName, newTriggers },
        true,
      )
    }
    case RUN_STR: {
      const workflowRun = await getWorkflowRun(github, repoName)
      await printWorkflowRunLogs(
        GITHUB_TOKEN,
        username,
        repoName,
        workflowRun.id,
      )
      return await handleSuccess(
        '✅  Successfully retrieved and outputted logs from workflow run!',
        { repo: repoName, workflowRunID: workflowRun.id },
        true,
      )
    }
    case RERUN_STR: {
      const workflowRun = await getCancelledWorkflowRuns(github, repoName)
      await rerunWorkflow(github, repoName, workflowRun.id)
      return await handleSuccess(
        '✅  Successfully re-ran workflow run',
        {
          repo: repoName,
          workflowRunID: workflowRun.id,
        },
        true,
      )
    }
    case SECRET_STR: {
      const secretAction = await getSecretAction()
      if (secretAction === SECRET_LIST_STR) {
        const secrets = await listRepoSecrets(github, repoName)
        for (const secret of secrets) {
          const createdTimestamp = new Date(secret.created_at).toUTCString()
          const updatedTimestamp = new Date(secret.updated_at).toUTCString()
          await ux.print(
            `${secret.name} -  Created on: ${createdTimestamp} - Updated on: ${updatedTimestamp}`,
          )
        }
        return await handleSuccess(
          `✅  Successfully logged registered secrets for repo!`,
          {},
          true,
        )
      }
      if (secretAction === SECRET_ADD_STR) {
        const secretName = await getSecretName()
        const secretValue = await getSecretValue(secretName)
        await ux.print('⚙️  Adding secret to the repo!')
        await addSecret(github, GITHUB_TOKEN, repoName, secretName, secretValue)
        return await handleSuccess(
          `✅  Secret ${secretName} has been added to the repo!`,
          {},
          true,
        )
      }
      if (secretAction === SECRET_DELETE_STR) {
        const secrets = await listRepoSecrets(github, repoName)
        const chosenSecret = await getSecretToDelete(secrets)
        const confirmDelete = await confirmDeleteSecret(chosenSecret)
        if (confirmDelete) {
          await removeSecret(github, repoName, chosenSecret)
          return await handleSuccess(
            `🔥  ${chosenSecret} has been removed from the repo`,
            {},
            true,
          )
        }
        return await handleSuccess(
          `⬜  ${chosenSecret} was not removed from repo!`,
          {},
          true,
        )
      }
    }
    case REPO_CHANGE_STR: {
      repoURL = await getRepoURL()
      repoName = await getRepoName(repoURL)
      const newAction = await getAction()
      return await execAction(
        { github, GITHUB_TOKEN, username },
        repoName,
        repoURL,
        newAction,
      )
    }
    case EXIT_STR: {
      return await handleSuccess(
        '👋  Exiting the Op. Thanks for using CTO.ai GitHub Actions Op.',
        {},
        false,
      )
    }
    default: {
      return await handleError(
        '❗️  Failed to run Op!',
        new Error('Invalid action chosen!'),
      )
    }
  }
}

const main = async () => {
  try {
    await showPreRunMessage()
    const git = await setupGit()
    let repoURL = await getRepoURL()
    let repoName = await getRepoName(repoURL)
    let shouldContinue = true
    while (shouldContinue) {
      const action = await getAction()
      shouldContinue = await execAction(git, repoName, repoURL, action)
    }
    await ux.print(
      '👋  Exiting the Op. Thanks for using CTO.ai GitHub Actions Op.',
    )
  } catch (err) {
    return await handleError('❗️  Failed to run Op!', err)
  }
}

main()

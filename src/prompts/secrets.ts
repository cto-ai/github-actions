import Github from '@octokit/rest'
import { ux, Question } from '@cto.ai/sdk'
import { SECRET_ACTIONS } from '../constants'
import {
  AnsSecretAction,
  AnsSecretName,
  AnsSecretValue,
  AnsSecretDelete,
  AnsSecretDeleteConfirm,
} from '../types/answers'

const secretActionPrompt: Question = {
  type: 'list',
  name: 'secretAction',
  message: 'What would you like to do for secrets',
  choices: SECRET_ACTIONS,
}

export const getSecretAction = async () => {
  const { secretAction } = await ux.prompt<AnsSecretAction>(secretActionPrompt)
  return secretAction
}

const secretNamePrompt: Question = {
  type: 'input',
  name: 'secretName',
  message: 'Please enter a name for the secret',
}

export const getSecretName = async () => {
  const { secretName } = await ux.prompt<AnsSecretName>(secretNamePrompt)
  return secretName
}

export const getSecretValue = async secretName => {
  const { secretValue } = await ux.prompt<AnsSecretValue>({
    type: 'secret',
    name: 'secretValue',
    message: `Please enter a value for secret ${secretName}`,
  })
  return secretValue
}

export const getSecretToDelete = async (
  secrets: Github.ActionsListSecretsForRepoResponseItemSecretsItem[]
) => {
  const { chosenSecret } = await ux.prompt<AnsSecretDelete>({
    type: 'autocomplete',
    name: 'chosenSecret',
    message: 'Please select a secret you wish to delete',
    choices: secrets.map(secret => secret.name),
  })
  return chosenSecret
}

export const confirmDeleteSecret = async (chosenSecret: string) => {
  const { confirmDelete } = await ux.prompt<AnsSecretDeleteConfirm>({
    type: 'confirm',
    name: 'confirmDelete',
    message: `🗑️  Please confirm that you would like to remove ${chosenSecret} from the repo`,
  })
  return confirmDelete
}

import { ux, Question } from '@cto.ai/sdk'
import {
  AnsGitUser,
  AnsGitEmail,
  AnsChosenWorkflow,
  AnsNewName,
  AnsChosenWorkflowRun,
} from '../types/answers'

const gitUserPrompt: Question = {
  type: 'input',
  name: 'gitUser',
  message: 'Please enter your name for Git',
}

export const getGitUser = async (): Promise<string> => {
  const { gitUser } = await ux.prompt<AnsGitUser>(gitUserPrompt)
  return gitUser
}

const gitEmailPrompt: Question = {
  type: 'input',
  name: 'gitEmail',
  message: 'Please enter your email for Git',
}

export const getGitEmail = async (): Promise<string> => {
  const { gitEmail } = await ux.prompt<AnsGitEmail>(gitEmailPrompt)
  return gitEmail
}

export const getChosenWorkflow = async (
  workflows: string[]
): Promise<string> => {
  const { chosenWorkflow } = await ux.prompt<AnsChosenWorkflow>({
    type: 'list',
    name: 'chosenWorkflow',
    message: 'Please select a workflow to manage',
    choices: workflows,
  })
  return chosenWorkflow
}

const newNamePrompt: Question = {
  type: 'input',
  name: 'newName',
  message: 'Please enter a new name for your workflow',
}

export const getNewName = async (): Promise<string> => {
  const { newName } = await ux.prompt<AnsNewName>(newNamePrompt)
  return newName
}

export const getChosenWorkflowRun = async (
  workflowRuns: string[]
): Promise<string> => {
  const { chosenWorkflowRun } = await ux.prompt<AnsChosenWorkflowRun>({
    type: 'autocomplete',
    name: 'chosenWorkflowRun',
    message: 'Please choose a workflow run to manage',
    choices: workflowRuns,
  })
  return chosenWorkflowRun
}

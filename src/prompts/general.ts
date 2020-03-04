import { sdk, ux, Question } from '@cto.ai/sdk'
import { AnsRepoURL, AnsAction } from '../types/answers'
import { ACTIONS } from '../constants'

export const getRepoURL = async (): Promise<string> => {
  const { repoURL }: AnsRepoURL = await sdk.getSecret('repoURL')
  return repoURL
}

const actionsPrompt: Question = {
  type: 'list',
  name: 'action',
  message: 'What would you like to do for this repository',
  choices: ACTIONS,
}

export const getAction = async (): Promise<string> => {
  const { action } = await ux.prompt<AnsAction>(actionsPrompt)
  return action
}

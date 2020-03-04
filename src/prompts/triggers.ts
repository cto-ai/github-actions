import { ux, Question } from '@cto.ai/sdk'
import { AnsChosenTriggers } from '../types/answers'
import { TRIGGERS } from '../constants'

const triggersPrompt: Question = {
  type: 'checkbox',
  name: 'chosenTriggers',
  message: 'Please choose the new event trigger(s) for this workflow',
  choices: TRIGGERS,
}

export const getTriggers = async () => {
  let { chosenTriggers } = await ux.prompt<AnsChosenTriggers>(triggersPrompt)
  while (!chosenTriggers.length) {
    await ux.print('🤔  You must choose an event trigger for a workflow!')
    const newTriggers = await ux.prompt<AnsChosenTriggers>(triggersPrompt)
    chosenTriggers = newTriggers.chosenTriggers
  }
  return chosenTriggers
}

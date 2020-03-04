import { sdk, ux } from '@cto.ai/sdk'
import { SUCCESS_TAGS, ERROR_TAGS } from '../constants'

export const handleError = async (eventStr: string, err: Error) => {
  await sdk.track(ERROR_TAGS, {
    event: `GitHub Actions Op Error - ${eventStr}`,
    err,
  })
  await ux.print(eventStr)
  process.exit(1)
}

export const handleSuccess = async (
  successMsg: string,
  trackingMetadata,
  shouldContinue: boolean
): Promise<boolean> => {
  await sdk.track(SUCCESS_TAGS, {
    event: `GitHub Actions Op Success - ${successMsg}`,
    ...trackingMetadata,
  })
  if (shouldContinue) {
    await ux.print(successMsg)
    const { exit } = await ux.prompt({
      type: 'confirm',
      name: 'exit',
      message: `Do you want to perform another action?\nChoosing 'N' will exit the Op!`,
    })
    return exit
  }
  return false
}

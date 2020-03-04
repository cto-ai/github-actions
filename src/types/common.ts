import Github from '@octokit/rest'
import simpleGit from 'simple-git/promise'

export type RepoName = {
  owner: string
  repo: string
}

export type GitSetup = {
  GITHUB_TOKEN: string
  github: Github
  username: string
}

export type WorkflowYAML = {
  name: string
  on: any
  jobs: {
    build: {
      'runs-on': string
      steps: Object[]
    }
  }
}

export type WorkflowRun = {
  id: number
  run_number: number
  event: string
  status: string
  conclusion: null
}

export type Repo = {
  git: simpleGit.SimpleGit
  loadedYAML: WorkflowYAML
  chosenWorkflow: string
}

import { ux } from '@cto.ai/sdk'
import sinon from 'sinon'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {
  getRepoName,
  getAndEditName,
  getAndEditTriggers,
} from '../utils/helpers'
import { WorkflowYAML } from '../types/common'
import { TRIGGERS } from '../constants'

chai.use(chaiAsPromised)

const sandbox = sinon.createSandbox()

describe('Unit testing helper functions', () => {
  let print, prompt
  before(() => {
    print = sandbox.stub(ux, 'print')
    prompt = sandbox
      .stub(ux, 'prompt')
      .withArgs({
        type: 'input',
        name: 'newName',
        message: 'Please enter a new name for your workflow',
      })
      .returns(
        Promise.resolve({
          newName: 'foo',
        }),
      )
      .withArgs({
        type: 'checkbox',
        name: 'chosenTriggers',
        message: 'Please choose the new event trigger(s) for this workflow',
        choices: TRIGGERS,
      })
      .returns(Promise.resolve({ chosenTriggers: ['bar'] }))
  })
  after(() => {
    sandbox.restore()
  })
  afterEach(() => {
    sandbox.resetHistory()
  })

  it('getRepoName should return proper owner/repo from GitHub URL', async () => {
    const testURL = 'https://github.com/tw5033/test'
    const { owner, repo } = await getRepoName(testURL)
    chai.expect(owner).to.equal('tw5033')
    chai.expect(repo).to.equal('test')
  })
  it('getRepoName should throw error if given a malformed gitURL', async () => {
    const testURL = 'https://test.com/test'
    return chai
      .expect(getRepoName(testURL))
      .to.eventually.be.rejectedWith('Invalid repo URL entered')
  })
  it('getAndEditName should prompt for name, change YAML property and return name', async () => {
    const testYAML: WorkflowYAML = {
      name: 'test',
      on: 'test',
      jobs: {
        build: {
          'runs-on': 'any',
          steps: [{}],
        },
      },
    }
    const workflowPath = './test'
    const newName = await getAndEditName(testYAML, workflowPath)
    chai.expect(testYAML.name).to.deep.equal('foo')
    chai.expect(newName).to.deep.equal('foo')
  })
  it('getAndEditTriggers should prompt for new triggers, change YAML property and return triggers', async () => {
    const testYAML: WorkflowYAML = {
      name: 'test',
      on: 'test',
      jobs: {
        build: {
          'runs-on': 'any',
          steps: [{}],
        },
      },
    }
    const workflowPath = './test'
    const newTriggers = await getAndEditTriggers(testYAML, workflowPath)
    sandbox.assert.calledOnce(prompt)
    chai.expect(testYAML.on).to.deep.equal(['bar'])
    chai.expect(newTriggers).to.deep.equal(['bar'])
  })
})

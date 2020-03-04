![CTO Banner](https://raw.githubusercontent.com/cto-ai/aws/master/assets/banner.png)

# GitHub Actions Manager

The GitHub Actions Op utilizes Git and GitHub to manage GitHub Actions from the commmand line.

## Requirements

To run this or any other Op, install the [Ops Platform](https://cto.ai/platform).

Find information about how to run and build Ops via the [Ops Platform Documentation](https://cto.ai/docs/overview)

This Op also requires API Key for GitHub and an URL of a GitHub repository that has GitHub Actions already configured.

- To create one, refer to the instructions [here](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line)
- Set GitHub Access Token to `GITHUB_TOKEN` in team secrets by running `ops secrets:set`
- Once you have registered your GitHub personal access token in secrets, the Op will automatically fetch the key from your team's secret storage!

You would also require a GitHub repository that has a GitHub action workflow already set up.

For details on how to set up a GitHub action please visit [here](https://help.github.com/en/actions)

## Usage

In CLI:

```sh
ops run @cto.ai/github-actions
```

In Slack:

```sh
/ops run cto.ai/github-actions
```

Running the Op will guide you through a series of prompts to setup and start managing GitHub Actions.

## Features

- Workflow Management
  - Re-name workflows and update workflow triggers
  - Review workflow run logs and re-run cancelled workflow runs
- Secrets Management
  - List and review registered secrets in repository
  - Add and delete secrets for repository
  
## Notes

- The operation to re-run a workflow run is only limited to workflow runs that have a 'cancelled' state
- The maximum number of secrets a repository is able to have is 100. Each secret must be less than 64 KB in size. For storing secrets larger than 64 KB refer to GitHub's documentation here:  [Limits for GitHub Secrets](https://help.github.com/en/actions/configuring-and-managing-workflows/creating-and-storing-encrypted-secrets#limits-for-secrets)
- There are many more trigger events available for workflows. As this Op is a proof of concept, only basic triggers are used. A deeper dive into the available triggers for workflows can be found here: [GitHub Actions Triggers](https://help.github.com/en/actions/reference/events-that-trigger-workflows)

## Testing

Run `npm test`

## Debugging Issues

When submitting issues or requesting help, be sure to also include the version information. To get your ops version run:

```bash
ops -v
```

## Contributing

See the [contributing docs](CONTRIBUTING.md) for more information

## Contributors

<table>
  <tr>
    <td align="center"><a href="https://github.com/tw5033"><img src="https://avatars2.githubusercontent.com/u/16050851?&v=4" width="100px;" alt=""/><br /><sub><b>Timothy Wan</b></sub></a><br/></td>
    <td align="center"><a href="https://github.com/CalHoll"><img src="https://avatars3.githubusercontent.com/u/21090765?&v=4" width="100px;" alt=""/><br /><sub><b>Calvin Holloway</b></sub></a><br/></td>
    <td align="center"><a href="https://github.com/jmariomejiap"><img src="https://avatars1.githubusercontent.com/u/22829270?&v=4" width="100px;" alt=""/><br /><sub><b>Mario Mejia</b></sub></a><br/></td>
  </tr>
</table>

## License

[MIT](LICENSE.txt)
# Development

Thanks for contributing! We love seeing continuous improvements
and enhancements, no matter how small or big they might be.

## How to contribute?

We follow fairly standard but lenient rules around pull requests and issues.
Please pick a title that describes your change briefly, optionally in the imperative
mood if possible.

If you have an idea for a feature or want to fix a bug, consider opening an issue
first. We're also happy to discuss and help you open a PR and get your changes
in!

## How do I set up the project?

Luckily it's not hard to get started. You can install dependencies using yarn.
Please don't use `npm` to respect the lockfile.

```sh
yarn
```

You can then run the build using:

```sh
yarn build
```

And you can run Flow to check for any type errors:

```sh
yarn flow check
```

## How do I test my changes?

It's always good practice to run the tests when making changes.
It might also make sense to add more tests when you're adding features
or fixing a bug, but we'll help you in the pull request, if necessary.

```sh
yarn test            # Single pass
yarn test --watch    # Watched
yarn test --coverage # Single pass coverage report
```

Sometimes it's a good idea to run the Jest in `production` mode,
since some data structures and behaviour changes in React in
`production`:

```sh
NODE_ENV=production yarn test
```

## How do I lint my code?

We ensure consistency in this codebase using `prettier`.
It's run on a `precommit` hook, so if something's off it'll try
to automatically fix up your code, or display an error.

If you have them set up in your editor, even better!

## How do I publish a new version?

If you're a core contributor or maintainer this will certainly come
up once in a while.

Make sure you first create a new version. The following commands
bump the version in the `package.json`, create a commit,
and tag the commit on git:

```sh
yarn version --new-version X
# or
npm version patch # accepts patch|minor|major
```

Then run `npm publish` (npm is recommended here, not yarn)
And maybe run `npm publish --dry-run` first to check the output.

```sh
npm publish
```

There's a `prepublishOnly` hook in place that'll clean and build
the package automatically.

Don't forget to push afterwards:

```sh
git push && git push --tags
```

[This process can be simplified and streamlined by using `np`.](https://github.com/sindresorhus/np)

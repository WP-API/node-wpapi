# Contributing

WordPress is a community effort, as is the WP-API; this client library should be, too. We welcome contributions, however big or small!

This document outlines some of the best practices and conventions used within this project, with links to the libraries and tools we use for testing, syntax checking, and so on.

## Testing

New features in this library should be accompanied by unit tests demonstrating that they work as intended. If you are not familiar with testing in JavaScript, don't let that stop you from submitting a PR&mdash;we'll work with you to get them added, and can help advise on what types of tests will be most appropriate.

Our tests are broken down into a unit test suite, and an integration test suite. When you add a feature, you should ensure that your changes pass all tests in both suites. And if you find a bug, a test demonstrating that bug is just as useful as a patch that actually solves the problem!

The unit tests can be run without any additional setup with `npm run test:unit`, but running more comprehensive tests (e.g. `npm test`, `npm run mocha`, etc.) requires additional work as described below in Integration Tests.

### Integration Tests

In order to run the integration tests you will need to run a specifically-configured local WordPress instance in a virtual machine as described in [wpapi-vagrant-varietal](https://github.com/kadamwhite/wpapi-vagrant-varietal).  Full instructions are provided there, and once that VM is booted and running the integration tests will pass. (You can run the integration suite specifically with the command `npm test:integration`).

### Adding Tests

Adding new code, or submitting a pull request? If it does something, it should have tests! Under the hood we use [Mocha](visionmedia.github.io/mocha/) to run our tests, and write our assertions using [Chai's "expect" BDD syntax](http://chaijs.com/api/bdd/), *e.g.*:
```javascript
expect( wp._options.endpoint ).to.equal( 'http://some.url.com/wp-json/' );
```

**If you are uncomfortable or unfamiliar with writing unit tests, you should feel free to submit a pull request without them!** We'll work with you in the PR comments to walk you through how to test the code.

#### This Function Is Totally Not A Spy

We use [Sinon.js](sinonjs.org/docs/) for [spying on](sinonjs.org/docs/#spies) and [stubbing](http://sinonjs.org/docs/#stubs) functionality. Sinon assertions should also be written with the BDD style, which is enabled via [sinon-chai](https://www.npmjs.org/package/sinon-chai):
```javascript
expect( mockAgent.get ).to.have.been.calledWith( 'url/' );
```
See the [existing test files](https://github.com/wp-api/node-wpapi/tree/master/tests) for more examples.

## Best Practices for Commits

You should always run `npm test` before committing, to identify any syntax, style or unit test errors in your branch.  See "Testing" below for more details about setting up the environment for running the tests.

#### Commit Granularity

A single commit should encompass a single, related set of changes. Work on different features should be addressed in different commit. We do not squash commits when merging pull requests, in order to preserve this granular history.

#### Commit Messages

*Thanks to the [WP-API project](https://github.com/WP-API/WP-API/blob/master/CONTRIBUTING.md) for these examples*

Commit messages should follow the standard laid out in the git manual; that is, a one-line summary, followed by longer explanatory text when necessary.

    Short (50 chars or less) summary of changes

    More detailed explanatory text, if necessary.  Wrap it to about 75
    characters or so.  In some contexts, the first line is treated as the
    subject of an email and the rest of the text as the body.  The blank
    line separating the summary from the body is critical (unless you omit
    the body entirely); tools like rebase can get confused if you run the
    two together.

    Further paragraphs come after blank lines.

    - Bullet points are okay, too

    - Typically a hyphen or asterisk is used for the bullet, preceded by a
      single space, with blank lines in between, but conventions vary

    If the commit relates to an issue -- and most commits should -- you
    can reference the issue with "For #X" or "Fixes #X", where X is the
    number of the github issue.

#### Commit & Pull Request Process

Changes are proposed in the form of [pull requests](https://help.github.com/articles/using-pull-requests) submitted by you, the contributor! After submitting your proposed changes, a member of the library's development team will review your commits and discuss any necessary changes with you in the PR comment thread. Your pull request will then be merged after final review.

We rebase feature branches onto master when merging in order to maintain a linear history, so committers should avoid using the Big Green Button.

## Code Syntax & Style

We use [JSCS](https://www.npmjs.org/package/jscs) to enforce a basic set of code style guidelines, and [JSHint](http://jshint.com/) to guard against syntax errors. To run them both execute `npm run lint`; they will also be run every time you execute `npm test`.

JSCS is a useful tool for enforcing a code style, but isn't flexible enough to cover all guidelines. Note our standard for spacing within function parentheses, which is not enforced mechanically but will be evaluated manually when reviewing pull requests:

```javascript
// Function params and args should be spaced out from the parentheses:
someMethodCall( param1, param2 );
function newFunction( arg1, arg2 ) {};
```

"When in doubt, space it out," with the following exceptions.

```javascript
// The space can be omitted when passing function expressions, object literals
// or array literals as arguments:
someMethodCall(function() {
    // do stuff
});
someOtherMethod({
    object: 'no space before an object literal'
}, 'but this String argument still has a space after it' );
someMethodThatTakesAnArray([
    'no',
    'leading or trailing',
    'spaces needed'
]);
```

We prefer `camelCase` variable and function names, and `UpperCamelCase` constructors. When using the `underscore_case` parameter names that are required by the WordPress API, the following JSHint directive can be used to disable the case enforcement for that particular file:

```javascript
/*jshint -W106 */// Disable underscore_case warnings in this file
```

## Documentation

The README getting started guide & [JSDoc](http://usejsdoc.org/) block comment should be kept up-to-date with featrbenvure development: If you aren't familiar with adding JSDoc comments, we'll help you work through it in the comments of your PR.

The API docs will be updated whenever a new NPM module version is published. No generated files within `documentation/` should be committed in any branch other than gh-pages.

To generate the docs yourself, run `npm run docs`. This task will parse the README into a series of individual markdown files, then run JSDoc to generate the API reference. These files will be consumed by GitHub Pages to render the final public [wp-api.org/node-wpapi](http://wp-api.org/node-wpapi) website.

Preview the generated documentation site locally with `npm run jekyll`. To install Jekyll you will need Ruby (v2.3.x is required due to a dependency issue in 2.4), then run `gem install bundler` and `bundle install` from the `documentation/` directory.

## Branch Naming & Pull Requests

Internally, we try to use the following branch naming scheme to keep things organized:

* **feature/feature-name**: New features & enhancements (optionally, "feature/feature-name-[Github Issue/PR #]")
* **bug/bug-name-[Github Issue #]**: Bug fixes: these should always have a corresponding [GH issue](https://github.com/wp-api/node-wpapi/issues).
* **refactor/feature-name**: Architectural changes, refactoring
* **build/feature-name**: Features relating to the build process, Gruntfile, linting or testing process, NPM package, *etcetera*
* **docs/feature-name**: Documentation, README, contributing guide, fleshing out inline doc blocks; anything in the repository that's authored to be human-readable

It is not essential to maintain this naming structure in your own branches; the important thing is that pull requests *not* be submitted from your master branch.

## Release "Props"

Code is only a small part of the effort that goes into maintaining an open source project. We recognize both code _and_ non-code contributions with release "props," celebrating those who devote time and energy to the `wpapi` package. If you open an issue that highlights a bug, or contribute documentation and user guides, you will receive recognition for your support in the release notes where the associated code or documentation changes appear. Please participate constructively in [issue](https://github.com/wp-api/node-wpapi/issues) discussions, and thank you for your support!

## License

All code contributed to this repository will be licensed under the [MIT license](http://opensource.org/licenses/MIT). Code you contribute should be owned by you, and by submitting a pull request you assert that the Node WordPress REST API client team has the authority to license that code to other people.

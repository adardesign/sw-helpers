const proxyquire = require('proxyquire');
const sinon = require('sinon');
const cliHelper = require('./helpers/cli-test-helper.js');
const errors = require('../src/lib/errors.js');

require('chai').should();

describe('Ask to Save to Config File', function() {
  const globalStubs = [];

  afterEach(function() {
    cliHelper.endLogCapture();
    globalStubs.forEach((stub) => {
      stub.restore();
    });
  });

  const INJECTED_ERROR = new Error('Injected Error');

  const checkError = (cli, expectedErrorCode, checkInjectedError) => {
    return cli._saveConfigFile()
    .then(() => {
      throw new Error('Expected error to be thrown.');
    }, (err) => {
      if (typeof checkInjectedError === 'undefined' ||
        checkInjectedError === true) {
        err.should.equal(INJECTED_ERROR);
      }
    })
    .then(() => {
      const captured = cliHelper.endLogCapture();
      captured.consoleLogs.length.should.equal(0);
      captured.consoleWarns.length.should.equal(0);
      captured.consoleErrors.length.should.not.equal(0);

      let foundErrorMsg = false;
      let foundInjectedErrorMsg = false;
      captured.consoleErrors.forEach((errLog) => {
        if (errLog.indexOf(errors[expectedErrorCode]) !== -1) {
          foundErrorMsg = true;
        }
        if (errLog.indexOf(INJECTED_ERROR.message) !== -1) {
          foundInjectedErrorMsg = true;
        }
      });
      foundErrorMsg.should.equal(true);
      if (typeof checkInjectedError === 'undefined' ||
        checkInjectedError === true) {
        foundInjectedErrorMsg.should.equal(true);
      }
    });
  };

  it('should handle failing inquirer', function() {
    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', () => {
      return Promise.reject(INJECTED_ERROR);
    });

    globalStubs.push(stub);

    const SWCli = proxyquire('../src/cli/index', {
      'inquirer': inquirer,
    });

    cliHelper.startLogCapture();
    const cli = new SWCli();
    return checkError(cli, 'unable-to-get-save-config');
  });

  it('should return correct value', function() {
    const inquirer = require('inquirer');
    const stub = sinon.stub(inquirer, 'prompt', () => {
      return Promise.resolve({
        saveConfig: true,
      });
    });

    globalStubs.push(stub);

    const SWCli = proxyquire('../src/cli/index', {
      'inquirer': inquirer,
    });

    cliHelper.startLogCapture();
    const cli = new SWCli();
    return cli._saveConfigFile()
    .then((save) => {
      (save).should.equal(true);
    });
  });
});

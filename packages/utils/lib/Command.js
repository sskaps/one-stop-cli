'use strict';

const semver = require('semver');
const colors = require('colors/safe');
const log = require('./log');

const LOWEST_NODE_VERSION = '12.0.0';

class Command {
  constructor(argv) {
    // log.verbose('constructor command', argv);
    if (!argv) {
      throw new Error('参数不能为空');
    }
    if (!Array.isArray(argv)) {
      throw new Error('参数必须为数组');
    }
    if (argv.length < 1) {
      throw new Error('参数列表不能为空');
    }
    this._argv = argv;
    let runner = new Promise((resolve, reject) => {
      let chain = Promise.resolve();
      chain = chain.then(() => this.checkNodeVersion());
      chain = chain.then(() => this.initArgs());
      chain = chain.then(() => this.initialize());
      chain = chain.then(() => this.execute());
      chain.catch(e => log.error(e.message));
    });
  }

  initArgs() {
    this._cmd = this._argv[this._argv.length - 1];
    this._argv = this._argv.slice(0, this._argv.length - 1);
  }

  /**
   * 检查node版本
   * */
  checkNodeVersion() {
    log.info('node', process.version.replace('v', ''));
    const currentVersion = process.version;
    const lowestVersion = LOWEST_NODE_VERSION;
    if (!semver.gte(currentVersion, lowestVersion)) {
      throw new Error(colors.red(`zjy-cli needs to install nodejs more than v${lowestVersion}`));
    }
  }

  initialize() {
    throw new Error('initialize() needs to be implemented.');
  }

  execute() {
    throw new Error('execute() needs to be implemented.');
  }
}

module.exports = Command;

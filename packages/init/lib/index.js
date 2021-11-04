'use strict';

const fs = require('fs');
const path = require('path');
const {Command, Package, log, spinnerStart, sleep} = require('@one-stop-cli/utils');
const inquirer = require('inquirer');
const fse = require('fs-extra');
const semver = require('semver');
const userHome = require('user-home');
const getProjectTemplate = require('./getProjectTemplate');

const TYPE_PROJECT = 'project';
const TYPE_COMPONENT = 'component';
const DEFAULT_CLI_HOME = '.one-stop-cli';
const CACHE_DIR = 'template';
const NORMAL_TEMPLATE = 'normal';
const CUSTOM_TEMPLATE = 'custom';

class InitCommand extends Command {
  initialize() {
    this.projectName = this._argv[0] || '';
    this.force = !!this._cmd.force;
    log.verbose('project name', this.projectName);
    log.verbose('force', this.force);
  }

  async execute() {
    try {
      // 1. 准备阶段
      const projectInfo = await this.prepare();
      if (projectInfo) {
        // 2. 下载模板
        log.verbose('project info:', projectInfo);
        this.projectInfo = projectInfo;
        await this.downloadTemplate();
        // 3. 安装模板
        await this.installTemplate();
      }
    } catch (e) {
      log.error(e.message);
    }
  }

  // 下载模板
  async downloadTemplate() {
    // console.log(this.projectInfo, this.template);
    // 1. 通过项目模板API获取项目模板信息
    // 1.1 通过egg.j搭建一套后端系统
    // 1.2 通过npm存储项目模板 (vue-cli/h5)
    // 1.3 将项目模板信息纯粹到mongodb数据库中
    // 1.4 通过egg.js将获取mongodb中的数据并且通过API返回
    const { template } = this.projectInfo;
    const templateInfo = this.template.find(item => item.npmName === template);
    this.templateInfo = templateInfo;
    const { npmName, version } = templateInfo;
    const targetPath = path.resolve(userHome, DEFAULT_CLI_HOME, CACHE_DIR);
    const storeDir = path.resolve(userHome, DEFAULT_CLI_HOME, CACHE_DIR, 'node_modules');
    log.verbose(npmName, version, targetPath, storeDir);
    const templateNpm = new Package({
      targetPath,
      storeDir,
      packageName: npmName,
      packageVersion: version
    });
    this.templateNpm = templateNpm;
    if (await templateNpm.exists()) {
      // 更新package
      const spinner = spinnerStart('Updating template...');
      await sleep();
      try {
        await templateNpm.update();
      } catch (e) {
        throw e;
      } finally {
        spinner.stop(true);
        if (await templateNpm.exists()) {
          log.success('Updated succeeded.');
        }
      }
    } else {
      // 安装package
      const spinner = spinnerStart('Downloading template...');
      await sleep();
      try {
        await templateNpm.install();
      } catch (e) {
        throw e;
      } finally {
        spinner.stop(true);
        if (await templateNpm.exists()) {
          log.success('Installation succeeded.');
        }
      }
    }
  }

  // 安装模板
  async installTemplate() {
    if (this.templateInfo) {
      if (!this.templateInfo.type) {
        this.templateInfo.type = NORMAL_TEMPLATE;
      }
      if (this.templateInfo.type === NORMAL_TEMPLATE) {
        await this.installNormalTemplate();
      } else if (this.templateInfo.type === CUSTOM_TEMPLATE) {
        await this.installCustomTemplate();
      } else {
        throw new Error('Unrecognized project template.');
      }
    } else {
      throw new Error('Project template does not exist.');
    }
  }

  // 安装标准模板
  async installNormalTemplate() {
    const spinner = spinnerStart('Install template...');
    try {
      const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template');
      const targetPath = process.cwd();
      console.log(templatePath, targetPath);
      fse.ensureDirSync(templatePath);
      fse.ensureDirSync(targetPath);
      fse.copySync(templatePath, targetPath);
    } catch (e) {
      throw e;
    } finally {
      spinner.stop(true);
      log.success('Template install success.');
    }
  }

  // 安装自定义模板
  async installCustomTemplate() {}

  async prepare() {
    // 0. 判断项目模板是否存在
    const template = await getProjectTemplate();
    if (!template || template.length === 0) {
      throw new Error('Project template does not exist.');
    }
    this.template = template;
    // 1. 判断当前目录是否为空
    const localPath = process.cwd();
    if (!this.isDirEmpty(localPath)) {
      let isContinue = false;
      if (!this.force) {
        // 1.1 询问是否继续创建
        isContinue = (await inquirer
          .prompt([
            {
              type: 'confirm',
              name: 'isContinue',
              message: `Target directory ${localPath} already used. Do you need to continue:`,
              default: false
            }
          ])).isContinue;
        if (!isContinue) {
          return;
        }
      }
      // 2. 是否强制更新
      if (isContinue || this.force) {
        const { confirmDelete } = await inquirer
          .prompt([
            {
              type: 'confirm',
              name: 'confirmDelete',
              message: `Are you sure to clear the current directory: ${localPath} :`,
              default: false
            }
          ]);
        if (confirmDelete) {
          // 强制清空
          fse.emptyDirSync(localPath);
        }
      }
    }
    return this.getProjectInfo();
  }

  // 获取项目信息
  async getProjectInfo() {
    let projectInfo = {};
    // 3. 选择创建项目还是组件
    const { type } = await inquirer.prompt({
      type: 'list',
      name: 'type',
      message: 'Please select a initialize type:',
      default: TYPE_PROJECT,
      choices: [
        {
          name: 'project',
          value: TYPE_PROJECT
        },
        {
          name: 'component',
          value: TYPE_COMPONENT
        }
      ]
    });
    log.verbose(`initialize type: ${type}`);
    // 4. 获取项目的基本信息
    if (type === TYPE_PROJECT) {
      const project = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Please enter project name:',
          validate(v) {
            // 首字符必须为英文字符
            // 尾字符必须为英文或者数字，不能为字符
            // 字符仅允许'-_'
            const done = this.async();
            setTimeout(() => {
              if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9])*$/) {
                done('You need to provide a legal project name.');
                return;
              }
              done(null, true);
            }, 0);
          },
          filter(v) {
            return v;
          }
        },
        {
          type: 'input',
          name: 'versions:',
          message: 'Please enter project version:',
          default: '1.0.0',
          validate(v) {
            const done = this.async();
            setTimeout(() => {
              if (!!!semver.valid(v)) {
                done('You need to provide a legal versions.');
                return;
              }
              done(null, true);
            }, 0);
          },
          filter(v) {
            if (!!semver.valid(v)) {
              return semver.valid(v);
            }
            return v;
          }
        },
        {
          type: 'list',
          name: 'template',
          message: 'Please select a project template:',
          choices: this.createTemplateChoice()
        }
      ]);
      projectInfo = {
        type,
        ...project
      }
    } else if (type === TYPE_COMPONENT) {

    }
    // return 项目的基本信息 （object）
    return projectInfo;
  }

  // 项目模板选项拼接
  createTemplateChoice() {
    return this.template.map(item => ({
      name: item.name,
      value: item.npmName
    }));
  }

  // 判断当前目录是否为空
  isDirEmpty(localPath) {
    let fileList = fs.readdirSync(localPath);
    // 文件过滤
    fileList = fileList.filter(file => (
      !file.startsWith('.') && !['node_modules'].includes(file)
    ));
    return !fileList || fileList.length <= 0;
  }

}

function factory(argv) {
  new InitCommand(argv);
}

module.exports = factory;
module.exports.InitCommand = InitCommand;

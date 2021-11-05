'use strict';

/**
 * @Description: 页面快速生成脚本
 * @Date: 2019-8-13
 * @Author: ${userInfo.username}
 */
const fs = require('fs');
const path = require('path');
const moment = require('moment');
// const basePath = path.resolve(__dirname, '../src');
const { log } = require('@one-stop-cli/utils');
const os = require('os');
const userInfo = os.userInfo();

function create({ dirName, type, basePath }) {
  // const dirName = process.argv[2];
  const capDirName = dirName.substring(0, 1).toUpperCase() + dirName.substring(1);
  if (!dirName) {
    log.notice('组件名称不能为空！');
    log.info('示例：one-stop-cli create [组件名称]');
    process.exit(0);
  }
  let store = `${basePath}/store`;
  let vuexModule = `${store}/module`;
  let views = `${basePath}/views`;

  if (!fs.existsSync(vuexModule)) {
    fs.mkdirSync(vuexModule);
  }

  if (!fs.existsSync(views)) {
    fs.mkdirSync(views);
  }

  let componentDirectory = `${views}/${dirName}`;
  if (fs.existsSync(componentDirectory)) {
    log.notice('组件已存在');
    process.exit(0);
  }

  /**
   * @msg: vue页面模版
   */
  const VueTemplate = `<template>
  <div class="${dirName}">
    ${dirName}
  </div>
</template>

<script>
  // import {mapState, mapMutations, mapActions} from 'vuex';
  // import api from 'service'
  export default {
    name: '${dirName}',
    data() {
      return {};
    },
    computed: {
      // ...mapState({
      //   test: state => state.${dirName}.test
      // })
    },
    mounted() {
      //
    },
    methods: {
      // ...mapActions({
      //   setData: '${dirName}/SET_DATA'
      // }),
      // ...mapMutations({
      //   setData: '${dirName}/SET_DATA'
      // }),
      // query${capDirName}List() {
      //   api.${dirName}.query${capDirName}List({params: {}, header: {}, data: {}).then(res => {
      //     if (res.result) {
      //       this.$message.success(res.message);
      //       this.setData(res.data);
      //     }
      //   });
      // }
    }
  };
</script>

<style lang="less">
  @import './index.less';
</style>
`;

// less 模版
// const lessTemplate = `@import "@/assets/less/variables.less";
  const lessTemplate = `@import "@/assets/less/${dirName}.less";
              
  .${dirName} {
    width: 100%;
}
`;

// api 模版
  const serviceTemplate = `/**
 * ${dirName}模块接口列表
 */
// import base from './base';
import {backendUrl} from '@/assets/js/config';
import axios from '@/assets/plugins/axios';

const ${dirName} = {
  // 获取
  query${capDirName}List(params) {
    return axios.get(\`\$\{backendUrl\}/api/user/list\`, params);
  },
  // 提交
  add${capDirName}(params) {
    return axios.post(\`\$\{backendUrl\}/api/user/add\`, params);
  }
};

export default ${dirName};
`;

  let serviceConfig = fs.readFileSync(`${basePath}/service/index.js`).toString();
  let packages = serviceConfig.match(/(?<=import ).+(?= from)/g);
  packages.push(dirName);
  const serviceIndexTemplate = `/**
 * api接口的统一出口
 * @Date: ${moment().format('YYYY-MM-DD')}
 * @Modify: ${moment().format('YYYY-MM-DD')}
 * @Author: ${userInfo.username}
 */

// 用户模块接口
${packages.map(item => `import ${item} from './${item}';`).join('\r\n')}
// 其他模块的接口……

// 导出接口
export default {
  ${packages.join(',\r\n  ')}
};
`;

// vuex 模版
  const vuexTemplate = `/**
 * @Description: vuex模块-${dirName}
 * @Date: ${moment().format('YYYY-MM-DD')}
 * @Modify: ${moment().format('YYYY-MM-DD')}
 * @Author: ${userInfo.username}
 */

import mutations from './mutations';
import actions from './action';
import getters from './getters';

export default {
  namespaced: true,
  state: {
    data: {}
  },
  getters,
  actions,
  mutations,
  modules: {}
};
`;
  const vuexAction = `/**
 * @Description: Action
 * @Date: ${moment().format('YYYY-MM-DD')}
 * @Modify: ${moment().format('YYYY-MM-DD')}
 * @Author: ${userInfo.username}
 */
 
// import {query${capDirName}List} from '@/assets/service/${dirName}';
// import {SET_DATA} from './mutation-types.js';

export default {
  // async setData({commit, state}, router) {
  //   return new Promise((resolve, reject) => {
  //     query${capDirName}List({router}).then(res => {
  //       commit(SET_DATA, res);
  //       resolve(res);
  //     }).catch(err => {
  //       reject(err);
  //     });
  //   });
  // }
};
`;
  const vuexMutations = `/**
 * @Description: MutationTypes
 * @Date: ${moment().format('YYYY-MM-DD')}
 * @Modify: ${moment().format('YYYY-MM-DD')}
 * @Author: ${userInfo.username}
 */
 
import {
  SET_DATA
} from './mutation-types.js';

export default {
  [SET_DATA](state, data) {
    state.data = data;
  }
};
`;
  const vuexMutationTypes = `/**
 * @Description: MutationTypes
 * @Date: ${moment().format('YYYY-MM-DD')}
 * @Modify: ${moment().format('YYYY-MM-DD')}
 * @Author: ${userInfo.username}
 */
 
export const SET_DATA = 'SET_DATA';
`;
  const vuexGetters = `/**
 * @Description: Getters
 * @Date: ${moment().format('YYYY-MM-DD')}
 * @Modify: ${moment().format('YYYY-MM-DD')}
 * @Author: ${userInfo.username}
 */
 
export default {
  // data: state => state.data
};
`;

  let files = fs.readdirSync(vuexModule);
  let vuexPackages = [];
  for (let i = 0; i < files.length; i++) {
    let fileName = files[i];
    let director = `${vuexModule}/${fileName}`;
    if (fs.statSync(director).isDirectory()) {
      vuexPackages.push(fileName);
    }
  }
  vuexPackages.push(dirName);
  const vuexModelTemplate = `/**
 * @Description: vue模块引用
 * @Date: ${moment().format('YYYY-MM-DD')}
 * @Modify: ${moment().format('YYYY-MM-DD')}
 * @Author: ${userInfo.username}
 */

${vuexPackages.map(model => `import ${model} from './module/${model}'`).join('\r\n')}

export default {${vuexPackages.join(',\r\n  ')}};
`;

// mkdir
  fs.mkdirSync(componentDirectory);
  if (fs.existsSync(componentDirectory)) {
    log.info('组件目录添加成功：' + componentDirectory);
  }

// vue
  process.chdir(componentDirectory); // cd views
  fs.writeFileSync('index.vue', VueTemplate);
  if (fs.existsSync(`${componentDirectory}/index.vue`)) {
    log.info(`组件模板添加成功：${componentDirectory}/index.vue`);
  }
// scss
  fs.writeFileSync('index.less', lessTemplate);
  if (fs.existsSync(`${componentDirectory}/index.less`)) {
    log.info(`组件样式添加成功：${componentDirectory}/index.less`);
  }

// api
  let serviceDirectory = `${basePath}/service`;
  fs.writeFileSync(`${serviceDirectory}/index.js`, serviceIndexTemplate); // index.js
  if (fs.existsSync(`${serviceDirectory}/index.js`)) {
    log.info(`接口index.js更新成功：${serviceDirectory}/index.js`);
  }
  process.chdir(serviceDirectory); // cd types
  fs.writeFileSync(`${serviceDirectory}/${dirName}.js`, serviceTemplate); // interface
  if (fs.existsSync(`${serviceDirectory}/${dirName}.js`)) {
    log.info(`接口文件添加成功：${serviceDirectory}/${dirName}.js`);
  }

// vuex
  let vuexDirectory = `${vuexModule}/${dirName}`;
  fs.mkdirSync(vuexDirectory);
  if (fs.existsSync(vuexDirectory)) {
    log.info(`vuex目录添加成功：${vuexDirectory}`);
  }
  process.chdir(vuexDirectory); // cd store
  fs.writeFileSync('index.js', vuexTemplate);
  if (fs.existsSync(vuexDirectory + '/index.js')) {
    log.info(`vuex文件添加成功：${vuexDirectory}/index.js`);
  }
  fs.writeFileSync('action.js', vuexAction);
  if (fs.existsSync(vuexDirectory + '/action.js')) {
    log.info(`vuex文件添加成功：${vuexDirectory}/action.js`);
  }
  fs.writeFileSync('getters.js', vuexGetters);
  if (fs.existsSync(vuexDirectory + '/getters.js')) {
    log.info(`vuex文件添加成功：${vuexDirectory}/getters.js`);
  }
  fs.writeFileSync('mutation-types.js', vuexMutationTypes);
  if (fs.existsSync(vuexDirectory + '/mutation-types.js')) {
    log.info(`vuex文件添加成功：${vuexDirectory}/mutation-types.js`);
  }
  fs.writeFileSync('mutations.js', vuexMutations);
  if (fs.existsSync(vuexDirectory + '/mutations.js')) {
    log.info(`vuex文件添加成功：${vuexDirectory}/mutations.js`);
  }
  fs.writeFileSync(`${store}/model.js`, vuexModelTemplate);
  if (fs.existsSync(`${store}/model.js`)) {
    log.info(`vuex模块引用更新成功：${store}/model.js`);
  }

  process.exit(0);
}

module.exports = create;

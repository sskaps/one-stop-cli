"use static";

const { request } = require('@one-stop-cli/utils');

module.exports = function() {
  return request({
    url: '/project/template',
  });
};

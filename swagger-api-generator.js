/**
 * api接口文件生成工具，可传2个命令行参数，第1个url为swagger api的请求地址必传，第2个是目标的相对目录dirname，可写入npm script方便执行
 * @author HandsomeWalker
 * @example
 * node swagger-api-generator.js http://foo/bar ./foo/bar
 */

const fs = require('fs');
const http = require('http');
const _path = require('path');

const argvs = process.argv.slice(2);
let [url, tarDir] = argvs;
typeof tarDir === 'undefined' && (tarDir = '.');
let count = 0;

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.135 Safari/537.36';
const config = {
  method: 'GET',
  headers: {
    'user-agent': UA,
  },
};

/**
 * 有分隔符的字符串转大驼峰
 * @param {string} str 字符串
 * @param {string} sep 分隔符
 * @returns {string} 转换结果
 */
function lineToCamel(str = '', sep = '-') {
  const reg = new RegExp(`(^|${sep})(\\w)`, 'g');
  // return str.replace(/(^|-)(\w)/g, (m, $1, $2) => $2.toUpperCase());
  return str.replace(reg, (m, $1, $2) => $2.toUpperCase());
}
// 小驼峰转大驼峰
function littleToBig(str = '') {
  return str.replace(/^(\w)/g, (m, $1) => $1.toUpperCase());
}

function request(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let chunk = '';
      res.setEncoding('utf-8');
      res.on('data', (data) => {
        chunk += data;
      });
      res.on('end', () => {
        resolve(JSON.parse(chunk));
      });
    });
    req.on('error', (err) => {
      reject(err);
    });
    req.end();
  });
}
const fieldTypeMap = {
  string: 'string | number',
  integer: 'string | number',
  ref: 'any',
};
// 获取每行type字段
function getTypeField(item) {
  return `  '${item.name}'${item.required ? '' : '?'}: ${
    fieldTypeMap[item.type] ? fieldTypeMap[item.type] : 'any'
  };\n`;
}
/**
 * 统一生成模板
 * @param {*} path
 * @param {*} api
 * @returns
 */
function genTemplate(path, api) {
  const names = path.split('/');
  let name = '';
  for (const item of names) {
    let temp;
    if (/-/g.test(item)) {
      temp = item.replace(/-(\w)/g, (m, $1) => $1.toUpperCase());
    } else if (/\{.+\}/g.test(item)) {
      temp = '';
    } else {
      temp = item.replace(/^\w/g, (m) => m.toUpperCase());
    }
    name += temp;
  }
  name = name.replace(/^\w/g, (m) => m.toLowerCase());
  const method = Object.keys(api)[0];
  const obj = api[method];
  const tags = obj.tags[0];
  let { description, parameters, summary } = obj;
  let showParamConfig = false;
  // 路径参数
  if (/\{\w+\}/g.test(path)) {
    showParamConfig = true;
    path = path.replace(
      /\{(\w+)\}/g,
      (m, $1) => "${paramConfig['" + $1 + "']}",
    );
    path = '`' + path + '`';
  } else {
    path = "'" + path + "'";
  }
  let params = '  params: {\n';
  let data =
    "\theaders: { 'Content-Type': 'application/x-www-form-urlencoded' },\n" +
    '  data: QS.stringify({\n';
  let finalParams = '';
  let finalTypes = '';
  let finalComment = '';
  if (!parameters) {
    parameters = [];
  }
  let hasParams = false;
  let hasData = false;
  // 请求体参数
  for (const item of parameters) {
    if (item.in === 'query') {
      if (params.includes(`'${item.name}': paramConfig['${item.name}']`)) {
        continue;
      }
      hasParams = true;
      params += `\t\t'${item.name}': paramConfig['${item.name}'],\n`;
    } else if (item.in === 'body') {
      if (data.includes(`'${item.name}': paramConfig['${item.name}']`)) {
        continue;
      }
      hasData = true;
      data += `\t\t'${item.name}': paramConfig['${item.name}'],\n`;
    }
    if (item.in === 'header') {
      continue;
    }
    finalComment += ` * @param {${
      fieldTypeMap[item.type] ? fieldTypeMap[item.type] : 'any'
    }} ${item.name} description: ${item.description} | required: ${
      item.required
    } | type: ${item.type}\n`;
    if (item.in === 'path') {
      continue;
    }
    finalTypes += getTypeField(item);
  }
  params += '\t},\n';
  data += '\t}),\n';

  if (hasParams || hasData) {
    showParamConfig = true;
  }
  hasParams && (finalParams += params);
  hasData && (finalParams += data);

  return {
    contentJs: `
 /**
  * ${summary}
 ${finalComment} */
 export const ${name} = (${showParamConfig ? 'paramConfig' : ''}) => request({
   url: ${path},
   method: '${method}',
 ${finalParams}});
 `,
    contentTs: `
 /**
  * ${summary}
 ${finalComment} */
 export const ${name} = (${
      showParamConfig ? 'paramConfig: ' + name + 'Props' : ''
    }) => request({
   url: ${path},
   method: '${method}',
 ${finalParams}});
 `,
    contentType: `
 /**
  * ${summary}
 ${finalComment} */
 interface ${name}Props extends anyFields {
 ${finalTypes}}`,
  };
}

function handleSwaggerApis(data) {
  let contentJs = "import req from '@/utils/request';\n";
  let contentTs =
    "const request = (o: {[key: string]: any;}) => {};\nimport QS from 'querystring';";
  let contentType = `interface anyFields { [key: string]: any }`;

  const jsonPath = `${tarDir}/swagger-apis.json`;
  const jsPath = `${tarDir}/swagger-apis.js`;
  const tsPath = `${tarDir}/swagger-apis.ts`;
  const typePath = `${tarDir}/swagger-apis.d.ts`;
  const isExists = fs.existsSync(jsonPath);
  let existsData;

  const pathObj = data.paths;

  if (isExists) {
    existsData = require(jsonPath);
    contentJs = fs.readFileSync(jsPath, { encoding: 'utf-8' });
    contentTs = fs.readFileSync(tsPath, { encoding: 'utf-8' });
    contentType = fs.readFileSync(typePath, { encoding: 'utf-8' });
  }
  let contentObj = {};
  for (const path in pathObj) {
    contentObj = genTemplate(path, pathObj[path]);
    if (isExists) {
      if (!(path in existsData)) {
        contentJs += contentObj.contentJs;
        contentTs += contentObj.contentTs;
        contentType += contentObj.contentType;
      }
    } else {
      count++;
      contentJs += contentObj.contentJs;
      contentTs += contentObj.contentTs;
      contentType += contentObj.contentType;
    }
  }
  // cache &&
  //   fs.writeFileSync(jsonPath, JSON.stringify(pathObj));
  createFile(jsPath, contentJs);
  createFile(tsPath, contentTs);
  createFile(typePath, contentType);
  console.log('***************api文件生成成功了(^_^)*****************');
  console.log(`[本次新增接口数量]: ${count}`);
}
// 递归创建目录 同步方法
function mkdirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirsSync(_path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    }
  }
}

function createFile(filePath, data) {
  const isFileExists = fs.existsSync(filePath);
  if (!isFileExists && tarDir !== '.') {
    mkdirsSync(tarDir);
  }
  fs.writeFileSync(filePath, data);
}

request(config)
  .then(handleSwaggerApis)
  .catch((err) => {
    console.log(err);
    console.log('***************出错啦(-_-!)请重试或砸电脑*****************');
  });

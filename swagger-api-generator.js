/**
 * api接口文件生成工具，可传5个命令行参数，可写入npm script方便执行
 * @param url 必传，swagger文档接口，如：http://172.27.17.123:8989/v2/api-docs
 * @param tarDir 可选，生成文件的目标目录，default: ./
 * @param fileName 可选，生成文件名，default: swagger-api
 * @param fileType 可选，生成ts还是js，default: ts
 * @param template 可选，生成的ts或者js文件顶部自定义的代码段，default: ''
 * @author HandsomeWalker
 * @example
 * node swagger-api-generator.js url=http://foo/bar tarDir=./foo/bar fileName=service fileType=ts template='import request from "./funcRequest";import QS from "qs";'
 */

const fs = require('fs');
const http = require('http');
const _path = require('path');

const argvs = process.argv.slice(2);
let url, tarDir, fileName, fileType, template;
for (const item of argvs) {
  if (/url=.+/g.test(item)) {
    url = item.replace(/url=/g, '');
  }
  if (/tarDir=.+/g.test(item)) {
    tarDir = item.replace(/tarDir=/g, '');
  }
  if (/fileName=.+/g.test(item)) {
    fileName = item.replace(/fileName=/g, '');
  }
  if (/fileType=.+/g.test(item)) {
    fileType = item.replace(/fileType=/g, '');
  }
  if (/template=.+/g.test(item)) {
    template = item.replace(/template=/g, '');
  }
}
typeof tarDir === 'undefined' && (tarDir = '.');
typeof fileName === 'undefined' && (fileName = 'swagger-api');
if (
  typeof fileType === 'undefined' ||
  (fileType !== 'ts' && fileType !== 'js')
) {
  fileType = 'ts';
}
typeof template === 'undefined' && (template = '');
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
  array: 'any[]',
  object: 'any',
  boolean: 'boolean',
  ref: 'any',
};
const responseTypeMap = {
  string: 'string',
  integer: 'number',
  array: 'any[]',
  object: 'any',
  boolean: 'boolean',
  ref: 'any',
};
// 获取每行type字段
function getTypeField(item) {
  return `  '${item.name}'${item.required ? '' : '?'}: ${
    fieldTypeMap[item.type] ? fieldTypeMap[item.type] : 'any'
  };\n`;
}
// 获取响应字段配置
function getResponseFields(props) {
  let resObj = {
    contentJsDoc: '',
    contentTypes: '',
    contentTypesDoc: '',
  };
  for (const key in props) {
    const item = props[key];
    const { description, type } = item;
    resObj.contentJsDoc += ` * @returns ${key} description: ${description} | type: ${type}\n`;
    resObj.contentTypesDoc += ` * @param {${
      responseTypeMap[type] || 'any'
    }} ${key} description: ${description} | type: ${type}\n`;
    resObj.contentTypes += `${key}: ${responseTypeMap[type] || 'any'};\n`;
  }
  return resObj;
}
/**
 * 统一生成模板
 * @param {*} path
 * @param {*} api
 * @param {*} definitionsObj
 * @returns a:电视
 * @returns b:电视放
 */
function genTemplate(path, api, definitionsObj) {
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
  let { description, parameters, summary, responses, consumes } = obj;
  let showParamConfig = false;
  let searchKey = '';
  try {
    searchKey = responses['200'].schema.originalRef.match(/«[^«»]+»/g)[0];
  } catch (e) {}
  let responseContentProps = {};
  if (searchKey) {
    searchKey = searchKey.replace(/[«»]/g, '');
    responseContentProps = definitionsObj[searchKey];
    if (responseContentProps) {
      responseContentProps = responseContentProps.properties || {};
    }
  }
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
  let isJsonData = true;
  let params = '  params: {\n';
  let data = '  data: {\n';
  if (consumes) {
    if (consumes[0] === 'application/json') {
      data = '  data: {\n';
    }
    if (consumes[0] === 'application/x-www-form-urlencoded') {
      isJsonData = false;
      data =
        "\theaders: { 'Content-Type': 'application/x-www-form-urlencoded' },\n" +
        '  data: QS.stringify({\n';
    }
  }
  let finalParams = '';
  let finalTypes = '';
  let finalComment = '';
  let finalResponse = getResponseFields(responseContentProps);
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
  data += isJsonData ? '\t},\n' : '\t}),\n';

  if (hasParams || hasData) {
    showParamConfig = true;
  }
  hasParams && (finalParams += params);
  hasData && (finalParams += data);

  return {
    contentJs: `
  /**
   * ${summary}
  ${finalComment}${finalResponse.contentJsDoc}*/
  export const ${name}${method.toUpperCase()} = (${
      showParamConfig ? 'paramConfig' : ''
    }) => request({
    url: ${path},
    method: '${method}',
  ${finalParams}});
  `,
    contentTs: `
  /**
   * ${summary}
  ${finalComment}${finalResponse.contentJsDoc}*/
  export const ${name}${method.toUpperCase()} = (${
      showParamConfig
        ? 'paramConfig: ' + name + method.toUpperCase() + 'Props'
        : ''
    }): ${
      finalResponse.contentTypes
        ? 'Promise<' + name + method.toUpperCase() + 'ResProps>'
        : 'Promise<any>'
    } => request${
      finalResponse.contentTypes
        ? '<' + name + method.toUpperCase() + 'ResProps>'
        : '<any>'
    }({
    url: ${path},
    method: '${method}',
  ${finalParams}});
  `,
    contentType: `
  /**
   * ${summary}
  ${finalComment} */
  interface ${name}${method.toUpperCase()}Props extends anyFields {
  ${finalTypes}}
  ${
    finalResponse.contentTypes
      ? '/**\n\t' +
        finalResponse.contentTypesDoc +
        '*/\ninterface ' +
        name +
        method.toUpperCase() +
        'ResProps{\n' +
        finalResponse.contentTypes +
        '}'
      : ''
  }`,
  };
}

function handleSwaggerApis(data) {
  let contentJs = template;
  let contentTs = `import './${fileName}Types';\n` + template;
  let contentType = `interface anyFields { [key: string]: any }`;

  const jsonPath = `${tarDir}/swagger-apis.json`;
  const jsPath = `${tarDir}/${fileName}.js`;
  const tsPath = `${tarDir}/${fileName}.ts`;
  const typePath = `${tarDir}/${fileName}Types.ts`;
  const isExists = fs.existsSync(jsonPath);
  let existsData;

  const pathObj = data.paths;
  const definitionsObj = data.definitions;

  if (isExists) {
    existsData = require(jsonPath);
    contentJs = fs.readFileSync(jsPath, { encoding: 'utf-8' });
    contentTs = fs.readFileSync(tsPath, { encoding: 'utf-8' });
    contentType = fs.readFileSync(typePath, { encoding: 'utf-8' });
  }
  let contentObj = {};
  for (const path in pathObj) {
    contentObj = genTemplate(path, pathObj[path], definitionsObj);
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
  if (fileType === 'ts') {
    createFile(tsPath, contentTs);
    createFile(typePath, contentType);
  } else if (fileType === 'js') {
    createFile(jsPath, contentJs);
  }
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

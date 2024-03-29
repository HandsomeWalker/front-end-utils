/**
 * 判断是否为undefined
 * @param {*} something 任何
 */
export const isUndefined = function(something) {
  return typeof something === "undefined";
};
/**
 * 判断是否为null
 * @param {*} something 任何
 */
export const isNull = function(something) {
  return something === null;
};
/**
 * 判断是否为Number
 * @param {*} something 任何
 */
export const isNumber = function (something) {
  return typeof something === 'number' && !isRealNaN(something);
};
/**
 * 判断是否为NaN
 * @param {*} something 任何
 */
export const isRealNaN = function(something) {
  return Number.isNaN(something);
};
/**
 * 判断是否为字符串
 * @param {*} something 任何
 */
export const isString = function(something) {
  return Object.prototype.toString.apply(something) === "[object String]";
};
/**
 * 判断是否为js对象
 * @param {*} something 任何
 */
export const isObject = function(something) {
  return Object.prototype.toString.apply(something) === "[object Object]";
};
/**
 * 判断是否为数组
 * @param {*} something 任何
 */
export const isArray = function(something) {
  return Object.prototype.toString.apply(something) === "[object Array]";
};
/**
 * 判断是否为json字符串
 * @param {*} something 任何
 */
export const isJson = function(something) {
  if (!isString(something)) {
    return false;
  }
  return /(^{.*}$|^\[.*\]$)/g.test(something);
};
/**
 * 深复制数组
 * @param {array} src 
 * @param {array} tar 
 */
function cloneArr(src, tar) {
  for (let item of src) {
      if (Array.isArray(item)) {
          tar.push(cloneArr(item, []))
      } else if (typeof item === 'object') {
          tar.push(cloneObj(item, {}))
      } else {
          tar.push(item)
      }
  }
  return tar
}
/**
 * 深复制对象
 * @param {object} src 
 * @param {object} tar 
 */
function cloneObj(src, tar) {
  for (let attr in src) {
      if (Array.isArray(src[attr])) {
          tar[attr] = cloneArr(src[attr], [])
      } else if (typeof src[attr] === 'object') {
          tar[attr] = cloneObj(src[attr], {})
      } else {
          tar[attr] = src[attr]
      }
  }
  return tar
}
/**
 * 深复制
 * @param {array|object} src 
 */
function deepClone(src) {
  if (isArray(src)) {
    return cloneArr(src, []);
  }
  if (isObject(src)) {
    return cloneObj(src, {});
  }
  return src;
}
/**
 * 简单深复制
 * @param {array|object} src 
 */
function simpleDeepClone(src) {
  if (!isObject(src) && !isArray(src)) {
    return src;
  }
  return JSON.parse(JSON.stringify(src))
}
/**
 * 兼容移动端H5设置页面title，钉钉中需要"npm install dingtalk-jsapi"
 * @param {string} title 需要设置的标题文字
 */
import { ready, biz } from "dingtalk-jsapi";
function setMyTitle(title) {
  if (title === undefined || window.document.title === title) {
    return;
  }
  document.title = title;
  const mobile = navigator.userAgent.toLowerCase();
  if (/dingtalk/.test(mobile)) {
    // 钉钉环境
    ready(function() {
      biz.navigation.setTitle({ title: title });
    });
  } else if (/micromessenger/.test(mobile)) {
    // 微信环境
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.setAttribute(
      "src",
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    );
    const iframeCallback = function() {
      setTimeout(function() {
        iframe.removeEventListener("load", iframeCallback);
        document.body.removeChild(iframe);
      }, 0);
    };
    iframe.addEventListener("load", iframeCallback);
    document.body.appendChild(iframe);
  }
}
/**
 * 简单事件类
 */
const EventBus = {
  _events: {},
  /**
   * 注册事件
   * @param {string} name 事件名
   * @param {function} fn 回调
   */
  on(name = "e", fn) {
    this._events[name] || (this._events[name] = []);
    this._events[name].push(fn);
  },
  /**
   * 解绑事件
   * @param {string} name 事件名
   */
  off(name = "e") {
    delete this._events[name];
  },
  /**
   * 触发事件
   * @param {string} name 事件名
   * @param  {...any} args 自定义参数表
   */
  emit(name = "e", ...args) {
    this._events[name] && this._events[name].map(item => item(...args));
  }
}
/**
 * 延时函数
 * @param {number} ms 毫秒数
 */
function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}
/**
 * 浏览器控制台彩色打印
 * @param {string} log 打印信息
 * @param {string} color 颜色
 */
export const colorfulConsole = function() {
  let logInfo;
  let color;
  let args = arguments;
  logInfo = "%c" + (args[0] || "");
  color = "color:" + (args[1] || "red");
  console.log(logInfo, color);
  return null;
};
/**
 * 监听浏览器返回操作
 * @param {function} cb 点击返回的回调函数
 */
export const listenBack = function(cb) {
  if (window.history && window.history.pushState) {
    colorfulConsole("监听返回: " + document.URL, "yellow");
    window.addEventListener("popstate", cb, false);
  }
};
/**
 * 移除返回监听
 * @param {function} cb
 */
export const removeListenBack = function(cb) {
  colorfulConsole("移除监听返回", "yellow");
  setTimeout(() => {
    window.removeEventListener("popstate", cb, false);
  });
};
/**
 * 阻断式装饰器函数，如果装饰函数返回false，则不执行目标函数，如不返回值或返回值不为false，则会执行目标函数
 * @param {function} target 目标函数
 * @param {function} decorator 装饰函数
 * @param {*} decoratorParams 传递给装饰函数的参数
 */
export const decorate = function(target, decorator, decoratorParams) {
  return function() {
    let args = [];
    for (let i = 0, len = arguments.length; i < len; i++) {
      args.push(arguments[i]);
    }
    decoratorParams && args.push(decoratorParams);
    let flag = decorator.apply(target, args);
    if (flag !== false) {
      return target.apply(this, arguments);
    }
  };
};
/**
 * 获取秒分钟小时天对应的毫秒数
 * @param {number} num 多少个
 * @param {string} unit 单位 day hour min sec
 * @returns {number} 毫秒数
 */
export const getMs = function(num, unit) {
  let res;
  if (typeof num !== "number") {
    return 0;
  }
  switch (unit) {
    case "day":
      res = num * 24 * 60 * 60 * 1000;
      break;
    case "hour":
      res = num * 60 * 60 * 1000;
      break;
    case "min":
      res = num * 60 * 1000;
      break;
    case "sec":
      res = num * 1000;
      break;
    default:
      res = 0;
      break;
  }
  return res;
};
/**
 * 封装小型持久存储方法
 */
const s = Symbol("sessionStorage");
const o = {
  [s]: true
};
const storageToolBox = {
  set_cookie({ key, value, options }) {
    let expires, stringify;
    if (options.expire) {
      const d = new Date(options.expire);
      expires = "; expires=" + d.toGMTString();
    }
    if (isObject(value) || isArray(value)) {
      stringify = JSON.stringify(value);
    }
    document.cookie = key + "=" + (stringify || value) + (expires || "");
  },
  get_cookie({ key }) {
    const name = key + "=";
    const ca = document.cookie.split(";");
    let res;
    for (let i = 0; i < ca.length; i++) {
      const c = ca[i].trim();
      if (c.indexOf(name) === 0) {
        res = c.substring(name.length, c.length);
        if (isJson(res)) {
          res = JSON.parse(res);
        }
        return res;
      }
    }
    return "";
  },
  delete_cookie({ key }) {
    this.set_cookie(key, "", {
      expire: -1
    });
  },
  set_localstorage({ key, value, options }) {
    let stringify;
    if (isObject(value) || isArray(value)) {
      stringify = JSON.stringify(value);
    }
    options[s]
      ? sessionStorage.setItem(key, stringify || value)
      : localStorage.setItem(key, stringify || value);
  },
  get_localstorage({ key, options }) {
    let res = options[s]
      ? sessionStorage.getItem(key)
      : localStorage.getItem(key);
    if (isJson(res)) {
      res = JSON.parse(res);
    }
    return res;
  },
  delete_localstorage({ key, options }) {
    options[s] ? sessionStorage.removeItem(key) : localStorage.removeItem(key);
  },
  set_sessionstorage({ key, value }) {
    this.set_localstorage({ key, value, options: o });
  },
  get_sessionstorage({ key }) {
    return this.get_localstorage({ key, options: o });
  },
  delete_sessionstorage({ key }) {
    this.delete_localstorage({ key, options: o });
  }
};
/**
 * 轻量web存储器
 * @param {object} options 可选项 async: false即可取消异步存储，改为同步存储
 * @example 示例: 存数据saver({ key: 'userInfo', value: {name: 'xx'} }) 取数据saver({ method: 'get', key: 'userInfo' }) 删数据save({ method: 'delete', key: 'userInfo' })
 */
export const saver = function({
  method = "set",
  mode = "sessionstorage",
  async = true,
  key,
  value,
  options = {}
}) {
  if (key) {
    const attr = `${method}_${mode.toLowerCase()}`;
    if (attr in storageToolBox) {
      if (method === "get") {
        return storageToolBox[attr]({ key, value, options });
      } else {
        if (async) {
          return new Promise((resolve, reject) => {
            setTimeout(() => {
              try {
                storageToolBox[attr]({ key, value, options });
                colorfulConsole(`saver: ${method} ${key}`);
                resolve();
              } catch (err) {
                reject(err);
              }
            }, 10);
          });
        } else {
          storageToolBox[attr]({ key, value, options });
        }
      }
    }
  }
};
/**
 * 多请求并发改良
 * @param {array} pmsArr promise数组
 * @param {any} exception 请求异常时希望返回的结果
 */
export const promiseAll = function (pmsArr, exception = { content: [] }) {
  let _pmsArr = [];
  if (!isArray(pmsArr)) {
    return [];
  }
  for (const item of pmsArr) {
    if (item instanceof Promise) {
      _pmsArr.push(item.catch(() => exception));
    }
  }
  return Promise.all(_pmsArr);
};
/**
 * 具有存储期限的localStorage
 * @example expireLocalStorage.setItem('test', {name: 'handsome'}, 5).removeItem('test').getItem('test', {})
 */
export const expireLocalStorage = {
  setItem(key = '', value = '', expire = 1) {
    value = {
      ms: Date.now(),
      expire: Math.floor(expire),
      originData: value
    }
    window.localStorage.setItem(key, JSON.stringify(value))
    return this
  },
  getItem(key = '', except) {
    let value
    value = window.localStorage.getItem(key)
    if (!value) {
      return except || null
    }
    value = JSON.parse(value)
    if (Date.now() - value.ms >= value.expire * 12 * 60 * 60 * 1000) {
      window.localStorage.removeItem(key)
      return except || null
    }
    if (value.originData) {
      return value.originData
    } else {
      return except || null
    }
  },
  removeItem(key = '') {
    window.localStorage.removeItem(key)
    return this
  }
}
/**
 * 绑定点击元素外的触发事件
 * @param {element} el 
 * @param {function} cb 
 */
export function onClickOutside(el, cb) {
  this.evt = function (e) {
    const itsChildren = el.contains(e.target);
    if(e.target !== el && !itsChildren) {
      return cb ? cb() : null;
    }
  };
  document.addEventListener('click', this.evt, false);
  return this;
}
onClickOutside.prototype.remove = function () {
  document.removeEventListener('click', this.evt, false);
};
onClickOutside.prototype.reinit = function () {
  document.addEventListener('click', this.evt, false);
};
/**
 * 转为树形结构，时间复杂度：O(n²)，空间复杂度：O(1)
 * @param {array} data 数据源
 * @param {object} option 别名
 */
export function plain2Tree(data, option) {
  let res = JSON.parse(JSON.stringify(data))
  let label, value
  let id = 'id'
  let pid = 'pid'
  if (Object.prototype.toString.call(option) === '[object Object]') {
    label = option.label
    value = option.value
    option.id && (id = option.id)
    option.pid && (pid = option.pid)
  }
  res.forEach((item) => {
    if (Array.isArray(label)) {
      item[label[1]] = item[label[0]]
    }
    if (Array.isArray(value)) {
      item[value[1]] = item[value[0]]
    }
    const parentID = item[pid]
    if (parentID) {
      res.forEach((each) => {
        if (each[id] === parentID) {
          if (!each.children) {
            each.children = []
          }
          each.children.push(item)
        }
      })
    }
  })
  res = res.filter(ele => !ele[pid])
  return res
}
/**
 * 转为树形结构，时间复杂度：O(n)，空间复杂度：O(n)
 * @param {array} data 数据源
 * @param {object} option 别名
 */
export function plain2Tree(data, option) {
  const res = JSON.parse(JSON.stringify(data))
  const map = {}
  let label, value
  let id = 'id'
  let pid = 'pid'
  if (Object.prototype.toString.call(option) === '[object Object]') {
    label = option.label
    value = option.value
    option.id && (id = option.id)
    option.pid && (pid = option.pid)
  }
  res.forEach(function (item) {
    if (Array.isArray(label)) {
      item[label[1]] = item[label[0]]
    }
    if (Array.isArray(value)) {
      item[value[1]] = item[value[0]]
    }
    map[item[id]] = item
  });
  const val = [];
  res.forEach(function (item) {
    const parent = map[item[pid]]
    if (parent) {
      (parent.children || ( parent.children = [] )).push(item)
    } else {
      val.push(item)
    }
  });
  return val
}
/**
 * 树结构转平级
 * @param {array} data 
 */
function tree2Plain(data) {
  let res = []
  for (let i = 0, len = data.length; i < len; i++) {
    res.push(data[i])
    const temp = data[i].children
    if (temp) {
      delete data[i].children
      res = res.concat(tree2Plain(temp))
    }
  }
  return res
}
/**
 * 重置表单项
 */
export function resetForm(origin, replacement) {
  if (!isObject(origin)) {
    return origin;
  }
  let res = {};
  for (const key in origin) {
    const val = origin[key];
    if (isString(val)) {
      res[key] = '';
    } else if (isNumber(val)) {
      res[key] = 0;
    } else if (isArray(val)) {
      res[key] = [];
    } else if (isObject(val)) {
      res[key] = {};
    }
  }
  if (isObject(replacement)) {
    res = { ...res, ...replacement };
  }
  return res;
}
/* 浏览器全屏 */
export function toFullScreen(e) {
  let el = e.srcElement || e.target || e;
  let isFullscreen =
    document.fullScreen ||
    document.mozFullScreen ||
    document.webkitIsFullScreen;
  if (!isFullscreen) {
    // 先判断处于非全屏状态
    (el.requestFullscreen && el.requestFullscreen()) ||
      (el.mozRequestFullScreen && el.mozRequestFullScreen()) ||
      (el.webkitRequestFullscreen && el.webkitRequestFullscreen()) ||
      (el.msRequestFullscreen && el.msRequestFullscreen());
  }
}
/* 退出全屏 */
export function exitFullScreen() {
  let isFullscreen =
    document.fullScreen ||
    document.mozFullScreen ||
    document.webkitIsFullScreen;
  if (isFullscreen) {
    // 先判断处于非全屏状态
    // eslint-disable-next-line no-unused-expressions
    document.exitFullscreen
      ? document.exitFullscreen()
      : document.mozCancelFullScreen
      ? document.mozCancelFullScreen()
      : document.webkitExitFullscreen
      ? document.webkitExitFullscreen()
      : '';
  }
}
/**
 * 按key取数组
 * @param {array} data 数据数组
 * @param {...string} key 字段
 */
export function getArrByKeys(data, ...keys) {
  const res = {};
  if (!isArray(data)) {
    return res;
  }
  for (const item of data) {
    if (!isObject(item)) {
      continue;
    }
    for (const key of keys) {
      if (!isString(key)) {
        continue;
      }
      const keyItem = item[key];
      if (isUndefined(keyItem)) {
        continue;
      }
      isUndefined(res[key]) ? (res[key] = [keyItem]) : res[key].push(keyItem);
    }
  }
  return res;
}
/**
 * 处理字段为null
 * @param {object} dataObj 数据对象
 * @param {array} ignoreFields 忽略的字段
 * @param {any} except 替换null的
 */
export function handleFieldNull(dataObj, ignoreFields = [], except = '-') {
  if (!isObject(dataObj)) {
    return dataObj;
  }
  let res = deepCopy(dataObj);
  for (const key in res) {
    if (isArray(ignoreFields)) {
      if (ignoreFields.includes(key)) {
        continue;
      }
    }
    const item = res[key];
    if (isNull(item)) {
      res[key] = except;
    } else if (isString(item)) {
      item.toLowerCase() === 'null' &&
      (res[key] = except);
    }
  }
  return res;
}
/**
 * 下载二进制文件
 * @param {promise} pms
 */
export function download(pms) {
  pms.then((res) => {
    const name = res.response.headers
      .get('content-disposition')
      .replace('attachment;filename=', '');
    const blob = res.data;
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = (e) => {
      const a = document.createElement('a');
      a.download = decodeURI(name);
      // 后端设置的文件名称在res.headers的 "content-disposition": "form-data; name=\"attachment\"; filename=\"20181211191944.zip\"",
      a.href = e.target.result;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
  });
}

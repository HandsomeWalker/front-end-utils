// 前端检测.vue文件中js代码块的注释行数，可用lint-stage集成在git pre-commit hook
const fs = require('fs')
const file = process.argv[2]

const data = fs.readFileSync(file).toString()
const matchArr = data.match(/(\/\/.+)|(\/\*.+\*\/)/g)
if (matchArr) {
  if (matchArr.length < 5) {
    throw new Error(`${file} js中注释少于5句`)
  }
} else {
  throw new Error(`${file} js中注释少于5句`)
}

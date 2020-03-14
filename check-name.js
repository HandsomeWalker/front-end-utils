// 前端检测文件名，可用lint-stage集成在git pre-commit hook
const fs = require('fs')
const reg = /[A-Z]|_/
function isDir(path) {
  const stat = fs.lstatSync(path)
  return stat.isDirectory()
}
function check(dirName) {
  console.log('checking:[' + dirName + ']')
  fs.readdir(dirName, function(err, files) {
    if (err) {
      return console.error(err)
    } else {
      files.forEach(function(file) {
        if (reg.test(file) && file !== 'README.md') {
          console.log('命名规范:foo.vue, foo-bar.vue')
          throw new Error(dirName + file + '不符合命名规范!')
        }
        if (isDir(dirName + file)) {
          check(dirName + file + '/')
        }
      })
    }
  })
}
check('./pages/')
check('./components/')

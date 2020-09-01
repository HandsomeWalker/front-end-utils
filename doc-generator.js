const fs = require("fs");
const path = require("path");
const recast = require("recast");
const babylon = require("@babel/parser");
const { exec } = require("child_process");

const argv = process.argv.slice(2);
const type = argv[0];
const name = argv[1];
const b = recast.types.builders;
let dirs;

/* 生成目录 */
function genDir(p) {
  const dirRelativePath = `${p}/${dirs.join("/")}`;
  const isDirExists = fs.existsSync(dirRelativePath);
  if (!isDirExists) {
    try {
      fs.mkdirSync(dirRelativePath, { recursive: true });
    } catch (err) {
      for (let i = 0; i < dirs.length; i++) {
        const item = dirs[i];
        p += `/${item}`;
        !fs.existsSync(p) && fs.mkdirSync(p);
      }
    }
  }
}
/* 生成组件文件 */
function genComponent(name, p = "src/components") {
  const content = `<template>
  <div class="${cameltoLine(name)}"></div>
</template>

<script>
export default {
  name: "${lineToCamel(name)}"
};
</script>
`;
  let absPath = path.join(__dirname, p);
  if (dirs) {
    absPath += "\\" + dirs.join("\\");
    genDir(p);
  }
  absPath += `\\${name}.vue`;
  fs.writeFileSync(absPath, content);
  return absPath;
}
/* 生成路由 */
function genRouter(name) {
  const src = path.join(__dirname, "src/router/index.js");
  const code = fs.readFileSync(src, "utf-8");
  const ast = recast.parse(code, {
    parser: babylon
  });
  recast.visit(ast, {
    visitArrayExpression(path) {
      const content = b.objectExpression([
        b.objectProperty(
          b.identifier("path"),
          b.stringLiteral(`/${cameltoLine(name)}`)
        ),
        b.objectProperty(
          b.identifier("name"),
          b.stringLiteral(lineToCamel(name))
        ),
        b.objectProperty(
          b.identifier("component"),
          b.arrowFunctionExpression(
            [],
            b.callExpression(b.identifier("import"), [
              b.stringLiteral.from({
                comments: [
                  b.commentBlock(
                    ` webpackChunkName: "${cameltoLine(name)}" `,
                    true
                  )
                ],
                value: `../views/${dirs.join("/")}/${name}.vue`
              })
            ])
          )
        )
      ]);
      path.get("elements").push(content);
      return false;
    }
  });
  // console.log(recast.prettyPrint(ast, { tabWidth: 2 }).code);
  fs.writeFileSync(src, recast.print(ast, { tabWidth: 2 }).code);
  return genComponent(name, "src/views");
}
// lint特定文件
function lintFile(filePath) {
  exec(`npm run lint ${filePath}`, function() {
    console.log("*lint finish");
  });
}
// 中横线转换大驼峰
function lineToCamel(str) {
  return str.replace(/(^|-)(\w)/g, (m, $1, $2) => $2.toUpperCase());
}
// 大驼峰转换中横线
function cameltoLine(name) {
  name = name.replace(/([A-Z])/g, "-$1").toLowerCase();
  return name.replace(/^-/, "");
}
// 组件名检测转换
function checkConvertName(name) {
  const regPascalCase = /^[A-Z][a-z0-9]+([A-Z][a-z0-9]+){0,}/;
  const regKebabCase = /^[a-z][a-z0-9]*(-[a-z][a-z0-9]*){0,}$/;
  if (/.\/./.test(name)) {
    dirs = name.split("/");
    name = dirs.pop();
  }
  if (regPascalCase.test(name) || regKebabCase.test(name)) {
    const files = fs.readdirSync("src");
    let file;
    for (file of files) {
      const stat = fs.statSync(`src/${file}`);
      if (stat.isFile() && /\.vue/.test(file)) {
        break;
      }
    }
    file = file.replace(/\.vue/, "");
    if (regPascalCase.test(file)) {
      return lineToCamel(name);
    } else {
      return cameltoLine(name);
    }
  } else {
    console.log("*命名不符合规范");
    console.log("*示例：TodoList，todo-list");
    console.log("*规范参考：https://cn.vuejs.org/v2/style-guide");
    return false;
  }
}
// 入口方法
function gen(type, name) {
  let filePath = "";
  switch (type) {
    case "component":
      filePath = genComponent(name);
      console.log(`*已生成组件${filePath}`);
      break;
    case "router":
      filePath = genRouter(name);
      console.log(`*已生成页面文件${filePath}`);
      filePath += ` ${path.join(__dirname, "src/router/index.js")}`;
      break;
    default:
      break;
  }
  try {
    require("eslint");
    lintFile(filePath);
  } catch (err) {
    console.log("*无eslint");
  }
}
const convertedName = checkConvertName(name);
convertedName && gen(type, convertedName);

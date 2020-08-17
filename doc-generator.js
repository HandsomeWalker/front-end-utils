const fs = require("fs");
const path = require("path");
const recast = require("recast");
const babylon = require("@babel/parser");

const argv = process.argv.slice(2);
const type = argv[0];
const name = argv[1];
const b = recast.types.builders;

/* 组件 */
function genComponent(name, p = "src/components") {
  const content = `<template>
  <div class="component-class"></div>
</template>

<script>
export default {
  name: "ExampleComponent"
};
</script>
`;
  const absPath = path.join(__dirname, p, `${name}.vue`);
  fs.writeFileSync(absPath, content);
  return absPath;
}
/* 路由 */
function genRouter(name) {
  // genComponent(name, "src/views");
  const src = path.join(__dirname, "src/router/index.js");
  const code = fs.readFileSync(src, "utf-8");
  const ast = babylon.parse(code, {
    sourceType: "module"
  });
  recast.visit(ast, {
    visitArrayExpression(path) {
      const content = b.objectExpression([
        b.objectProperty(b.identifier("path"), b.stringLiteral(`/${name}`)),
        b.objectProperty(b.identifier("name"), b.stringLiteral(name)),
        b.objectProperty(
          b.identifier("component"),
          b.arrowFunctionExpression(
            [],
            b.callExpression(b.identifier("import"), [
              b.stringLiteral.from({
                comments: [
                  b.commentBlock(` webpackChunkName: "${name}" `, true)
                ],
                value: `../views/${name}.vue`
              })
            ])
          )
        )
      ]);
      path.get("elements").push(content);
      return false;
    }
  });
  console.log(recast.print(ast, { tabWidth: 2 }).code);
  // fs.writeFileSync(src, recast.print(ast, { tabWidth: 2 }).code);
}
function gen(type, name) {
  switch (type) {
    case "component":
      genComponent(name);
      break;
    case "router":
      genRouter(name);
      break;
    default:
      break;
  }
}
gen(type, name);
console.log("****文件已生成****");

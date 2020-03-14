/* 控制台彩蛋打印，服务器发版本时间打印 */
var fs = require("fs");
var time = new Date().toLocaleString();
var txt = `
<script>
console.log('😏')
console.log('Ver:${time}')
</script>
`;
fs.appendFile("dist/index.html", txt, function() {
  console.log("tag done");
});

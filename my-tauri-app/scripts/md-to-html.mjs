import { readFileSync, writeFileSync } from "node:fs";
import { marked } from "marked";

// Usage: node md-to-html.mjs <input.md> <output.html> "<title>"
const [, , inPath, outPath, title] = process.argv;

marked.setOptions({ gfm: true, breaks: false });
const body = marked.parse(readFileSync(inPath, "utf8"));

const css = `
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body {
  font-family: "Segoe UI", Calibri, Arial, sans-serif;
  font-size: 10.5pt; line-height: 1.5; color: #1c2330;
  margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
h1 { font-size: 22pt; color: #2747b0; border-bottom: 3px solid #4f7cff;
     padding-bottom: 6px; margin: 0 0 4px; }
h2 { font-size: 15pt; color: #2747b0; border-bottom: 1px solid #c9d4ee;
     padding-bottom: 4px; margin-top: 22px; page-break-before: always; }
h2:first-of-type { page-break-before: avoid; }
h3 { font-size: 12.5pt; color: #34406b; margin-top: 16px; }
h4 { font-size: 11pt; color: #455; margin-top: 12px; }
p { margin: 7px 0; }
a { color: #2747b0; text-decoration: none; }
ul, ol { margin: 6px 0 6px 4px; padding-left: 22px; }
li { margin: 2px 0; }
strong { color: #14203a; }
code { font-family: "Cascadia Code", Consolas, monospace; font-size: 9pt;
       background: #eef1f8; padding: 1px 5px; border-radius: 4px; color: #b03060; }
pre { background: #1e2433; color: #e6e9f0; border-radius: 8px;
      padding: 12px 14px; overflow: hidden; page-break-inside: avoid;
      font-size: 7.5pt; line-height: 1.35; white-space: pre; }
pre code { background: none; color: inherit; padding: 0; font-size: 7.5pt;
           white-space: pre; }
blockquote { border-left: 4px solid #f0a030; background: #fff8ec;
             margin: 10px 0; padding: 8px 14px; border-radius: 0 6px 6px 0;
             color: #5a4a2a; page-break-inside: avoid; }
blockquote p { margin: 3px 0; }
table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 9.5pt;
        page-break-inside: avoid; }
th, td { border: 1px solid #c9d4ee; padding: 5px 9px; text-align: left;
         vertical-align: top; }
th { background: #eaf0fc; color: #2747b0; font-weight: 700; }
tr:nth-child(even) td { background: #f6f8fd; }
hr { border: none; border-top: 1px solid #d6deef; margin: 18px 0; }
em { color: #455; }
`;

const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>`;

writeFileSync(outPath, html, "utf8");
console.log("Wrote", outPath);

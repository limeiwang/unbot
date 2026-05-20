#!/usr/bin/env node
#!/usr/bin/env node
"use strict";var import_fs=require("fs");var import_core=require("@unbot/core");var import_fs2=require("fs");function bold(s){return`\x1B[1m${s}\x1B[22m`}function green(s){return`\x1B[32m${s}\x1B[39m`}function dim(s){return`\x1B[2m${s}\x1B[22m`}function red(s){return`\x1B[31m${s}\x1B[39m`}function printUsage(){console.log(`
${bold("unbot")} \u2014 ${dim("\u8BA9 AI \u6587\u672C\u66F4\u50CF\u771F\u4EBA\u804A\u5929")}

${bold("Usage:")}
  ${dim("# Pipe from another command")}
  echo "text" | unbot

  ${dim("# Read from file")}
  unbot -f input.txt

  ${dim("# Direct text argument")}
  unbot -t "First of all, hello world."

  ${dim("# Custom configuration")}
  unbot -f input.txt -c config.json

${bold("Options:")}
  -f, --file <path>      Read input from file
  -t, --text <text>      Direct text input
  -c, --config <path>    JSON config file for humanizer settings
  -o, --output <path>    Write result to file
  --json                 Output JSON with stats (machine-readable)
  --pretty               Colorized terminal output (default)
  -h, --help             Show this help
  -v, --version          Show version
`)}function formatResult(r,pretty){if(!pretty){return`---
${r.optimized}
---
\u{1F4CA} ${r.originalChars} chars \u2192 ${r.optimizedChars} chars (${Math.round((1-r.optimizedChars/r.originalChars)*100)}% reduction) \xB7 ${r.blocks.length} blocks
`}const lines=["",green("\u2713 Optimized:"),`  ${r.optimized}`,"",dim(`  ${r.originalChars} \u5B57 \u2192 ${r.optimizedChars} \u5B57 (${Math.round((1-r.optimizedChars/r.originalChars)*100)}%)`),dim(`  ${r.blocks.length} block(s)`),""];return lines.join("\n")}function readFromStdin(){return new Promise(resolve=>{const chunks=[];process.stdin.on("data",chunk=>chunks.push(Buffer.from(chunk)));process.stdin.on("end",()=>resolve(Buffer.concat(chunks).toString("utf-8").trim()))})}function parseArgs(){const args=process.argv.slice(2);const opts={help:false,version:false,json:false,pretty:process.stdout.isTTY};for(let i=0;i<args.length;i++){switch(args[i]){case"-h":case"--help":opts.help=true;break;case"-v":case"--version":opts.version=true;break;case"-f":case"--file":opts.file=args[++i];break;case"-t":case"--text":opts.text=args[++i];break;case"-c":case"--config":opts.config=args[++i];break;case"-o":case"--output":opts.output=args[++i];break;case"--json":opts.json=true;break;case"--pretty":opts.pretty=true;break}}return opts}function loadConfig(path){if(!path)return{};return JSON.parse((0,import_fs.readFileSync)(path,"utf-8"))}async function main(){const opts=parseArgs();if(opts.help){printUsage();return}if(opts.version){console.log("unbot v0.1.1");return}let input;if(opts.text){input=opts.text}else if(opts.file){input=(0,import_fs.readFileSync)(opts.file,"utf-8").trim()}else{if(process.stdin.isTTY){printUsage();process.exit(0)}input=await readFromStdin()}if(!input){console.error(red("Error: empty input"));process.exit(1)}const config=loadConfig(opts.config);const result=(0,import_core.optimize)(input,config);if(opts.json){const output=JSON.stringify({original:result.original,optimized:result.optimized,originalChars:result.originalChars,optimizedChars:result.optimizedChars,blocks:result.blocks,blockCount:result.blocks.length,reduction:result.originalChars>0?Math.round((1-result.optimizedChars/result.originalChars)*100):0},null,2);if(opts.output){(0,import_fs2.writeFileSync)(opts.output,output+"\n")}else{console.log(output)}}else{const output=formatResult(result,opts.pretty);if(opts.output){(0,import_fs2.writeFileSync)(opts.output,result.optimized+"\n")}else{console.log(output)}}}main().catch(e=>{console.error(red(`Error: ${e.message}`));process.exit(1)});

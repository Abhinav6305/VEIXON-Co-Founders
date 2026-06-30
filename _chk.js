const ts=require("typescript"),fs=require("fs");
const files=["src/lib/curriculum/frameworks.ts","src/components/home/IdeaConsole.tsx","src/app/results/[id]/page.tsx"];
let bad=0;
for(const f of files){
  const sf=ts.createSourceFile(f,fs.readFileSync(f,"utf8"),ts.ScriptTarget.ES2020,true,ts.ScriptKind.TSX);
  const e=sf.parseDiagnostics||[];
  if(e.length){bad++;console.log("FAIL "+f);e.slice(0,4).forEach(d=>{const p=sf.getLineAndCharacterOfPosition(d.start);console.log("  L"+(p.line+1)+": "+ts.flattenDiagnosticMessageText(d.messageText,"\n"))})}
  else console.log("OK   "+f);
}
console.log(bad?bad+" FAILED":"ALL CLEAN");

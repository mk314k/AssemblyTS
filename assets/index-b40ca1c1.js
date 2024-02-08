var O=Object.defineProperty;var $=(t,e,s)=>e in t?O(t,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[e]=s;var n=(t,e,s)=>($(t,typeof e!="symbol"?e+"":e,s),s);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))c(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const u of o.addedNodes)u.tagName==="LINK"&&u.rel==="modulepreload"&&c(u)}).observe(document,{childList:!0,subtree:!0});function s(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function c(r){if(r.ep)return;r.ep=!0;const o=s(r);fetch(r.href,o)}})();function I(t,e=5){let s=t.toString(2);return s.length<e&&(s="0".repeat(e-s.length)+s),s}class A{constructor(e){this.data=e}numValue(){return this.data}binaryRep(){return I(this.data,32)}hexRep(){return this.data.toString(16)}}class _{constructor(){n(this,"memory");this.memory=new Map}get(e){return this.memory.get(e)}set(e,s){this.memory.set(e,s)}outHTML(e){e&&(e.innerHTML="",this.memory.forEach((s,c)=>{const r=document.createElement("div");r.classList.add("mem-byte"),r.classList.add("flex-horizontal"),r.innerHTML=`
                <div class= 'address'>${c}</div>
                <div class= 'value'>${s.hexRep()}</div>
              `,e.appendChild(r)}))}}class y extends Error{constructor(){super("Invalid register index"),this.name="RegisterIndexError"}}class C extends Error{constructor(e){super(e),this.name="SyntaxError"}}const v={zero:"x0",ra:"x1",sp:"x2",gp:"x3",tp:"x4",t0:"x5",t1:"x6",t2:"x7",s0:"x8",s1:"x9",a0:"x10",a1:"x11",a2:"x12",a3:"x13",a4:"x14",a5:"x15",a6:"x16",a7:"x17",s2:"x18",s3:"x19",s4:"x20",s5:"x21",s6:"x22",s7:"x23",s8:"x24",s9:"x25",s10:"x26",s11:"x27",t3:"x28",t4:"x29",t5:"x30",t6:"x31"};function j(t){return/^x([0-9]|[1-2]\d|3[0-1])$/.test(t)||t in v}function R(t){if(typeof t=="number"){if(Number.isInteger(t)&&t>=0&&t<32)return t;throw new y}else{if(t in v)t=v[t];else if(!/^x([0-9]|[1-2]\d|3[0-1])$/.test(t))throw new y;return parseInt(t.slice(1))}}function p(t){return I(R(t),5)}function g(t){return typeof t=="number"?Number.isInteger(t)&&t>=0&&t<32:/^x([0-9]|[1-2]\d|3[0-1])$/.test(t)||t in v}class D{constructor(e=0){n(this,"val");this.val=e}jump(e){this.val=e}step(){this.val+=4}}class P{constructor(){n(this,"registers");this.registers=new Array(32).fill(0)}getValue(e){const s=R(e);return this.registers[s]}setValue(e,s){const c=R(e);c!=0&&(this.registers[c]=s)}outHTML(e){if(e){let s="";for(const c in v){let r=this.getValue(c).toString(16);r.length<8&&(r="0".repeat(8-r.length)+r),s+=`
            <div class="register flex-vertical">
              <span>${c}</span>
              <span>0x${r}</span>
              <span>${v[c]}</span>
            </div>
          `}e.innerHTML=s}}}const S=class{};let i=S;n(i,"registers",new P),n(i,"instMemory",new _),n(i,"dataMemory",new _),n(i,"pc",new D),n(i,"consoleLog",""),n(i,"consoleOut",e=>{e&&(e.innerHTML=S.consoleLog)});class M{constructor(e,s,c){n(this,"funct7","");n(this,"funct3","");n(this,"opcode","");n(this,"func",(e,s,c)=>{throw new Error("function not implemented")});this.reg1=e,this.reg2=s,this.reg_num=c}binaryRep(){throw new Error("Not Implemented Binary")}hexRep(){return this.numValue().toString(16)}numValue(){return parseInt(this.binaryRep(),2)}execute(){}}class h extends M{constructor(e,s,c){if(g(e)&&g(s)&&g(c))super(e,s,c);else throw new y;this.funct7="0000000",this.opcode="0110011"}binaryRep(){return this.funct7+p(this.reg_num)+p(this.reg2)+this.funct3+p(this.reg1)+this.opcode}execute(){i.registers.setValue(this.reg1,this.func(i.registers.getValue(this.reg2),i.registers.getValue(this.reg_num)))}}class f extends M{constructor(e,s,c){if(g(e)&&g(s))super(e,s,c);else throw new y;this.opcode="0010011"}binaryRep(){return I(this.reg_num,12)+p(this.reg2)+this.funct3+p(this.reg1)+this.opcode}execute(){i.registers.setValue(this.reg1,this.func(i.registers.getValue(this.reg2),this.reg_num))}}class H extends M{constructor(e,s,c){if(g(e)&&g(c))super(e,c,s);else throw new y;this.funct3="010"}}class m extends M{constructor(e,s,c){if(g(s)&&g(e))super(e,s,c);else throw new y;this.opcode="1100011"}execute(){i.pc.jump(this.func(i.registers.getValue(this.reg1),i.registers.getValue(this.reg2),this.reg_num))}}class N extends M{constructor(e,s="dec"){if(g(e))super(e,s);else throw new y}binaryRep(){return"1".repeat(32)}}class q extends N{execute(){i.consoleLog+=i.registers.getValue(this.reg1)+`
`}}class z extends N{execute(){var e;i.consoleLog+=(e=i.dataMemory.get(i.registers.getValue(this.reg1)))==null?void 0:e.numValue()}}class F extends H{constructor(){super(...arguments);n(this,"opcode","0000011");n(this,"funct3","010")}binaryRep(){return I(this.reg_num,12)+p(this.reg2)+this.funct3+p(this.reg1)+this.opcode}execute(){const s=i.dataMemory.get(i.registers.getValue(this.reg2)+this.reg_num);i.registers.setValue(this.reg1,s.numValue())}}class X extends H{constructor(){super(...arguments);n(this,"opcode","0100011");n(this,"funct3","010")}binaryRep(){const s=I(this.reg_num,12);return s.slice(0,7)+p(this.reg2)+p(this.reg1)+this.funct3+s.slice(7)+this.opcode}execute(){i.dataMemory.set(i.registers.getValue(this.reg2)+this.reg_num,new A(i.registers.getValue(this.reg1)))}}class K extends f{constructor(e,s){super(e,e,s)}execute(){i.registers.setValue(this.reg1,this.reg_num)}}class W extends f{constructor(e,s){super(e,e,s)}execute(){i.registers.setValue(this.reg1,this.reg_num)}}let a={add:(t,e)=>t+e,sub:(t,e)=>t-e,and:(t,e)=>t&e,or:(t,e)=>t|e,xor:(t,e)=>t^e,sll:(t,e)=>t+e,srl:(t,e)=>t+e,sra:(t,e)=>t+e};class G extends h{constructor(){super(...arguments);n(this,"funct3","000");n(this,"func",a.add)}}class J extends h{constructor(){super(...arguments);n(this,"funct3","000");n(this,"funct7","0100000");n(this,"func",a.sub)}}class Q extends h{constructor(){super(...arguments);n(this,"funct3","111");n(this,"func",a.and)}}class U extends h{constructor(){super(...arguments);n(this,"funct3","110");n(this,"func",a.or)}}class Y extends h{constructor(){super(...arguments);n(this,"funct3","100");n(this,"func",a.xor)}}class Z extends h{constructor(){super(...arguments);n(this,"funct3","001");n(this,"func",a.sll)}}class k extends h{constructor(){super(...arguments);n(this,"funct3","101");n(this,"func",a.srl)}}class ee extends h{constructor(){super(...arguments);n(this,"funct3","101");n(this,"funct7","0100000");n(this,"func",a.sra)}}class te extends f{constructor(){super(...arguments);n(this,"funct3","000");n(this,"func",a.add)}}class se extends f{constructor(){super(...arguments);n(this,"funct3","111");n(this,"func",a.and)}}class ne extends f{constructor(){super(...arguments);n(this,"funct3","110");n(this,"func",a.or)}}class re extends f{constructor(){super(...arguments);n(this,"funct3","100");n(this,"func",a.xor)}}class ie extends f{constructor(){super(...arguments);n(this,"func",(s,c)=>s+c)}}class ce extends f{constructor(){super(...arguments);n(this,"func",(s,c)=>s+c)}}class oe extends f{constructor(){super(...arguments);n(this,"funct3","001");n(this,"func",a.sll)}}class ue extends f{constructor(){super(...arguments);n(this,"funct3","101");n(this,"func",a.srl)}}class ae extends f{constructor(){super(...arguments);n(this,"funct3","101");n(this,"funct7","0100000");n(this,"func",a.sra)}}class le extends m{constructor(){super(...arguments);n(this,"func",(s,c,r)=>s==c?r:i.pc.val)}}class de extends m{constructor(){super(...arguments);n(this,"func",(s,c,r)=>s!=c?r:i.pc.val)}}class fe extends m{constructor(){super(...arguments);n(this,"func",(s,c,r)=>s<c?r:i.pc.val)}}class ge extends m{constructor(){super(...arguments);n(this,"func",(s,c,r)=>s<=c?r:i.pc.val)}}class pe extends m{constructor(){super(...arguments);n(this,"func",(s,c,r)=>s>c?r:i.pc.val)}}class xe extends m{constructor(){super(...arguments);n(this,"func",(s,c,r)=>s>=c?r:i.pc.val)}}class he extends m{constructor(){super(...arguments);n(this,"func",(s,c,r)=>s==c?r:i.pc.val)}}class me extends m{constructor(){super(...arguments);n(this,"func",(s,c,r)=>s==c?r:i.pc.val)}}class ye extends M{constructor(){super()}binaryRep(){return"1100"+"0000".repeat(7)}execute(){i.pc.jump(i.registers.getValue("ra")-4)}}const T=new Map([["print",q],["printm",z],["add",G],["sub",J],["and",Q],["or",U],["xor",Y],["sll",Z],["srl",k],["sra",ee],["addi",te],["andi",se],["ori",ne],["xori",re],["slti",ie],["sltiu",ce],["slli",oe],["srli",ue],["srai",ae],["beq",le],["bne",de],["blt",fe],["bge",xe],["bgt",pe],["ble",ge],["bltu",he],["bgeu",me],["lw",F],["sw",X],["li",K],["lui",W],["ret",ye]]),b=new Map;function E(t){return t===void 0?"":(t=t.trim(),b.has(t)?b.get(t):j(t)?(console.log(t),t):parseFloat(t))}function we(t,e=540,s){const c=t.split(`
`);let r=s;r===void 0&&(r=new Map);let o=e;b.clear();for(let u of c)if(u=u.trim(),u)if(u.endsWith(":"))b.set(u.slice(0,u.length-1),o);else{u=u.replace(/\(/g,",").replace(/\)/g,"");const l=u.split(","),d=l[0].split(" ");if(T.has(d[0])){const x=T.get(d[0]),V=E(d[1]);if(V){const w=E(l[1]);if(w||w===0){const L=E(l[2]);if(L||L===0){const B=new x(V,w,L);r.set(o,B)}else{const B=new x(V,w);r.set(o,B)}}else{const L=new x(V);r.set(o,L)}}else{const w=new x;r.set(o,w)}o=o+4}else throw new C(`${d[0]} is not a defined Assembly instruction`)}if(s===void 0)return r}function ve(){const t=document.getElementById("registers"),e=document.getElementById("instruction-memory"),s=document.getElementById("data-memory"),c=document.getElementById("console");i.dataMemory.outHTML(s),i.registers.outHTML(t),i.instMemory.outHTML(e);function r(){const l=document.getElementById("code").value,d=document.getElementById("buildAddr");let x=parseInt(d.value);isNaN(x)&&(x=540),we(l,x,i.instMemory),i.instMemory.outHTML(e)}function o(){const u=document.getElementById("runAddr");let l=parseInt(u.value);for(isNaN(l)&&(l=540),i.pc.jump(l);i.pc.val!==0;)i.instMemory.get(i.pc.val).execute(),i.pc.step();i.dataMemory.outHTML(s),i.registers.outHTML(t),i.consoleOut(c)}if(t!==null&&e!==null&&s){const u=document.getElementById("buildRun"),l=document.getElementById("build"),d=document.getElementById("run");u==null||u.addEventListener("click",()=>{r(),o()}),l==null||l.addEventListener("click",()=>{r()}),d==null||d.addEventListener("click",()=>{o()})}}document.addEventListener("DOMContentLoaded",ve);

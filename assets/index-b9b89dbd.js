var A=Object.defineProperty;var H=(t,e,s)=>e in t?A(t,e,{enumerable:!0,configurable:!0,writable:!0,value:s}):t[e]=s;var i=(t,e,s)=>(H(t,typeof e!="symbol"?e+"":e,s),s);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const u of n)if(u.type==="childList")for(const o of u.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&r(o)}).observe(document,{childList:!0,subtree:!0});function s(n){const u={};return n.integrity&&(u.integrity=n.integrity),n.referrerPolicy&&(u.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?u.credentials="include":n.crossOrigin==="anonymous"?u.credentials="omit":u.credentials="same-origin",u}function r(n){if(n.ep)return;n.ep=!0;const u=s(n);fetch(n.href,u)}})();function S(t,e=5){let s=t.toString(2);return s.length<e&&(s="0".repeat(e-s.length)+s),s}class N{constructor(e){this.data=e}numValue(){return this.data}binaryRep(){return S(this.data,32)}hexRep(){return this.data.toString(16)}}class R{constructor(){i(this,"memory");this.memory=new Map}get(e){return this.memory.get(e)}set(e,s){this.memory.set(e,s)}outHTML(e){e&&(e.innerHTML="",this.memory.forEach((s,r)=>{const n=document.createElement("div");n.classList.add("mem-byte"),n.classList.add("flex-horizontal"),n.innerHTML=`
                <div class= 'address'>${r}</div>
                <div class= 'value'>${s.hexRep()}</div>
              `,e.appendChild(n)}))}}class m extends Error{constructor(){super("Invalid register index"),this.name="RegisterIndexError"}}class O extends Error{constructor(e){super(e),this.name="SyntaxError"}}const h={zero:"x0",ra:"x1",sp:"x2",gp:"x3",tp:"x4",t0:"x5",t1:"x6",t2:"x7",s0:"x8",s1:"x9",a0:"x10",a1:"x11",a2:"x12",a3:"x13",a4:"x14",a5:"x15",a6:"x16",a7:"x17",s2:"x18",s3:"x19",s4:"x20",s5:"x21",s6:"x22",s7:"x23",s8:"x24",s9:"x25",s10:"x26",s11:"x27",t3:"x28",t4:"x29",t5:"x30",t6:"x31"};function $(t){return/^x([0-9]|[1-2]\d|3[0-1])$/.test(t)||t in h}function E(t){if(typeof t=="number"){if(Number.isInteger(t)&&t>=0&&t<32)return t;throw new m}else{if(t in h)t=h[t];else if(!/^x([0-9]|[1-2]\d|3[0-1])$/.test(t))throw new m;return parseInt(t.slice(1))}}function v(t){return S(E(t),5)}function f(t){return typeof t=="number"?Number.isInteger(t)&&t>=0&&t<32:/^x([0-9]|[1-2]\d|3[0-1])$/.test(t)||t in h}class j{constructor(e=0){i(this,"val");this.val=e}jump(e){this.val=e}step(){this.val+=4}}class D{constructor(){i(this,"registers");this.registers=new Array(32).fill(0)}getValue(e){const s=E(e);return this.registers[s]}setValue(e,s){const r=E(e);this.registers[r]=s}outHTML(e){if(e){let s="";for(const r in h){let n=this.getValue(r).toString(16);n.length<8&&(n="0".repeat(8-n.length)+n),s+=`
            <div class="register flex-vertical">
              <span>${r}</span>
              <span>0x${n}</span>
              <span>${h[r]}</span>
            </div>
          `}e.innerHTML=s}}}class c{}i(c,"registers",new D),i(c,"instMemory",new R),i(c,"dataMemory",new R),i(c,"pc",new j);class w{constructor(e,s,r){i(this,"funct7","");i(this,"funct3","");i(this,"opcode","");i(this,"func",(e,s,r)=>{throw new Error("function not implemented")});this.reg1=e,this.reg2=s,this.reg_num=r}binaryRep(){return""}hexRep(){return this.numValue().toString(16)}numValue(){return parseInt(this.binaryRep(),2)}execute(){}}class g extends w{constructor(e,s,r){if(f(e)&&f(s)&&f(r))super(e,s,r);else throw new m;this.funct7="0000000",this.opcode="0110011"}binaryRep(){return this.funct7+v(this.reg_num)+v(this.reg2)+this.funct3+v(this.reg1)+this.opcode}execute(){c.registers.setValue(this.reg1,this.func(c.registers.getValue(this.reg2),c.registers.getValue(this.reg_num)))}}class l extends w{constructor(e,s,r){if(f(e)&&f(s))super(e,s,r);else throw new m;this.opcode="0010011"}binaryRep(){return S(this.reg_num)+v(this.reg2)+this.funct3+v(this.reg1)+this.opcode}execute(){c.registers.setValue(this.reg1,this.func(c.registers.getValue(this.reg2),this.reg_num))}}class T extends w{constructor(e,s,r){if(f(e)&&f(r))super(e,r,s);else throw new m;this.funct3="010"}}class p extends w{constructor(e,s,r){if(f(s)&&f(e))super(e,s,r);else throw new m}execute(){c.pc.jump(this.func(c.registers.getValue(this.reg1),c.registers.getValue(this.reg2),this.reg_num))}}class P extends T{execute(){const e=c.dataMemory.get(c.registers.getValue(this.reg2)+this.reg_num);c.registers.setValue(this.reg1,e.numValue())}}class q extends T{execute(){c.dataMemory.set(c.registers.getValue(this.reg2)+this.reg_num,new N(c.registers.getValue(this.reg1)))}}class C extends l{constructor(e,s){super(e,e,s)}execute(){c.registers.setValue(this.reg1,this.reg_num)}}class z extends l{constructor(e,s){super(e,e,s)}execute(){c.registers.setValue(this.reg1,this.reg_num)}}let a={add:(t,e)=>t+e,sub:(t,e)=>t-e,and:(t,e)=>t&e,or:(t,e)=>t|e,xor:(t,e)=>t^e,sll:(t,e)=>t+e,srl:(t,e)=>t+e,sra:(t,e)=>t+e};class X extends g{constructor(){super(...arguments);i(this,"funct3","000");i(this,"func",a.add)}}class F extends g{constructor(){super(...arguments);i(this,"funct3","000");i(this,"funct7","0100000");i(this,"func",a.sub)}}class K extends g{constructor(){super(...arguments);i(this,"funct3","111");i(this,"func",a.and)}}class W extends g{constructor(){super(...arguments);i(this,"funct3","110");i(this,"func",a.or)}}class G extends g{constructor(){super(...arguments);i(this,"funct3","100");i(this,"func",a.xor)}}class J extends g{constructor(){super(...arguments);i(this,"funct3","001");i(this,"func",a.sll)}}class Q extends g{constructor(){super(...arguments);i(this,"funct3","101");i(this,"func",a.srl)}}class U extends g{constructor(){super(...arguments);i(this,"funct3","101");i(this,"funct7","0100000");i(this,"func",a.sra)}}class Y extends l{constructor(){super(...arguments);i(this,"func",a.add)}}class Z extends l{constructor(){super(...arguments);i(this,"func",a.and)}}class k extends l{constructor(){super(...arguments);i(this,"func",a.or)}}class ee extends l{constructor(){super(...arguments);i(this,"func",a.xor)}}class te extends l{constructor(){super(...arguments);i(this,"func",(s,r)=>s+r)}}class se extends l{constructor(){super(...arguments);i(this,"func",(s,r)=>s+r)}}class ne extends l{constructor(){super(...arguments);i(this,"func",a.sll)}}class re extends l{constructor(){super(...arguments);i(this,"func",a.srl)}}class ie extends l{constructor(){super(...arguments);i(this,"func",a.sra)}}class ce extends p{constructor(){super(...arguments);i(this,"func",(s,r,n)=>s==r?n:c.pc.val)}}class ue extends p{constructor(){super(...arguments);i(this,"func",(s,r,n)=>s!=r?n:c.pc.val)}}class oe extends p{constructor(){super(...arguments);i(this,"func",(s,r,n)=>s<r?n:c.pc.val)}}class ae extends p{constructor(){super(...arguments);i(this,"func",(s,r,n)=>s<=r?n:c.pc.val)}}class le extends p{constructor(){super(...arguments);i(this,"func",(s,r,n)=>s>r?n:c.pc.val)}}class de extends p{constructor(){super(...arguments);i(this,"func",(s,r,n)=>s>=r?n:c.pc.val)}}class fe extends p{constructor(){super(...arguments);i(this,"func",(s,r,n)=>s==r?n:c.pc.val)}}class xe extends p{constructor(){super(...arguments);i(this,"func",(s,r,n)=>s==r?n:c.pc.val)}}class ge extends w{constructor(){super()}binaryRep(){return"1100"+"0000".repeat(7)}execute(){c.pc.jump(c.registers.getValue("ra")-4)}}const _=new Map([["add",X],["sub",F],["and",K],["or",W],["xor",G],["sll",J],["srl",Q],["sra",U],["addi",Y],["andi",Z],["ori",k],["xori",ee],["slti",te],["sltiu",se],["slli",ne],["srli",re],["srai",ie],["beq",ce],["bne",ue],["blt",oe],["bge",de],["bgt",le],["ble",ae],["bltu",fe],["bgeu",xe],["lw",P],["sw",q],["li",C],["lui",z],["ret",ge]]),L=new Map;function B(t){return t===void 0?"":(t=t.trim(),L.has(t)?L.get(t):$(t)?t:parseInt(t))}function pe(t,e=540,s){const r=t.split(`
`);let n=s;n===void 0&&(n=new Map);let u=e;L.clear();for(let o of r)if(o=o.trim(),o)if(o.endsWith(":"))L.set(o.slice(0,o.length-1),u);else{o=o.replace(/\(/g,",").replace(/\)/g,"");const d=o.split(","),x=d[0].split(" ");if(_.has(x[0])){const M=_.get(x[0]),I=B(x[1]);if(I){const y=B(d[1]);if(y){const b=B(d[2]);if(b){const V=new M(I,y,b);n.set(u,V)}else{const V=new M(I,y);n.set(u,V)}}else{const b=new M(I);n.set(u,b)}}else{const y=new M;n.set(u,y)}u=u+4}else throw new O(`${x[0]} is not a defined Assembly instruction`)}if(s===void 0)return n}function me(){const t=document.getElementById("registers"),e=document.getElementById("instruction-memory"),s=document.getElementById("data-memory");c.dataMemory.outHTML(s),c.registers.outHTML(t),c.instMemory.outHTML(e);function r(){const o=document.getElementById("code").value,d=document.getElementById("buildAddr");let x=parseInt(d.value);isNaN(x)&&(x=540),pe(o,x,c.instMemory),c.instMemory.outHTML(e)}function n(){const u=document.getElementById("runAddr");let o=parseInt(u.value);for(isNaN(o)&&(o=540),c.pc.jump(o);c.pc.val!==0;)c.instMemory.get(c.pc.val).execute(),c.pc.step();c.dataMemory.outHTML(s),c.registers.outHTML(t)}if(t!==null&&e!==null&&s){const u=document.getElementById("buildRun"),o=document.getElementById("build"),d=document.getElementById("run");u==null||u.addEventListener("click",()=>{r(),n()}),o==null||o.addEventListener("click",()=>{r()}),d==null||d.addEventListener("click",()=>{n()})}}document.addEventListener("DOMContentLoaded",me);

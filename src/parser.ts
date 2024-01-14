import { AssemblyInstruction, instructions } from "./instruction";
import { SyntaxError } from "./exception";
import { Register, regValidStr } from "./register";
import { Memory } from "./memory";

const labels:Map<string, number> = new Map();

function getRegNum(arg:string|undefined):Register|number{
    if (arg === undefined){
        return '';
    }
    arg = arg.trim();
    if (labels.has(arg)){
        return labels.get(arg) as number;
    }else if(regValidStr(arg)){
        return arg;
    }else{
        return parseInt(arg);
    }
}
type pseudoMem = Map<number, AssemblyInstruction>;

export function parser(code:string, start_addr=540, memory?:Memory):pseudoMem|void{
    const lines = code.split("\n");
    let instMem:Memory|pseudoMem|undefined = memory;
    if (instMem === undefined){
        instMem = new Map<number, AssemblyInstruction>;
    }
    let addr = start_addr;
    labels.clear();
    for (let line of lines){
        line = line.trim();
        if (line){
            if (line.endsWith(':')){
                labels.set(line.slice(0, line.length - 1), addr)
            }else{
                const idrdres = line.split(',');
                const idrd = idrdres[0].split(' ');
                if (instructions.has(idrd[0])){
                    const id = instructions.get(idrd[0]) as typeof AssemblyInstruction;
                    const reg1 = getRegNum(idrd[1]);
                    if (reg1){
                        const reg2 = getRegNum(idrdres[1]);
                        if (reg2){
                            const reg3 = getRegNum(idrdres[2]);
                            if (reg3){
                                const inst = new id(reg1, reg2, reg3);
                                instMem.set(addr, inst);
                            }else{
                                const inst = new id(reg1, reg2);
                                instMem.set(addr, inst);
                            }
                        }else{
                            const inst = new id(reg1);
                            instMem.set(addr, inst);
                        }
                    }else{
                        const inst = new id();
                        instMem.set(addr, inst);
                    }
                    addr = addr + 4;
                }else{
                    throw new SyntaxError(`${idrd[0]} is not a defined Assembly instruction`);
                }

            }
        }
    }
    if (memory === undefined){
        return instMem as pseudoMem;
    }
}
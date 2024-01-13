import { AssemblyInstruction, instructions, InstructionSet } from "./instruction";
import { SyntaxError } from "./exception";

export function parser(code:string, start_addr=540):InstructionSet{
    const lines = code.split("\n");
    const instSet = new InstructionSet();
    const labels:Map<string, number> = new Map();
    let addr = start_addr;
    for (let line of lines){
        line = line.trim();
        if (line.endsWith(':')){
            labels.set(line.slice(0, line.length - 1), addr)
        }else{
            const idrdres = line.split(',');
            const idrd = idrdres[0].split(' ');
            if (instructions.has(idrd[0])){
                const id = instructions.get(idrd[0]) as typeof AssemblyInstruction;
                console.log(idrd, "inst", idrdres);
                const inst = new id(idrd[1], idrdres[1], idrdres[2]);
                instSet.addInstruction(inst);
            }else{
                throw new SyntaxError(`${line} has wrong syntax`);
            }

        }
    }
    return instSet;
}
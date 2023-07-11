import { instructions, AssemblyInstruction } from "./instruction";


export function parser(code:string):AssemblyInstruction{
    const lines = code.split("\n");
    const instSet = new AssemblyInstruction();
    for (const line of lines){
        if (line.endsWith(':')){

        }else{
            const inst = line.split(',');
            const idrd = inst[0].split(' ');
            if (instructions.has(idrd[0])){
                instSet.addInstruction(idrd, inst);
            }else{
                throw new Error();
            }

        }
    }
    return instSet;
}
export class consoleBox{
    public static consoleElem:HTMLElement|null;
    public static init(){
        consoleBox.consoleElem = document.getElementById('console');
    }
    public static log(logText:string){
        if (consoleBox.consoleElem){
            consoleBox.consoleElem.innerText += `${logText}\n`;
        }else{
            console.log(logText);
        }
    }
}
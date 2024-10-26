export class CodeEditor {
    private static editor: HTMLElement | null;
    private static lineElem: HTMLElement | null;
    public static lineNum = 0;
    public static code = '';

    public static init(code='') {
        this.editor = document.getElementById('code');
        this.lineElem = document.getElementById('lineNum');

        if (this.editor) {
            this.editor.addEventListener('input', this.updateCode.bind(this));
            this.editor.addEventListener('keydown', this.handleKeyDown.bind(this));
            this.editor.addEventListener('scroll', this.syncScroll.bind(this));
        }

        
        if (code !== ''){
            this.changeCode(code);
            const codeLine = code.split('\n').length;
            console.log(codeLine);
            this.updateLineNumbers(codeLine);
        }else{
            this.updateLineNumbers(1);
        }
    }

    private static updateCode(e: Event) {
        this.code = (e.target as HTMLElement).innerText;
    }
    public static changeCode(newCode:string){
        if (this.editor && this.lineElem){
            this.code = newCode;
            this.editor.innerText = newCode;
        }
    }

    private static handleKeyDown(event: KeyboardEvent) {
        if (this.lineElem) {
            if (event.key === 'Enter') {
                this.updateLineNumbers(1);
            } else if (event.key === 'Backspace') {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    if (range.startOffset === 0 && range.endOffset === 0) {
                        this.updateLineNumbers(-1);
                    }
                }
            }
        }
    }

    private static syncScroll() {
        if (this.lineElem && this.editor) {
            this.lineElem.scrollTop = this.editor.scrollTop;
        }
    }

    private static updateLineNumbers(ch:number) {
        const prevLine = this.lineNum;
        this.lineNum = Math.max(1, this.lineNum + ch);
        const lineDiff = this.lineNum - prevLine;
        if (this.lineElem) {
            if (ch === 1){
                this.lineElem.innerText += `${this.lineNum}\n`;
            }else if (lineDiff !== 0){
                let lines = this.lineElem.innerText.split('\n').filter(line => line.trim() !== '');
                if (lineDiff > 0) {
                    for (let i = 1; i <= lineDiff; i++) {
                        lines.push(`${prevLine + i}`);
                    }
                } else if (lineDiff < 0) {
                    lines = lines.slice(0, prevLine + lineDiff);
                }
                this.lineElem.innerText = lines.join('\n') + '\n';
            }
        }
    }
}


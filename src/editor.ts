export class CodeEditor {
    private static editor: HTMLElement | null;
    private static lineElem: HTMLElement | null;
    public static lineNum = 0;
    public static code = '';

    public static init() {
        this.editor = document.getElementById('code');
        this.lineElem = document.getElementById('lineNum');

        if (this.editor) {
            this.editor.addEventListener('input', this.updateCode.bind(this));
            this.editor.addEventListener('keydown', this.handleKeyDown.bind(this));
            this.editor.addEventListener('scroll', this.syncScroll.bind(this));
        }

        this.updateLineNumbers(1);
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
        if (this.lineElem) {
            if (ch === 1){
                this.lineElem.innerText += `${this.lineNum}\n`;
            }else if(prevLine > 1){
                const lines = this.lineElem.innerText.split('\n');
                lines.pop();lines.pop(); 
                this.lineElem.innerText = lines.join('\n') + '\n';
            }
        }
    }
}


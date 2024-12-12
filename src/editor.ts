export class CodeEditor {
  private static editor: HTMLElement | null;
  private static lineElem: HTMLElement | null;
  public static lineNum = 0;
  public static code = '';

  public static init(code = ''): void {
    this.editor = document.getElementById('code');
    this.lineElem = document.getElementById('lineNum');

    if (this.editor) {
      this.editor.setAttribute('spellcheck', 'false');
      this.editor.setAttribute('autocorrect', 'off');
      this.editor.setAttribute('autocapitalize', 'off');
      this.editor.addEventListener('input', this.updateCode.bind(this));
      this.editor.addEventListener('keydown', this.handleKeyDown.bind(this));
      this.editor.addEventListener('scroll', this.syncScroll.bind(this));
    }

    if (code !== '') {
      this.changeCode(code);
    } else {
      this.renderLineNumbers(1);
    }
  }

  private static countLines(text: string): number {
    if (!text) return 1;
    // Normalize trailing newline quirks from contenteditable innerText
    const normalized = text.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');
    return Math.max(1, lines.length);
  }

  private static updateCode(e: Event): void {
    const target = e.target as HTMLElement;
    this.code = target.innerText;
    this.renderLineNumbers(this.countLines(this.code));
  }

  public static changeCode(newCode: string): void {
    if (this.editor && this.lineElem) {
      this.code = newCode;
      this.editor.innerText = newCode;
      this.renderLineNumbers(this.countLines(newCode));
    }
  }

  private static handleKeyDown(event: KeyboardEvent): void {
    // Support Tab key for indentation inside the editor
    if (event.key === 'Tab') {
      event.preventDefault();
      document.execCommand('insertText', false, '    ');
    }
  }

  private static syncScroll(): void {
    if (this.lineElem && this.editor) {
      this.lineElem.scrollTop = this.editor.scrollTop;
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


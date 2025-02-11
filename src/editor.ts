export class CodeEditor {
  private static editor: HTMLElement | null;
  private static lineElem: HTMLElement | null;
  public static lineNum = 0;
  public static activeLine: number | null = null;
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
    const normalized = text.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');
    return Math.max(1, lines.length);
  }

  private static updateCode(e: Event): void {
    const target = e.target as HTMLElement;
    this.code = target.innerText;
    this.activeLine = null;
    this.renderLineNumbers(this.countLines(this.code));
  }

  public static changeCode(newCode: string): void {
    if (this.editor && this.lineElem) {
      this.code = newCode;
      this.editor.innerText = newCode;
      this.activeLine = null;
      this.renderLineNumbers(this.countLines(newCode));
    }
  }

  /**
   * Highlights the specified 1-based source line number in the line gutter during step debugging,
   * or clears the highlight when `lineNo` is `null`.
   */
  public static setActiveLine(lineNo: number | null): void {
    this.activeLine = lineNo;
    if (!this.lineElem) return;

    const children = this.lineElem.querySelectorAll('.line-num-row');
    children.forEach((el) => {
      const rowNum = Number(el.getAttribute('data-line'));
      if (lineNo !== null && rowNum === lineNo) {
        el.classList.add('active-source-line');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('active-source-line');
      }
    });
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
  }

  private static renderLineNumbers(totalLines: number): void {
    this.lineNum = Math.max(1, totalLines);
    if (this.lineElem) {
      const nums: string[] = [];
      for (let i = 1; i <= this.lineNum; i++) {
        nums.push(`${i}`);
      }
      this.lineElem.innerText = nums.join('\n') + '\n';
    }
  }
}

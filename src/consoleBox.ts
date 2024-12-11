import { StateVar } from 'statebinderk';

interface ConsoleEntry {
  text: string;
  type: 'output' | 'error' | 'info' | 'clear';
}

export class consoleBox {
  public static consoleState: StateVar<ConsoleEntry>;

  public static init(): void {
    consoleBox.consoleState = new StateVar<ConsoleEntry>(
      { text: '', type: 'clear' },
      'console',
      (elem, entry) => {
        if (entry.type === 'clear') {
          elem.innerHTML = '';
          return;
        }
        if (!entry.text && entry.type === 'output') {
          return;
        }
        const line = document.createElement('div');
        line.className = `console-line console-${entry.type}`;
        line.innerText = entry.text.endsWith('\n') ? entry.text.slice(0, -1) : entry.text;
        elem.appendChild(line);
        elem.scrollTop = elem.scrollHeight;
      }
    );
  }

  public static clear(): void {
    if (consoleBox.consoleState) {
      consoleBox.consoleState.transition({ text: '', type: 'clear' });
    }
  }

  public static log(logText: string, type: 'output' | 'error' | 'info' = 'output'): void {
    if (consoleBox.consoleState) {
      consoleBox.consoleState.transition({ text: logText, type });
    } else {
      console.log(logText);
    }
  }
}

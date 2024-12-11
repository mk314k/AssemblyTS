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
    }
}
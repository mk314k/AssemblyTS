import { StateVarList } from 'statebinderk';
import { RegisterIndexError } from './exception';
import { numToBin } from './memory';
import { Register } from './register';

const armRegMap: { [key: string]: string } = {
  r0: "r0",
  r1: "r1",
  r2: "r2",
  r3: "r3",
  r4: "r4",
  r5: "r5",
  r6: "r6",
  r7: "r7",
  r8: "r8",
  r9: "r9",
  r10: "r10",
  fp: "r11",
  ip: "r12",
  sp: "r13",
  lr: "r14",
  pc: "r15",
};

const armAliases: { [key: string]: string } = {
  fp: "r11",
  ip: "r12",
  sp: "r13",
  lr: "r14",
  pc: "r15",
};

const indexToArmDisplay: { abi: string; canonical: string }[] = [
  { abi: "r0", canonical: "r0" },
  { abi: "r1", canonical: "r1" },
  { abi: "r2", canonical: "r2" },
  { abi: "r3", canonical: "r3" },
  { abi: "r4", canonical: "r4" },
  { abi: "r5", canonical: "r5" },
  { abi: "r6", canonical: "r6" },
  { abi: "r7", canonical: "r7" },
  { abi: "r8", canonical: "r8" },
  { abi: "r9", canonical: "r9" },
  { abi: "r10", canonical: "r10" },
  { abi: "fp", canonical: "r11" },
  { abi: "ip", canonical: "r12" },
  { abi: "sp", canonical: "r13" },
  { abi: "lr", canonical: "r14" },
  { abi: "pc", canonical: "r15" },
];

export function armRegValidStr(reg: string): boolean {
  const cleaned = reg.trim().toLowerCase();
  const pattern = /^r([0-9]|1[0-5])$/;
  return pattern.test(cleaned) || cleaned in armAliases;
}

export function armRegValid(reg: Register | undefined): boolean {
  if (reg === undefined || reg === null) {
    return false;
  }
  if (typeof reg === 'number') {
    return Number.isInteger(reg) && reg >= 0 && reg <= 15;
  }
  return armRegValidStr(reg);
}

export function armRegToIndex(reg: Register): number {
  if (typeof reg === 'number') {
    if (Number.isInteger(reg) && reg >= 0 && reg <= 15) {
      return reg;
    }
    throw new RegisterIndexError(`ARM register index ${reg} out of range (0-15)`);
  }
  const cleaned = reg.trim().toLowerCase();
  const mapped = cleaned in armAliases ? armAliases[cleaned] : cleaned;
  const pattern = /^r([0-9]|1[0-5])$/;
  if (!pattern.test(mapped)) {
    throw new RegisterIndexError(`Invalid ARM register "${reg}"`);
  }
  return parseInt(mapped.slice(1), 10);
}

export function armRegToBin(reg: Register): string {
  return numToBin(armRegToIndex(reg), 4);
}

/**
 * ARM Current Program Status Register (CPSR) condition flags (N, Z, C, V).
 */
export class CPSRFlags {
  public n = false;
  public z = false;
  public c = false;
  public v = false;

  reset(): void {
    this.n = false;
    this.z = false;
    this.c = false;
    this.v = false;
  }

  updateNZ(result: number): void {
    const s32 = result | 0;
    this.n = s32 < 0;
    this.z = s32 === 0;
  }

  updateAdd(a: number, b: number): number {
    const ua = a >>> 0;
    const ub = b >>> 0;
    const sa = a | 0;
    const sb = b | 0;
    const res = (sa + sb) | 0;
    this.n = res < 0;
    this.z = res === 0;
    this.c = ua + ub > 0xffffffff;
    this.v = (sa >= 0 && sb >= 0 && res < 0) || (sa < 0 && sb < 0 && res >= 0);
    return res;
  }

  updateSub(a: number, b: number): number {
    const ua = a >>> 0;
    const ub = b >>> 0;
    const sa = a | 0;
    const sb = b | 0;
    const res = (sa - sb) | 0;
    this.n = res < 0;
    this.z = res === 0;
    // In ARM, C=1 on subtraction when there is NO borrow (ua >= ub)
    this.c = ua >= ub;
    this.v = (sa >= 0 && sb < 0 && res < 0) || (sa < 0 && sb >= 0 && res >= 0);
    return res;
  }

  checkCond(cond: string): boolean {
    const c = cond.toLowerCase();
    switch (c) {
      case 'al':
      case '':
        return true;
      case 'eq':
        return this.z;
      case 'ne':
        return !this.z;
      case 'cs':
      case 'hs':
        return this.c;
      case 'cc':
      case 'lo':
        return !this.c;
      case 'mi':
        return this.n;
      case 'pl':
        return !this.n;
      case 'vs':
        return this.v;
      case 'vc':
        return !this.v;
      case 'hi':
        return this.c && !this.z;
      case 'ls':
        return !this.c || this.z;
      case 'ge':
        return this.n === this.v;
      case 'lt':
        return this.n !== this.v;
      case 'gt':
        return !this.z && this.n === this.v;
      case 'le':
        return this.z || this.n !== this.v;
      default:
        return false;
    }
  }
}

/**
 * ARMRegisterSet class to manage 16 32-bit ARM registers (`r0`..`r15`)
 * and 4 CPSR flags (`N`, `Z`, `C`, `V`) with reactive DOM binding via `statebinderk`.
 */
export class ARMRegisterSet {
  public readonly registers: number[];
  public readonly flags = new CPSRFlags();
  private regStateList: StateVarList<number>;

  constructor() {
    this.registers = new Array(16).fill(0);
    const initialStates = Array.from({ length: 16 }, (_, i) => ({
      id: `arm-reg-r${i}`,
      state: 0,
    }));

    this.regStateList = new StateVarList<number>(initialStates, (elem, rawVal) => {
      const abiName = elem.getAttribute('data-abi') || '';
      const rName = elem.getAttribute('data-r') || '';
      const unsignedHex = (rawVal >>> 0).toString(16).padStart(8, '0');
      elem.classList.toggle('register-active', rawVal !== 0);
      elem.title = `${abiName} (${rName}): ${rawVal} (0x${unsignedHex})`;

      const hexSpan = elem.querySelector('.reg-val');
      const decSpan = elem.querySelector('.reg-dec');
      if (hexSpan) hexSpan.textContent = `0x${unsignedHex}`;
      if (decSpan) decSpan.textContent = `${rawVal}`;
    });
  }

  reset(): void {
    this.registers.fill(0);
    this.flags.reset();
    if (typeof document !== 'undefined') {
      this.regStateList.listTransition(new Array(16).fill(0));
      this.syncFlagsDOM();
    }
  }

  getValue(reg: Register): number {
    const index = armRegToIndex(reg);
    return this.registers[index];
  }

  setValue(reg: Register, value: number): void {
    const index = armRegToIndex(reg);
    const val32 = value | 0;
    this.registers[index] = val32;
    if (typeof document !== 'undefined') {
      this.regStateList.transition(index, val32);
    }
  }

  syncFlagsDOM(): void {
    if (typeof document === 'undefined') return;
    const flagMap: [string, boolean][] = [
      ['cpsr-n', this.flags.n],
      ['cpsr-z', this.flags.z],
      ['cpsr-c', this.flags.c],
      ['cpsr-v', this.flags.v],
    ];
    for (const [id, active] of flagMap) {
      const el = document.getElementById(id);
      if (el) {
        el.classList.toggle('register-active', active);
        const valEl = el.querySelector('.reg-val');
        if (valEl) valEl.textContent = active ? '1' : '0';
      }
    }
  }

  outHTML(regElement: HTMLElement | null): void {
    if (!regElement || typeof document === 'undefined') return;

    if (!regElement.querySelector('#arm-reg-r0')) {
      let html = `
        <div id="cpsr-n" class="register cpsr-flag flex-vertical" title="CPSR Negative Flag (N)">
          <div class="reg-header"><span class="reg-abi">N</span><span class="reg-num">CPSR</span></div>
          <span class="reg-val">0</span>
          <span class="reg-dec">neg</span>
        </div>
        <div id="cpsr-z" class="register cpsr-flag flex-vertical" title="CPSR Zero Flag (Z)">
          <div class="reg-header"><span class="reg-abi">Z</span><span class="reg-num">CPSR</span></div>
          <span class="reg-val">0</span>
          <span class="reg-dec">zero</span>
        </div>
        <div id="cpsr-c" class="register cpsr-flag flex-vertical" title="CPSR Carry Flag (C)">
          <div class="reg-header"><span class="reg-abi">C</span><span class="reg-num">CPSR</span></div>
          <span class="reg-val">0</span>
          <span class="reg-dec">carry</span>
        </div>
        <div id="cpsr-v" class="register cpsr-flag flex-vertical" title="CPSR Overflow Flag (V)">
          <div class="reg-header"><span class="reg-abi">V</span><span class="reg-num">CPSR</span></div>
          <span class="reg-val">0</span>
          <span class="reg-dec">ovfl</span>
        </div>
      `;

      for (let i = 0; i < 16; i++) {
        const { abi, canonical } = indexToArmDisplay[i];
        html += `
          <div id="arm-reg-r${i}" data-abi="${abi}" data-r="${canonical}" class="register flex-vertical" title="${abi} (${canonical}): 0 (0x00000000)">
            <div class="reg-header">
              <span class="reg-abi">${abi}</span>
              <span class="reg-num">${canonical}</span>
            </div>
            <span class="reg-val">0x00000000</span>
            <span class="reg-dec">0</span>
          </div>
        `;
      }
      regElement.innerHTML = html;
    }

    for (let i = 0; i < 16; i++) {
      this.regStateList.transition(i, this.registers[i]);
    }
    this.syncFlagsDOM();
  }
}

export { armRegMap };

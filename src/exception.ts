export class RegisterIndexError extends Error {
    constructor() {
      super("Invalid register index");
      this.name = "RegisterIndexError";
    }
  }

export class SyntaxError extends Error {
  constructor(msg:string) {
    super(msg);
    this.name = "SyntaxError";
  }
}

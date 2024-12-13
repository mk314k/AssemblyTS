export class RegisterIndexError extends Error {
  constructor(msg = "Invalid register index") {
    super(msg);
    this.name = "RegisterIndexError";
  }

export class SyntaxError extends Error {
  constructor(msg:string) {
    super(msg);
    this.name = "SyntaxError";
  }
}

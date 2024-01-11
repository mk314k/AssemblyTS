export class RegisterIndexError extends Error {
    constructor() {
      super("Invalid register index");
      this.name = "RegisterIndexError";
    }
  }

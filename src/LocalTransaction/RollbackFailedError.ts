export class RollbackFailedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "RollbackFailedError";
    }
}
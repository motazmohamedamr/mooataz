export class AioTableSelectionAction<T> {
  private readonly _name: string;
  private readonly _canExecute: (item: T) => boolean;
  private readonly _execute: (item: T) => void;

  private _permission: string;

  constructor(
    name: string,
    canExecute: (item: T) => boolean,
    execute: (item: T) => void
  ) {
    this._name = name;
    this._canExecute = canExecute;
    this._execute = execute;
  }

  get name(): string {
    return this._name;
  }

  get permission(): string {
    return this._permission;
  }

  withPermission(permission: string): this {
    this._permission = permission;
    return this;
  }

  emit(item: T): void {
    this._execute(item);
  }

  canExecute(item: T): boolean {
    return this._canExecute(item);
  }
}

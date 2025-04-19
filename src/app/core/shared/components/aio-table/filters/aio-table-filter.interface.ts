export interface IAioTableFilter {
  key: string;

  getValue(): string;

  render(): string;
}

export interface IAioTableColumn<T> {
  title: string;
  cssClasses?: string;
  sortable?: boolean;
  sortBy?: string;

  render(data: T): string;
}

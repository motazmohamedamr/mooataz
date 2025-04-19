export interface TableColumn {
  name: string;
  dataKey: string;
  position?: 'right' | 'left';
  isSortable?: boolean;
  isShowable?: boolean;
  cellType?:string;
}

export enum cellTypeEnum {
  boolean = "boolean",
  picture = "picture",
  checkBox = "checkBox",
  numbering = "numbering",
  date = "date",
  dateTime = "dateTime",
}

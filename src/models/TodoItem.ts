import { DateTime } from 'luxon';

export enum TodoItemStatus {
  Todo,
  Done,
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace TodoItemStatus {
  export function toggleStatus(status: TodoItemStatus): TodoItemStatus {
    switch (status) {
      case TodoItemStatus.Todo:
        return TodoItemStatus.Done;
      case TodoItemStatus.Done:
        return TodoItemStatus.Todo;
    }
  }
}

export class TodoItem {
  public sourceFilePath: string;
  public startIndex: number;
  public length: number;
  public lineNumber: number;
  public charNumber: number;

  public status: TodoItemStatus;
  public description: string;
  public actionDate?: DateTime;

  constructor(
    status: TodoItemStatus,
    description: string,
    sourceFilePath: string,
    startIndex: number,
    length: number,
    lineNumber: number,
    charNumber: number,
    actionDate?: DateTime,
  ) {
    this.status = status;
    this.description = description;
    this.actionDate = actionDate;
    this.sourceFilePath = sourceFilePath;
    this.startIndex = startIndex;
    this.length = length;
    this.lineNumber = lineNumber;
    this.charNumber = charNumber;
  }
}
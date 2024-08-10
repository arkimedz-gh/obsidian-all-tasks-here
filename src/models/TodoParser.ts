import { DateParser } from '../services/DateParser';
import { TodoItem, TodoItemStatus } from './TodoItem';
import { DateTime } from 'luxon';
import { extractDueDateFromDailyNotesFile } from '../services/DailyNoteParser';

export class TodoParser {
  private dateParser: DateParser;

  constructor(dateParser: DateParser) {
    this.dateParser = dateParser;
  }

  async parseTasks(filePath: string, fileContents: string): Promise<TodoItem[]> {
    const pattern = /(-|\*) \[(\s|x)?\]\s(.*)/g;
    return [...fileContents.matchAll(pattern)].map((task) => this.parseTask(filePath, task, fileContents));
  }

  private parseTask(filePath: string, entry: RegExpMatchArray, fileContents: string): TodoItem {
    const todoItemOffset = 2; // Strip off `-|* `
    const status = entry[2] === 'x' ? TodoItemStatus.Done : TodoItemStatus.Todo;
    const description = entry[3];

    const actionDate = this.parseDueDate(description, filePath);
    const descriptionWithoutDate = this.dateParser.removeDate(description);

    // Calculate the line number and character number
    const lines = fileContents.substring(0, entry.index ?? 0).split('\n');
    const lineNumber = lines.length - 1;
    const charNumber = (entry.index ?? 0) - (lines.slice(0, -1).join('\n').length + (lines.length > 1 ? 1 : 0)) - todoItemOffset;

    const startIndex = (entry.index ?? 0) + todoItemOffset;
    const length = entry[0].length - todoItemOffset;

    return new TodoItem(
      status,
      descriptionWithoutDate,
      filePath,
      startIndex,
      length,
      lineNumber,
      charNumber,
      actionDate,
    );
  }

  private parseDueDate(description: string, filePath: string): DateTime | undefined {
    const taggedDueDate = this.dateParser.parseDate(description);
    if (taggedDueDate) {
      return taggedDueDate;
    }
    return extractDueDateFromDailyNotesFile(filePath);
  }
}
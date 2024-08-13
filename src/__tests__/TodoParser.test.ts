import { TodoItemStatus } from '../models/TodoItem';
import { TodoParser } from '../models/TodoParser';
import { DateParser } from '../services/DateParser';
import { DateTime } from 'luxon';

jest.mock('../services/DailyNoteParser');

const dateParser = new DateParser(`[[${DateParser.DateToken}]]`, 'yyyy-MM-dd');
const todoParser = new TodoParser(dateParser);

test('parsing an outstanding todo', async () => {
  const contents = `- [ ] This is something that needs doing`;
  const todos = await todoParser.parseTasks('/', contents);
  const todo = todos[0];
  expect(todo.startIndex).toEqual(2);
  expect(todo.length).toEqual(38);
  expect(todo.sourceFilePath).toEqual('/');
  expect(todo.status).toEqual(TodoItemStatus.Todo);
  expect(todo.description).toEqual('This is something that needs doing');
  expect(todo.actionDate).toBeUndefined();
});

test('parsing a completed todo', async () => {
  const contents = `- [x] This is something that has been completed`;
  const todos = await todoParser.parseTasks('/', contents);
  const todo = todos[0];
  expect(todo.startIndex).toEqual(2);
  expect(todo.length).toEqual(45);
  expect(todo.sourceFilePath).toEqual('/');
  expect(todo.status).toEqual(TodoItemStatus.Done);
  expect(todo.description).toEqual('This is something that has been completed');
  expect(todo.actionDate).toBeUndefined();
});

test('parsing an outstanding todo with a specific action date', async () => {
  const contents = `- [ ] This is something that needs doing [[2021-02-16]]`;
  const todos = await todoParser.parseTasks('/', contents);
  const todo = todos[0];
  expect(todo.startIndex).toEqual(2);
  expect(todo.length).toEqual(53);
  expect(todo.sourceFilePath).toEqual('/');
  expect(todo.status).toEqual(TodoItemStatus.Todo);
  expect(todo.description).toEqual('This is something that needs doing');
  expect(todo.actionDate?.toISODate()).toEqual('2021-02-16');
});

test('parsing a todo in a daily notes file', async () => {
  const contents = `- [ ] This is something that needs doing today`;
  const todos = await todoParser.parseTasks('/Daily Notes/today.md', contents);
  const todo = todos[0];
  expect(todo.actionDate.day).toEqual(DateTime.now().day);
  expect(todo.actionDate.month).toEqual(DateTime.now().month);
  expect(todo.actionDate.year).toEqual(DateTime.now().year);
});

test('parsing a todo in a daily notes file with a due date', async () => {
  const contents = `- [ ] This is something that needs doing [[2022-04-01]]`;
  const todos = await todoParser.parseTasks('/Daily Notes/today.md', contents);
  const todo = todos[0];
  expect(todo.actionDate.day).toEqual(1);
  expect(todo.actionDate.month).toEqual(4);
  expect(todo.actionDate.year).toEqual(2022);
});

test('parsing an outstanding todo with a specific action date and a someday/maybe tag', async () => {
  const contents = `- [ ] This is something that needs doing [[2021-02-16]]`;
  const todos = await todoParser.parseTasks('/', contents);
  const todo = todos[0];
  expect(todo.status).toEqual(TodoItemStatus.Todo);
  expect(todo.actionDate.day).toEqual(16);
  expect(todo.actionDate.month).toEqual(2);
  expect(todo.actionDate.year).toEqual(2021);
});

test('parsing a todo with an empty description', async () => {
  const contents = `- [ ] `;
  const todos = await todoParser.parseTasks('/', contents);
  expect(todos.length).toEqual(0);
});
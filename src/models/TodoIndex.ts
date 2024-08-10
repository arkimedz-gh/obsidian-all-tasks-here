import { TAbstractFile, TFile, Vault, Workspace } from 'obsidian';
import { TodoItem, TodoItemStatus } from './TodoItem';
import { TodoPluginSettings } from './TodoPluginSettings';
import { DateParser } from '../services/DateParser';
import { TodoParser } from './TodoParser';

export class TodoIndex {
  private vault: Vault;
  private workspace: Workspace;
  private todos: Map<string, TodoItem[]>;
  private listeners: ((todos: TodoItem[]) => void)[];
  private settings: TodoPluginSettings;

  constructor(vault: Vault, workspace: Workspace, settings: TodoPluginSettings, listener: (todos: TodoItem[]) => void) {
    this.vault = vault;
    this.workspace = workspace;
    this.todos = new Map<string, TodoItem[]>();
    this.listeners = [listener];
    this.settings = settings;
  }

  async initialize(): Promise<void> {
    const todoMap = new Map<string, TodoItem[]>();
    let numberOfTodos = 0;
    const timeStart = new Date().getTime();

    const markdownFiles = this.settings.onlyShowCurrentFile
      ? [this.workspace.getActiveFile()]
      : this.vault.getMarkdownFiles();

    for (const file of markdownFiles) {
      if (file) {
        const todos = await this.parseTodosInFile(file);
        const filteredTodos = this.settings.onlyShowTodosWithDate
          ? todos.filter((todo) => todo.actionDate)
          : todos;
        numberOfTodos += filteredTodos.length;
        if (filteredTodos.length > 0) {
          todoMap.set(file.path, filteredTodos);
        }
      }
    }

    const totalTimeMs = new Date().getTime() - timeStart;
    console.log(
      `[obsidian-plugin-todo] Parsed ${numberOfTodos} TODOs from ${markdownFiles.length} markdown files in (${totalTimeMs / 1000.0
      }s)`,
    );
    this.todos = todoMap;
    this.registerEventHandlers();
    this.invokeListeners();
  }

  setStatus(todo: TodoItem, newStatus: TodoItemStatus): void {
    const file = this.vault.getAbstractFileByPath(todo.sourceFilePath) as TFile;
    const fileContents = this.vault.read(file);
    fileContents.then((c: string) => {
      const newTodo = `[${newStatus === TodoItemStatus.Done ? 'x' : ' '}] ${todo.description}`;
      const oldTodoLength = c.substring(todo.startIndex).indexOf('\n');
      const newContents = c.substring(0, todo.startIndex) + newTodo + c.substring(todo.startIndex + oldTodoLength);
      this.vault.modify(file, newContents);
    });
  }

  setSettings(settings: TodoPluginSettings): void {
    const oldSettings = this.settings;
    this.settings = settings;

    const reIndexRequired =
      oldSettings.dateFormat !== settings.dateFormat || oldSettings.dateTagFormat !== settings.dateTagFormat;
    if (reIndexRequired) {
      this.initialize();
    }
  }

  private indexAbstractFile(file: TAbstractFile) {
    if (!(file instanceof TFile)) {
      return;
    }
    this.indexFile(file as TFile);
  }

  private indexFile(file: TFile) {
    this.parseTodosInFile(file).then((todos) => {
      this.todos.set(file.path, todos);
      this.invokeListeners();
    });
  }

  private clearIndex(path: string, silent = false) {
    this.todos.delete(path);
    if (!silent) {
      this.invokeListeners();
    }
  }

  private async parseTodosInFile(file: TFile): Promise<TodoItem[]> {
    // TODO: Does it make sense to index completed TODOs at all?
    const dateParser = new DateParser(this.settings.dateTagFormat, this.settings.dateFormat);
    const todoParser = new TodoParser(dateParser);
    const fileContents = await this.vault.cachedRead(file);
    return todoParser
      .parseTasks(file.path, fileContents)
      .then((todos) => todos.filter((todo) => todo.status === TodoItemStatus.Todo));
  }

  private registerEventHandlers() {
    this.vault.on('create', (file: TAbstractFile) => {
      this.indexAbstractFile(file);
    });
    this.vault.on('modify', (file: TAbstractFile) => {
      this.indexAbstractFile(file);
    });
    this.vault.on('delete', (file: TAbstractFile) => {
      this.clearIndex(file.path);
    });
    // We could simply change the references to the old path, but parsing again does the trick as well
    this.vault.on('rename', (file: TAbstractFile, oldPath: string) => {
      this.clearIndex(oldPath);
      this.indexAbstractFile(file);
    });
  }

  private invokeListeners() {
    const todos = ([] as TodoItem[]).concat(...Array.from(this.todos.values()));
    this.listeners.forEach((listener) => listener(todos));
  }
}
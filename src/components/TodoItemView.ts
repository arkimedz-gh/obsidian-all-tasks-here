import { DateTime } from 'luxon';
import { ItemView, MarkdownRenderer, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE_TODO } from '../constants';
import { TodoItem, TodoItemStatus } from '../models/TodoItem';
import { TodoParser } from '../models/TodoParser';
import { DateParser } from '../services/DateParser';

export interface TodoItemViewProps {
  todos: TodoItem[];
  formatDate: (date: DateTime) => string;
  openFile: (filePath: string, lineNumber: number, charNumber?: number) => void;
  toggleTodo: (todo: TodoItem, newStatus: TodoItemStatus) => void;
}

export class TodoItemView extends ItemView {
  private props: TodoItemViewProps;
  private dateParser: DateParser;
  private todoParser: TodoParser;

  constructor(leaf: WorkspaceLeaf, props: TodoItemViewProps) {
    super(leaf);
    this.props = props;
    const tagFormat = '[[%date%]]'; // Example tag format
    const dateFormat = 'yyyy-MM-dd'; // Example date format
    this.dateParser = new DateParser(tagFormat, dateFormat);
    this.todoParser = new TodoParser(this.dateParser);
  }

  getViewType(): string {
    return VIEW_TYPE_TODO;
  }

  getDisplayText(): string {
    return 'Todo';
  }

  getIcon(): string {
    return 'checkmark';
  }

  onClose(): Promise<void> {
    return Promise.resolve();
  }

  public setProps(setter: (currentProps: TodoItemViewProps) => TodoItemViewProps): void {
    this.props = setter(this.props);
    this.render();
  }

  private render(): void {
    const container = this.containerEl.children[1];
    container.empty();
    container.createDiv('todo-item-view-container', (el) => {
      el.createDiv('todo-item-view-items', (el) => {
        this.renderItems(el);
      });
    });
  }

  private groupTodos(): { today: TodoItem[], thisWeek: TodoItem[], thisMonth: TodoItem[], future: TodoItem[] } {
    const today = DateTime.now().startOf('day');
    const endOfWeek = today.endOf('week');
    const endOfMonth = today.endOf('month');
    const grouped = {
      today: [] as TodoItem[],
      thisWeek: [] as TodoItem[],
      thisMonth: [] as TodoItem[],
      future: [] as TodoItem[],
    };

    this.props.todos.forEach((todo) => {
      if (todo.actionDate) {
        if (todo.actionDate.startOf('day') <= today) {
          grouped.today.push(todo);
        } else if (todo.actionDate <= endOfWeek) {
          grouped.thisWeek.push(todo);
        } else if (todo.actionDate <= endOfMonth) {
          grouped.thisMonth.push(todo);
        } else {
          grouped.future.push(todo);
        }
      } else {
        grouped.future.push(todo);
      }
    });

    // Sort 'today' todos by action date in increasing order
    grouped.today.sort((a, b) => this.sortByActionDate(a, b));

    return grouped;
  }

  private renderItems(container: HTMLDivElement) {
    const groupedTodos = this.groupTodos();

    const renderSection = (title: string, todos: TodoItem[]) => {
      if (todos.length === 0) return; // Skip rendering if the section is empty
      container.createDiv('todo-item-view-section', (sectionEl) => {
        sectionEl.createEl('h3', { text: title });
        todos.forEach((todo) => {
          if (todo.description.trim() === '') return; // Skip empty descriptions
          sectionEl.createDiv('todo-item-view-item', (el) => {
            el.createDiv('todo-item-view-item-checkbox', (el) => {
              el.createEl('input', { type: 'checkbox' }, (el) => {
                el.checked = todo.status === TodoItemStatus.Done;
                el.onClickEvent(() => {
                  this.toggleTodo(todo);
                });
              });
            });
            el.createDiv('todo-item-view-item-description', (el) => {
              const link = el.createEl('a', { href: '#', cls: 'todo-item-link' });
              link.onClickEvent(() => {
                this.openFile(todo);
              });
              const descriptionWithoutDate = this.dateParser.removeDate(todo.description);
              MarkdownRenderer.renderMarkdown(descriptionWithoutDate, link, todo.sourceFilePath, this);
              if (todo.actionDate) {
                el.createSpan('due-date', (el) => {
                  if (todo.actionDate.startOf('day') < DateTime.now().startOf('day')) {
                    el.classList.add('overdue');
                  } else if (todo.actionDate.startOf('day') > DateTime.now().startOf('day')) {
                    el.classList.add('future-due');
                  }
                  el.setText(this.props.formatDate(todo.actionDate));
                });
              }
            });
          });
        });
      });
    };

    const currentMonth = DateTime.now().toFormat('LLLL');
    renderSection('Today', groupedTodos.today);
    renderSection('This Week', groupedTodos.thisWeek);
    renderSection(currentMonth, groupedTodos.thisMonth);
    renderSection('Future', groupedTodos.future);
  }

  private sortByActionDate(a: TodoItem, b: TodoItem): number {
    if (!a.actionDate && !b.actionDate) {
      return 0;
    }
    if (!a.actionDate) {
      return 1;
    }
    if (!b.actionDate) {
      return -1;
    }
    return a.actionDate < b.actionDate ? -1 : a.actionDate > b.actionDate ? 1 : 0;
  }

  private toggleTodo(todo: TodoItem): void {
    this.props.toggleTodo(todo, TodoItemStatus.toggleStatus(todo.status));
  }

  private openFile(todo: TodoItem): void {
    this.props.openFile(todo.sourceFilePath, todo.lineNumber, todo.charNumber);
  }
}
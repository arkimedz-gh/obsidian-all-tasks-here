import { App, Plugin, PluginManifest, TFile, WorkspaceLeaf, MarkdownView } from 'obsidian';
import { VIEW_TYPE_TODO } from './src/constants';
import { TodoItemView, TodoItemViewProps } from './src/components/TodoItemView';
import { TodoItem, TodoItemStatus } from './src/models/TodoItem';
import { TodoIndex } from './src/models/TodoIndex';
import { TodoPluginSettings, DEFAULT_SETTINGS } from './src/models/TodoPluginSettings';
import { SettingsTab } from './src/ui/SettingsTab';
import { DateFormatter } from './src/services/DateFormatter';
import { DateTime } from 'luxon';

export default class TodoPlugin extends Plugin {
  private dateFormatter: DateFormatter;
  private todoIndex: TodoIndex;
  private view: TodoItemView;
  private settings: TodoPluginSettings;

  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
    this.todoIndex = new TodoIndex(
      this.app.vault,
      this.app.workspace,
      DEFAULT_SETTINGS,
      this.tick.bind(this)
    );
  }

  async onload(): Promise<void> {
    this.settings = Object.assign(DEFAULT_SETTINGS, (await this.loadData()) ?? {});
    this.dateFormatter = new DateFormatter(this.settings.dateFormat);
    this.addSettingTab(new SettingsTab(this.app, this));

    this.registerView(VIEW_TYPE_TODO, (leaf: WorkspaceLeaf) => {
      const todos: TodoItem[] = [];
      const props = {
        todos: todos,
        formatDate: (date: DateTime) => {
          return this.dateFormatter.formatDate(date);
        },
        openFile: (filePath: string, lineNumber: number, charNumber: number = 0) => {
          const file = this.app.vault.getAbstractFileByPath(filePath);
          if (!(file instanceof TFile)) {
            return;
          }
          const openFileInLeaf = async (leaf: WorkspaceLeaf) => {
            await leaf.openFile(file);
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (view) {
              const editor = view.editor;
              if (editor) {
                editor.setCursor({ line: lineNumber, ch: charNumber });
                editor.scrollIntoView({ from: { line: lineNumber, ch: charNumber }, to: { line: lineNumber + 1, ch: charNumber } });
              } else {
                console.log('Editor not found'); // Log if the editor is not found
              }
            } else {
              console.log('MarkdownView not found'); // Log if the MarkdownView is not found
            }
          };

          if (this.settings.openFilesInNewLeaf && this.app.workspace.getActiveFile()) {
            this.app.workspace.splitActiveLeaf();
            openFileInLeaf(this.app.workspace.getUnpinnedLeaf());
          } else {
            openFileInLeaf(this.app.workspace.getUnpinnedLeaf());
          }
        },
        toggleTodo: (todo: TodoItem, newStatus: TodoItemStatus) => {
          this.todoIndex.setStatus(todo, newStatus);
        },
      };
      this.view = new TodoItemView(leaf, props);
      return this.view;
    });

    this.app.workspace.onLayoutReady(() => {
      this.initLeaf();
      this.triggerIndex();
    });

    // Add event listener for active file changes
    this.registerEvent(this.app.workspace.on('active-leaf-change', async () => {
      if (this.settings.onlyShowCurrentFile) {
        await this.todoIndex.initialize();
      }
    }));
  }

  onunload(): void {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_TODO).forEach((leaf) => leaf.detach());
  }

  initLeaf(): void {
    if (this.app.workspace.getLeavesOfType(VIEW_TYPE_TODO).length) {
      return;
    }
    this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE_TODO,
    });
  }

  getSettings(): TodoPluginSettings {
    return this.settings;
  }

  async updateSettings(settings: TodoPluginSettings): Promise<void> {
    this.settings = settings;
    this.dateFormatter = new DateFormatter(this.settings.dateFormat);
    await this.saveData(this.settings);
    this.todoIndex.setSettings(settings);
    await this.todoIndex.initialize(); // Always reinitialize the index
  }

  private async triggerIndex(): Promise<void> {
    await this.todoIndex.initialize();
  }

  tick(todos: TodoItem[]): void {
    if (this.view) {
      this.view.setProps((currentProps: TodoItemViewProps) => {
        return {
          ...currentProps,
          todos: todos,
        };
      });
    }
  }
}
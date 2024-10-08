import { App, PluginSettingTab, Setting } from 'obsidian';
import { DateTime } from 'luxon';
import TodoPlugin from 'main';
import { DEFAULT_SETTINGS } from '../models/TodoPluginSettings';

export class SettingsTab extends PluginSettingTab {
  private plugin: TodoPlugin;

  constructor(app: App, plugin: TodoPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const currentSettings = this.plugin.getSettings();

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Obsidian TODO Settings' });

    const tagFormatSetting = new Setting(containerEl);
    tagFormatSetting
      .setName('Date tag format')
      .setDesc(this.dateTagFormatDescription())
      .addText((text) =>
        text.setPlaceholder(currentSettings.dateTagFormat).onChange(async (dateTagFormat) => {
          // TODO: refactor this
          if (dateTagFormat.length === 0) {
            dateTagFormat = DEFAULT_SETTINGS.dateTagFormat;
          }

          if (!this.validateDateTag(dateTagFormat)) {
            tagFormatSetting.descEl.empty();
            tagFormatSetting.setDesc(
              this.dateTagFormatDescription(
                'Date tag must include %date% token. Default is [[%date%]]',
              ),
            );
            return;
          }

          tagFormatSetting.descEl.empty();
          tagFormatSetting.setDesc(this.dateTagFormatDescription());

          this.plugin.updateSettings({ ...currentSettings, dateTagFormat });
        }),
      );

    const dateFormatSetting = new Setting(containerEl);
    dateFormatSetting
      .setName('Date format')
      .setDesc(this.dateFormatDescription())
      .addText((text) =>
        text.setPlaceholder(currentSettings.dateFormat).onChange(async (dateFormat) => {
          // TODO: refactor this
          if (dateFormat.length === 0) {
            dateFormat = DEFAULT_SETTINGS.dateFormat;
          }

          if (!this.validateDateFormat(dateFormat)) {
            dateFormatSetting.descEl.empty();
            dateFormatSetting.setDesc(this.dateTagFormatDescription('Invalid date format.'));
            return;
          }

          dateFormatSetting.descEl.empty();
          dateFormatSetting.setDesc(this.dateTagFormatDescription());

          this.plugin.updateSettings({ ...currentSettings, dateFormat });
        }),
      );

    new Setting(containerEl)
      .setName('Open files in a new leaf')
      .setDesc(
        'If enabled, when opening the file containing a TODO that file will open in a new leaf. If disabled, it will replace the file that you currently have open.',
      )
      .addToggle((toggle) => {
        toggle.setValue(currentSettings.openFilesInNewLeaf);
        toggle.onChange(async (openFilesInNewLeaf) => {
          this.plugin.updateSettings({ ...currentSettings, openFilesInNewLeaf });
        });
      });

    new Setting(containerEl)
      .setName('Only show current file')
      .setDesc('If enabled, only the current file is parsed for TODOs to improve performance for large vaults.')
      .addToggle((toggle) => {
        toggle.setValue(currentSettings.onlyShowCurrentFile);
        toggle.onChange(async (onlyShowCurrentFile) => {
          this.plugin.updateSettings({ ...currentSettings, onlyShowCurrentFile });
        });
      });

    new Setting(containerEl)
      .setName('Only show TODOs with a date')
      .setDesc('If enabled, only TODOs with a date will be shown.')
      .addToggle((toggle) => {
        toggle.setValue(currentSettings.onlyShowTodosWithDate);
        toggle.onChange(async (onlyShowTodosWithDate) => {
          this.plugin.updateSettings({ ...currentSettings, onlyShowTodosWithDate });
        });
      });
  }

  private dateTagFormatDescription(error?: string): DocumentFragment {
    const el = document.createDocumentFragment();
    el.appendText('The format in which the due date is included in the task description.');
    el.appendChild(document.createElement('br'));
    el.appendText('Must include the %date% token.');
    el.appendChild(document.createElement('br'));
    el.appendText("To configure the format of the date, see 'Date format'.");
    if (error != null) {
      el.appendChild(document.createElement('br'));
      el.appendText(`Error: ${error}`);
    }
    return el;
  }

  private dateFormatDescription(error?: string): DocumentFragment {
    const el = document.createDocumentFragment();
    el.appendText('Dates in this format will be recognised as due dates.');
    el.appendChild(document.createElement('br'));

    const a = document.createElement('a');
    a.href = 'https://moment.github.io/luxon/#/formatting?id=table-of-tokens';
    a.text = 'See the documentation for supported tokens.';
    a.target = '_blank';
    el.appendChild(a);

    if (error != null) {
      el.appendChild(document.createElement('br'));
      el.appendText(`Error: ${error}`);
    }
    return el;
  }

  private validateDateTag(dateTag: string): boolean {
    if (dateTag.length === 0) {
      return true;
    }
    return dateTag.includes('%date%');
  }

  private validateDateFormat(dateFormat: string): boolean {
    if (dateFormat.length === 0) {
      return true;
    }
    const expected = DateTime.fromISO('2020-05-25');
    const formatted = expected.toFormat(dateFormat);
    const parsed = DateTime.fromFormat(formatted, dateFormat);
    return parsed.hasSame(expected, 'day') && parsed.hasSame(expected, 'month') && parsed.hasSame(expected, 'year');
  }
}
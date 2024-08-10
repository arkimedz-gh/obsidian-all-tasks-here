export interface TodoPluginSettings {
  dateFormat: string;
  dateTagFormat: string;
  openFilesInNewLeaf: boolean;
  onlyShowCurrentFile: boolean;
  onlyShowTodosWithDate: boolean;
}

export const DEFAULT_SETTINGS: TodoPluginSettings = {
  dateFormat: 'yyyy-MM-dd',
  dateTagFormat: '[[%date%]]',
  openFilesInNewLeaf: false,
  onlyShowCurrentFile: true,
  onlyShowTodosWithDate: false,
};
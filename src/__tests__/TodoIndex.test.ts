import { TFile, Vault } from 'obsidian';
import { TodoItem, TodoItemStatus } from '../models/TodoItem';
import { TodoIndex } from '../models/TodoIndex';
import { TodoPluginSettings } from '../models/TodoPluginSettings';

describe('TodoIndex', () => {
    let vault: Vault;
    let settings: TodoPluginSettings;
    let todoIndex: TodoIndex;
    let file: TFile;

    beforeEach(() => {
        vault = new Vault();
        settings = {
            dateFormat: 'yyyy-MM-dd',
            dateTagFormat: '[[%date%]]',
            openFilesInNewLeaf: false,
            onlyShowCurrentFile: false,
            onlyShowTodosWithDate: false,
        };
        todoIndex = new TodoIndex(vault, { getActiveFile: () => file } as any, settings, jest.fn());
        file = new TFile();
        file.path = 'test.md';
    });

    test('updates file correctly when a task checkbox is clicked', async () => {
        const initialContent = `- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3`;
        const expectedContent = `- [x] Task 1\n- [ ] Task 2\n- [ ] Task 3`;

        jest.spyOn(vault, 'read').mockResolvedValue(initialContent);
        jest.spyOn(vault, 'modify').mockResolvedValue();

        const todo = new TodoItem(
            TodoItemStatus.Todo,
            'Task 1',
            'test.md',
            2,
            8,
            0,
            2
        );

        await todoIndex.setStatus(todo, TodoItemStatus.Done);

        expect(vault.modify).toHaveBeenCalledWith(file, expectedContent);
    });
});
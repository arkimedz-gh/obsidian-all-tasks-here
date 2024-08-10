export class TFile {
    path: string = '';
}

export class Vault {
    read(file: TFile): Promise<string> {
        return Promise.resolve('');
    }

    modify(file: TFile, data: string): Promise<void> {
        return Promise.resolve();
    }

    getAbstractFileByPath(path: string): TFile | null {
        const file = new TFile();
        file.path = path;
        return file;
    }
}
import fs from 'node:fs/promises';

class DataHandler {
    constructor(filePath, items) {
        this.filePath = filePath;
        this.items = items;
        this.timeout = undefined;
        this.clearTimeout = false;
    }

    async load() {
        let counts = {};
        //retrieve counts from storage
        try {
            await fs.access(this.filePath, fs.constants.F_OK);

            const data = await fs.readFile(this.filePath, 'utf8');
            const stored = JSON.parse(data);

            for (const item of this.items) {
                const n = stored?.[item];
                if (typeof n === "number" && Number.isFinite(n)) counts[item] = n;
            }

            return stored;
        } catch (error) {
            console.log(error);

            return counts;
        }
    }

    async save(data) {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            await fs.writeFile(this.filePath, jsonString, { flag: 'w+', encoding: 'utf8' });
        } catch (error) {
            console.log("Couldn't save data.");
        }
    }

    saveData(data) {
        if(this.clearTimeout === true) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(async () => {
            await this.save(data);
            this.clearTimeout = true;
        }, 500);
    }
}

export { DataHandler };
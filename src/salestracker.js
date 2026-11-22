import dotenv from 'dotenv';
import fs from 'node:fs/promises';

dotenv.config({ quiet: true });

export const ITEMS = ["fireball", "transfusion", "waterhazard", "jelloshot", "all"];
const FILEPATH = '/usr/src/app/sales';

// SALES_TEMPLATE placeholders: {fireball} {transfusion} {waterhazard}
const TWITCH_SALES_TEMPLATE =
    "alison61Alislay DAILY SALES: Fireball Shots Sold: {fireball} | Transfusions Sold: {transfusion} | Water Hazards Sold: {waterhazard} alison61Alislay";

const YT_SALES_TEMPLATE =
    "DAILY SALES: Fireball Shots Sold: {fireball} | Transfusions Sold: {transfusion} | Water Hazards Sold: {waterhazard}";

class SalesTracker {
    constructor() {
        this.counts = new Map();
        this.product;
        this.amount;
        this.platform;
    }

    async load() {
        let counts = { fireball: 0, transfusion: 0, waterhazard: 0, jelloshot: 0 };
        //retrieve counts from storage
        try {
            await fs.access(FILEPATH, fs.constants.F_OK);

            const data = await fs.readFile(FILEPATH, { encoding: 'utf-8' });
            const stored = JSON.parse(data);

            for (const item of ITEMS) {
                const n = stored?.[item];
                if (typeof n === "number" && Number.isFinite(n)) counts[item] = n;
            }

            return counts;
        } catch (error) {
            console.log(error);

            return counts;
        }
    }

    async save(data) {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            await fs.writeFile(FILEPATH, jsonString, { flag: 'w+', encoding: 'utf8' });
        } catch (error) {
            console.log("Couldn't save data.");
        }
    }

    getSalesTemplate(platform) {
        return platform === "twitch" ? TWITCH_SALES_TEMPLATE : YT_SALES_TEMPLATE;
    }

    //retrieve a reply customized for the item type
    getTwitchItemReply(item, soldAmount) {
        const itemReplies = {
            fireball:
                `alison61Drive CHEERS to selling ${soldAmount} shots of Fireball! alison61Yallgood`,
            transfusion:
                `alison61Drive Alison has sold ${soldAmount} Good Luck Transfusions! alison61Yallgood`,
            waterhazard:
                `alison61Drive Alison has sold ${soldAmount} refreshing Water Hazards! alison61Yallgood`,
            jelloshot:
                `alison61Drive Happy Labor Day! Alison has sold ${soldAmount} Jell-O shots! alison61Yallgood`,
        };

        return itemReplies[item];
    }

    getYtItemReply(item, soldAmount) {
        const itemReplies = {
            fireball: `CHEERS to selling ${soldAmount} shots of Fireball!`,
            transfusion: `Alison as sold ${soldAmount} Good Luck Transfusions!`,
            waterhazard: `Alison has sold ${soldAmount} refreshing Water Hazards!`,
            jelloshot: `Happy Labor Day! Alison has sold ${soldAmount} Jell-O shots!`,
        };

        return itemReplies[item];
    }

    getReply(platform, item, soldAmount) {
        return platform === "twitch"
            ? this.getTwitchItemReply(item, soldAmount)
            : this.getYtItemReply(item, soldAmount);
    }

    async add(salesData) {
        const counts = await this.load();
        const product = salesData.product;
        const amount = salesData.amount;

        counts[product] = counts[product] + amount;
        await this.save(counts);

        return counts[product];
    }

    async remove(salesData) {
        const counts = await this.load();
        const product = salesData.product;
        const amount = salesData.amount;

        //don't go below zero when removing an item
        counts[product] = Math.max(0, counts[product] - amount);
        await this.save(counts);

        return counts[product];
    }

    async setSales(salesData) {
        const counts = await this.load();
        const product = salesData.product;
        const amount = salesData.amount;

        counts[product] = Math.max(0, amount);
        await this.save(counts);

        return counts[product];
    }

    async getTotalSalesCount() {
        const sales = await this.load();
    
        return sales;
    }

    async getProductSalesCount(product) {
        const sales = await this.load();

        return sales[product];
    }

    async reset() {
        const sales = { fireball: 0, transfusion: 0, waterhazard: 0, jelloshot: 0 };

        await this.save(sales);

        return sales;
    }
}

export { SalesTracker };
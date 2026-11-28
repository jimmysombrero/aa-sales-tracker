import dotenv from 'dotenv';
import {DataHandler} from './datahandler.js'

dotenv.config({ quiet: true });

export const ITEMS = ["fireball", "transfusion", "waterhazard", "jelloshot", "all"];
const FILEPATH = '/mnt/data/sales';

// SALES_TEMPLATE placeholders: {fireball} {transfusion} {waterhazard}
const TWITCH_SALES_TEMPLATE =
    "alison61Alislay DAILY SALES: Fireball Shots Sold: {fireball} | Transfusions Sold: {transfusion} | Water Hazards Sold: {waterhazard} alison61Alislay";

const YT_SALES_TEMPLATE =
    "DAILY SALES: Fireball Shots Sold: {fireball} | Transfusions Sold: {transfusion} | Water Hazards Sold: {waterhazard}";

class SalesTracker {
    constructor() {
        this.product;
        this.amount;
        this.platform;
        this.dataHandler = new DataHandler(FILEPATH, ITEMS);
        this.timeOutObject = undefined;
        this.counts = undefined;
        this.loadData();
    }

    async loadData() {
        this.counts = await this.dataHandler.load();
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
        const product = salesData.product;
        const amount = salesData.amount;

        this.counts[product] = this.counts[product] + amount || amount;
        
        this.dataHandler.saveData(this.counts);

        return this.counts[product];
    }

    async remove(salesData) {
        const product = salesData.product;
        const amount = salesData.amount;

        //don't go below zero when removing an item
        this.counts[product] = Math.max(0, this.counts[product] - amount);
        this.dataHandler.saveData(this.counts);

        return this.counts[product];
    }

    async setSales(salesData) {
        const product = salesData.product;
        const amount = salesData.amount;

        this.counts[product] = Math.max(0, amount);
        this.dataHandler.saveData(this.counts);

        return this.counts[product];
    }

    async getTotalSalesCount() {
        return this.counts;
    }

    async getProductSalesCount(product) {
        return this.counts[product] || 0;
    }

    async reset() {
        const sales = { fireball: 0, transfusion: 0, waterhazard: 0, jelloshot: 0 };
        this.counts = sales;
        this.dataHandler.saveData(sales);

        return sales;
    }
}

export { SalesTracker };
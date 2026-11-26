import dotenv from 'dotenv';
import {DataHandler} from './datahandler.js'

dotenv.config({ quiet: true })

export const WINNERS = ["twitch", "youtube", "golfers"];
const FILEPATH = '/mnt/data/tipwinner';

const TIPWINNERTEMPLATE = "Twitch: {twitch} | YouTube: {youtube} | Golfers: {golfers}"

class TipWinner {
    constructor() {
        this.dataHandler = new DataHandler(FILEPATH, WINNERS);
    }

    getWinnerTemplate() {
        return TIPWINNERTEMPLATE;
    }

    async addWinner(winner) {
        const winners = await this.dataHandler.load();

        winners[winner] = winners[winner] + 1;
        await this.dataHandler.save(winners);

        return winners;
    }

    async removeWinner(winner) {
        const winners = await this.dataHandler.load();

        winners[winner] = Math.max(0, winners[winner] -1);
        await this.dataHandler.save(winners);

        return winners;
    }

    async getWinners() {
        return await this.dataHandler.load();
    }

    async resetWinners() {
        const winners = {twitch: 0, youtube: 0, golfers: 0};

        await this.dataHandler.save(winners);

        return winners;
    }

    async resetWinner(winner) {
        const winners = await this.dataHandler.load();

        winners[winner] = 0;
        await this.dataHandler.save(winners);

        return winners;
    }
}

export { TipWinner };
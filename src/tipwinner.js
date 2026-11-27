import dotenv from 'dotenv';
import {DataHandler} from './datahandler.js'

dotenv.config({ quiet: true })

export const WINNERS = ["twitch", "youtube", "golfers"];
const FILEPATH = '/mnt/data/tipwinner';

const TIPWINNERTEMPLATE = "Twitch: {twitch} | YouTube: {youtube} | Golfers: {golfers}"

class TipWinner {
    constructor() {
        this.dataHandler = new DataHandler(FILEPATH, WINNERS);
        this.winners = undefined;
        this.loadData();
    }

    async loadData() {
        this.winners = await this.dataHandler.load();
    }

    getWinnerTemplate() {
        return TIPWINNERTEMPLATE;
    }

    addWinner(winner) {
        this.winners[winner] = this.winners[winner] + 1 || 1;
        this.dataHandler.saveData(this.winners);

        return this.winners;
    }

    removeWinner(winner) {
        this.winners[winner] = Math.max(0, this.winners[winner] -1);
        this.dataHandler.saveData(this.winners);

        return this.winners;
    }

    getWinners() {
        return this.winners;
    }

    resetWinners() {
        const winners = {twitch: 0, youtube: 0, golfers: 0};
        this.winners = winners;

        this.dataHandler.saveData(winners);

        return winners;
    }

    resetWinner(winner) {
        this.winners[winner] = 0;
        this.dataHandler.saveData(winners);

        return winners;
    }
}

export { TipWinner };
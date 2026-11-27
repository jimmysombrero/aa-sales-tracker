// Sales Counter — a Val.town HTTP val.
//
// StreamElements chat commands call this via $(customapi ...), which is
// GET-only, sends no headers, and posts the raw response body to chat
// (truncated at 400 bytes). So: mutations are GETs authorized by a ?key=
// query param, and every response is the exact chat message to post.
//
// Routes:
//   GET /sales                            -> daily sales (public)
//   GET /sales?item=<item>                -> get daily sales for specific item (public)
//   GET /add?item=<item>&key=<SECRET>     -> +1 to item sales
//   GET /remove?item=<item>&key=<SECRET>  -> -1 to item sales (floor 0)
//   GET /reset?key=<SECRET>               -> all item sales to 0
//   GET /set?item=<item>&amount=<n>&key=.. -> correction hatch for miscounts
//
// Source of truth: widgets/tipwars/main.ts in the yt-tip-plugin repo.

import dotenv from 'dotenv';
import express from 'express';
import { SalesTracker, ITEMS } from './salestracker.js';
import { TipWinner, WINNERS } from './tipwinner.js';

const salesTracker = new SalesTracker();
const tipWinner = new TipWinner();

dotenv.config({ quiet: true });

const app = express();
const port = 3249;

const SECRET = `${process.env.SALES_UPDATER_KEY}`;
const PLATFORMS = ["twitch", "youtube"];

let salesData = { product: '', amount: 0, platform: 'twitch' };
let winnerData = { winner: '' };

function fill(template, values) {
  return template.replace(
    /\{(\w+)\}/g,
    (m, name) => name in values ? String(values[name]) : String(0),
  );
}

//validate API key
//also get parse the platform, item and item amount
//all return values have to be 200 or twitch will reject the response
const parseSalesGetRequest = (req, res, next) => {
  const key = req.query['key'];

  if (SECRET !== key) {
    return res.status(200).set("content-type:text/plain; charset=utf-8").send("Could not validate API key.");
  }

  salesData.product = req.query['item'] || "all";

  //make sure the product is in the items array
  if (ITEMS.includes(salesData.product) === false) {
    return res.status(200).set("content-type:text/plain; charset=utf-8").send("Item must be one of fireball | transfusion | waterhazard | all");
  }

  salesData.amount = Number(req.query['amount']);

  //make sure amount is an integer less than or equal to 100
  //hopefully we don't sell more than 100 drinks at a time
  if (Number.isInteger(salesData.amount) === false || salesData.amount < 0 || salesData.amount > 100) {
    return res.status(200).set("content-type:text/plain; charset=utf-8").send("Amount must be an integer greater than 0.");
  }

  salesData.platform = req.query['app'];
  if (PLATFORMS.includes(salesData.platform) === false) {
    return res.status(200).set("content-type:text/plain; charset=utf-8").send("Platform must be one of twitch | youtube");
  }

  next();
}

const parseTipsWinner = (req, res, next) => {
  const key = req.query['key'];

  if (SECRET !== key) {
    return res.status(200).set("content-type:text/plain; charset=utf-8").send("Could not validate API key.");
  }

  winnerData.winner = req.query['winner'];
  if(WINNERS.includes(winnerData.winner) === false) {
    return res.status(200).set("content-type:text/plain; charset=utf-8").send("Winner must be one of twitch | youtube | golfers.");
  }

  next();
}

async function main() {
  app.get("/", (req, res) => {
    res.send("Nothing to see here!")
  });

  app.get("/api/add", parseSalesGetRequest, async (req, res) => {
    const amountSold = await salesTracker.add(salesData);

    res.status(200).set("content-type:text/plain; charset=utf-8").send(salesTracker.getReply(salesData.platform, salesData.product, amountSold));
  });

  app.get("/api/remove", parseSalesGetRequest, async (req, res) => {
    const amountSold = await salesTracker.remove(salesData);

    res.status(200).set("content-type:text/plain; charset=utf-8").send(salesTracker.getReply(salesData.platform, salesData.product, amountSold));
  });

  app.get("/api/resetSales", parseSalesGetRequest, async (req, res) => {
    const data = await salesTracker.reset();
    const salesTemplate = salesTracker.getSalesTemplate(salesData.platform);

    res.status(200).set("content-type:text/plain; charset=utf-8").send(fill(salesTemplate, data));
  });

  app.get("/api/setSales", parseSalesGetRequest, async (req, res) => {
    const amountSold = await salesTracker.setSales(salesData);

    res.status(200).set("content-type:text/plain; charset=utf-8").send(salesTracker.getReply(salesData.platform, salesData.product, amountSold));
  });

  app.get("/api/sales", parseSalesGetRequest, async (req, res) => {
    let response;
    let salesTemplate = salesTracker.getSalesTemplate(salesData.platform);
    let soldAmount;
    let product = salesData.product;

    if (product === "all") {
      soldAmount = await salesTracker.getTotalSalesCount();
      response = fill(salesTemplate, soldAmount);
    } else {
      soldAmount = await salesTracker.getProductSalesCount(product);
      response = salesTracker.getReply(salesData.platform, product, soldAmount);
    }

    res.status(200).set("content-type:text/plain; charset=utf-8").send(response);
  });

  app.get("/api/addWinner", parseTipsWinner, async (req, res) => {
    const winners = await tipWinner.addWinner(winnerData.winner);

    res.status(200).set("content-type:text/plain; charset=utf-8").send(fill(tipWinner.getWinnerTemplate(), winners));
  });

  app.get("/api/removeWinner", parseTipsWinner, async (req, res) => {
    const winners = await tipWinner.removeWinner(winnerData.winner);

    res.status(200).set("content-type:text/plain; charset=utf-8").send(fill(tipWinner.getWinnerTemplate(), winners));
  });

  app.get("/api/winners", parseTipsWinner, async (req, res) => {
    const winners = tipWinner.getWinners();

    res.status(200).set("content-type:text/plain; charset=utf-8").send(fill(tipWinner.getWinnerTemplate(), winners));
  });

  app.get("api/resetWinner", parseTipsWinner, async (req, res) => {
    const winners = tipWinner.resetWinner(winnerData.winner);

    res.status(200).set("content-type:text/plain; charset=utf-8").send(fill(tipWinner.getWinnerTemplate(), winners));
  });

  app.get("api/resetWinners", parseTipsWinner, async (req, res) => {
    const winners = tipWinner.resetWinners();

    res.status(200).set("content-type:text/plain; charset=utf-8").send(fill(tipWinner.getWinnerTemplate(), winners));
  });

  app.listen(port, () => {
    console.log(`Sales tracker listening on port ${port}`);
  });
}

if (import.meta.main) {
  main();
}
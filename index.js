var express = require("express");
var request = require("request");
const path = require("path");

var app = express();
app.set("view engine", "jade");

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/:crypto/:fiat/calc.js", function (req, res) {
  const cryptos = ["monero", "bitcoin", "ethereum", "litecoin", "dash"];
  const fiats = ["usd", "eur", "czk", "btc"];
  if (cryptos.includes(req.params.crypto)) {
    var crypto = req.params.crypto;
  } else {
    var crypto = "bitcoin";
  }
  if (fiats.includes(req.params.fiat)) {
    var fiat = req.params.fiat;
  } else {
    var fiat = "usd";
  }
  const crypto_api =
    "https://api.coingecko.com/api/v3/simple/price?ids=" +
    crypto +
    "&vs_currencies=" +
    fiat +
    "&include_24hr_change=true";
  request(crypto_api, (error, response, body) => {
    res.set("Content-Type", "application/javascript");
    if (!error && response.statusCode === 200) {
      const crypto_json = JSON.parse(body);
      const crypto_jsonp = "callback(" + JSON.stringify(crypto_json) + ")";
      res.send(crypto_jsonp);
    } else {
      res.send('callback({"error": true})');
    }
  });
});

app.get("/:conv/:crypto/:fiat/:price/:use_json?", function (req, res) {
  const convs = ["get-crypto-price", "get-fiat-price"];
  const cryptos = ["monero", "bitcoin", "ethereum", "litecoin", "dash"];
  const cryptos_short = { "xmr": "monero", "btc": "bitcoin", "eth": "ethereum", "ltc": "litecoin", "dash": "dash" }; 
  const fiats = ["usd", "eur", "czk", "btc"];
  if (convs.includes(req.params.conv)) {
    var conv = req.params.conv;
  } else {
    var conv = "get-fiat-price";
  }
  if (cryptos.includes(req.params.crypto)) {
    var crypto = cryptos_short[req.params.crypto];
    console.log(crypto);
  } else {
    var crypto = "bitcoin";
  }
  if (fiats.includes(req.params.fiat)) {
    var fiat = req.params.fiat;
  } else {
    var fiat = "usd";
  }
  if (req.params.use_json) {
    var use_json = true;
    if (req.params.use_json == "jsonp") {
      var use_jsonp = true;
    } else {
      var use_jsonp = false;
    }
  } else {
    var use_json = false;
  }
  const crypto_api =
    "https://api.coingecko.com/api/v3/simple/price?ids=" +
    crypto +
    "&vs_currencies=" +
    fiat;
  request(crypto_api, (error, response, body) => {
    if (use_jsonp) {
      res.set("Content-Type", "application/javascript");
    } else if (use_json) {
      res.set("Content-Type", "text/html");
    } else {
      res.set("Content-Type", "text/html");
    }
    if (!error && response.statusCode === 200) {
      const crypto_json = JSON.parse(body);
      console.log(crypto_json);
      var crypto_rate = crypto_json[crypto][fiat];
      if (conv == "get-crypto-price") {
        var calc_amount = parseFloat(req.params.price) / parseFloat(crypto_rate);
        var conversion_units = "crypto";
      } else if (conv == "get-fiat-price") {
        var calc_amount = parseFloat(crypto_rate) * parseFloat(req.params.price);
        var conversion_units = "fiat";
      }
      if (use_jsonp) {
        res.send('callback({"res": "' + calc_amount + '"})');
      } else if (use_json) {
        res.send(JSON.stringify({ res: calc_amount }));
      } else {
        res.send("" + calc_amount);
      }
    } else {
      if (use_jsonp) {
        res.send('callback({"res": "error"})');
      } else if (use_json) {
        res.send(JSON.stringify({ res: "error" }));
      } else {
        res.send("Error");
      }
    }
  });
});

app.use(function (err, req, res, next) {
  console.log(err.stack);
});

if (!module.parent) {
  var port = process.env.PORT || 28954;
  app.listen(port);
}

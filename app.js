// create an express app
const express = require("express");
const ogs = require('open-graph-scraper');
const cors = require('cors');
const linkPreviewGenerator = require("link-preview-generator");
const captureWebsite = require('capture-website');
var mcache = require('memory-cache');

var cache = (duration) => {
  return (req, res, next) => {
    let key = '__express__' + req.originalUrl || req.url
    let cachedBody = mcache.get(key);
    if (cachedBody) {
      console.log("using cache");
      res.send(cachedBody)
      return
    } else {
      res.sendResponse = res.send
      res.send = (body) => {
        console.log("caching");
        mcache.put(key, body, duration * 1000);
        res.sendResponse(body);
      }
      next()
    }
  }
}

const app = express();

app.use(cors())

// define the first route
app.get("/", cache(60 * 5), async (req, res) => {
  try {
    let url = req.query.url;
    if (!url) {
      res.status(403).send("Must include url query param");
      return;
    }
    
    const previewData = await linkPreviewGenerator(url);
    if (previewData.img) {
      res.json(previewData.img);
      return;
    }

    const screenshot = await captureWebsite.base64(url, {
      timout: 15,
      scaleFactor: 1
    });
    if (screenshot) {
      res.json("data:image/png;base64," + screenshot);
      return;
    }

    res.json("https://jayclouse.com/wp-content/uploads/2019/06/hacker_news-1000x525-1.jpg");
  } catch (error) {
    console.log(error);
    res.json("https://jayclouse.com/wp-content/uploads/2019/06/hacker_news-1000x525-1.jpg");
  }
})

// start the server listening for requests
app.listen(process.env.PORT || 3000,
  () => console.log("Server is running..."));
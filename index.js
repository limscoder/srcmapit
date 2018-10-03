#!/usr/bin/env node
const minimist = require("minimist");
const fetch = require("node-fetch");
const sourceMap = require("source-map");

const mapExp = /# sourceMappingURL=(.+)$/g;
const helpTxt = `Usage: srcmapit [target]

Decode original javascript source code position from transformed target position.

[target] takes the form of: "{url}:{line#}:{column#}"
[target] example: "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js:2:10"`;

function error(msg, help = false) {
  console.error(`Error: ${msg}`);
  if (help) {
    console.log(helpTxt);
  }
  process.exit(1);
}

function parseTarget(position) {
  const targetParts = position.split(":");
  const partCount = targetParts.length;
  if (partCount < 3) {
    error("invalid target format", true);
  }

  return {
    url: targetParts.slice(0, partCount - 2).join(":"),
    line: parseInt(targetParts[partCount - 2], 10),
    column: parseInt(targetParts[partCount - 1], 10)
  };
}

async function findMap(target) {
  const res = await fetch(target.url);
  if (!res.ok) {
    error("target fetch failed");
  }
  const content = await res.text();
  const map = mapExp.exec(content);
  const mapPath = map && map[1];

  if (!mapPath) {
    // no source map link found
    return target.url.replace(/\.js$/, ".map");
  } else if (mapPath.startsWith("http")) {
    // url map link
    return mapPath;
  } else if (mapPath.startsWith("/")) {
    // absolute map link
    const domain = target.url.split("/")[0];
    return domain + mapPath;
  } else {
    // relative map link
    const urlParts = target.url.split("/");
    urlParts[urlParts.length - 1] = mapPath;
    return urlParts.join("/");
  }
}

async function decodeTarget(target, sourceMapUrl) {
  const res = await fetch(sourceMapUrl);
  if (!res.ok) {
    error("source map fetch failed");
  }

  const map = await res.text();
  try {
    const mapConsumer = await new sourceMap.SourceMapConsumer(map);
    const srcPosition = mapConsumer.originalPositionFor({
      line: target.line,
      column: target.column
    });
    mapConsumer.destroy();
    return srcPosition;
  } catch (e) {
    error(`source map decode failed, ${e}`);
  }
}

async function findPosition(position) {
  const target = parseTarget(position);
  const sourceMapUrl = await findMap(target);
  return await decodeTarget(target, sourceMapUrl);
}

async function main() {
  const argv = minimist(process.argv.slice(2));
  if (argv._.length < 1) {
    error("target not specified", true);
  }

  argv._.forEach(async position => {
    const srcPosition = await findPosition(position);
    console.log(position);
    console.log(srcPosition);
  });
}

main();

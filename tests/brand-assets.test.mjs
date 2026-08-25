import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { inflateSync } from "node:zlib";

const AVATARS = [
  "florian-original.png",
  "florian-wind.png",
  "florian-beanie.png",
  "florian-summer.png",
  "florian-flower.png",
];

const WEB_ASSETS = [
  "florian-original-web.webp",
  "florian-wind-web.webp",
  "florian-beanie-web.webp",
  "florian-summer-web.webp",
  "florian-flower-web.webp",
  "monflorian-wordmark-web.webp",
];

const INTRO_ASSETS = [
  ["florian-original-intro.webp", 1024, 1024],
  ["florian-wind-intro.webp", 1024, 1024],
  ["florian-beanie-intro.webp", 1024, 1024],
  ["florian-summer-intro.webp", 1024, 1024],
  ["florian-flower-intro.webp", 1024, 1024],
  ["monflorian-wordmark-intro.webp", 1352, 724],
];

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function paeth(left, above, upperLeft) {
  const estimate = left + above - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const aboveDistance = Math.abs(estimate - above);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= aboveDistance && leftDistance <= upperLeftDistance) return left;
  if (aboveDistance <= upperLeftDistance) return above;
  return upperLeft;
}

function decodeRgbaPng(file) {
  const png = readFileSync(new URL(`../assets/brand/${file}`, import.meta.url));
  assert.equal(png.subarray(0, 8).compare(PNG_SIGNATURE), 0, `${file}: signature PNG invalide`);

  let offset = 8;
  let metadata;
  const compressedRows = [];
  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const data = png.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      metadata = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        compression: data[10],
        filter: data[11],
        interlace: data[12],
      };
    }
    if (type === "IDAT") compressedRows.push(data);
    offset += length + 12;
  }

  assert.ok(metadata, `${file}: bloc IHDR absent`);
  assert.deepEqual(
    [metadata.bitDepth, metadata.colorType, metadata.compression, metadata.filter, metadata.interlace],
    [8, 6, 0, 0, 0],
    `${file}: un PNG RGBA 8 bits non entrelacé est requis`,
  );

  const bytesPerPixel = 4;
  const rowLength = metadata.width * bytesPerPixel;
  const encoded = inflateSync(Buffer.concat(compressedRows));
  assert.equal(encoded.length, metadata.height * (rowLength + 1), `${file}: données PNG tronquées`);

  const pixels = Buffer.alloc(rowLength * metadata.height);
  let sourceOffset = 0;
  for (let y = 0; y < metadata.height; y += 1) {
    const filter = encoded[sourceOffset];
    sourceOffset += 1;
    const rowOffset = y * rowLength;
    for (let x = 0; x < rowLength; x += 1) {
      const raw = encoded[sourceOffset + x];
      const left = x >= bytesPerPixel ? pixels[rowOffset + x - bytesPerPixel] : 0;
      const above = y > 0 ? pixels[rowOffset - rowLength + x] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel ? pixels[rowOffset - rowLength + x - bytesPerPixel] : 0;
      const predictor = [0, left, above, Math.floor((left + above) / 2), paeth(left, above, upperLeft)][filter];
      assert.notEqual(predictor, undefined, `${file}: filtre PNG inconnu ${filter}`);
      pixels[rowOffset + x] = (raw + predictor) & 255;
    }
    sourceOffset += rowLength;
  }

  return { ...metadata, pixels };
}

function webpDimensions(webp, file) {
  assert.equal(webp.toString("ascii", 12, 16), "VP8X", `${file}: en-tête VP8X attendu`);
  return {
    width: webp.readUIntLE(24, 3) + 1,
    height: webp.readUIntLE(27, 3) + 1,
  };
}

test("les portraits de Florian gardent un vrai fond transparent", () => {
  for (const file of AVATARS) {
    const { width, height, pixels } = decodeRgbaPng(file);
    assert.equal(width, 1254, `${file}: largeur commune`);
    assert.equal(height, 1254, `${file}: hauteur commune`);

    let transparentPixels = 0;
    for (let offset = 3; offset < pixels.length; offset += 4) {
      if (pixels[offset] === 0) transparentPixels += 1;
    }
    assert.ok(
      transparentPixels / (width * height) >= 0.3,
      `${file}: au moins 30 % du canevas doit être totalement transparent`,
    );

    const alphaAt = (x, y) => pixels[(y * width + x) * 4 + 3];
    assert.deepEqual(
      [alphaAt(0, 0), alphaAt(width - 1, 0), alphaAt(0, height - 1), alphaAt(width - 1, height - 1)],
      [0, 0, 0, 0],
      `${file}: les quatre coins doivent être transparents`,
    );
  }
});

test("les dérivés servis au navigateur restent légers et les icônes ont les bonnes tailles", () => {
  for (const file of WEB_ASSETS) {
    const webp = readFileSync(new URL(`../assets/brand/${file}`, import.meta.url));
    assert.equal(webp.toString("ascii", 0, 4), "RIFF", `${file}: conteneur RIFF attendu`);
    assert.equal(webp.toString("ascii", 8, 12), "WEBP", `${file}: signature WebP attendue`);
    assert.ok(webp.length < 100 * 1024, `${file}: le dérivé doit rester sous 100 Kio`);
  }

  for (const [file, size] of [["florian-icon-192.png", 192], ["florian-icon-512.png", 512]]) {
    const png = readFileSync(new URL(`../assets/brand/${file}`, import.meta.url));
    assert.equal(png.subarray(0, 8).compare(PNG_SIGNATURE), 0, `${file}: signature PNG invalide`);
    assert.equal(png.readUInt32BE(16), size, `${file}: largeur`);
    assert.equal(png.readUInt32BE(20), size, `${file}: hauteur`);
  }

  const wordmark = readFileSync(new URL("../assets/brand/monflorian-wordmark.png", import.meta.url));
  assert.equal(wordmark.subarray(0, 8).compare(PNG_SIGNATURE), 0, "mot-symbole PNG invalide");
  assert.equal(wordmark.readUInt32BE(16), 676, "largeur haute définition du mot-symbole");
  assert.equal(wordmark.readUInt32BE(20), 362, "hauteur haute définition du mot-symbole");

  for (const [file, width, height] of INTRO_ASSETS) {
    const webp = readFileSync(new URL(`../assets/brand/${file}`, import.meta.url));
    assert.equal(webp.toString("ascii", 0, 4), "RIFF", `${file}: conteneur RIFF attendu`);
    assert.equal(webp.toString("ascii", 8, 12), "WEBP", `${file}: signature WebP attendue`);
    assert.ok(webp.length < 200 * 1024, `${file}: le dérivé d’introduction doit rester sous 200 Kio`);
    assert.deepEqual(webpDimensions(webp, file), { width, height }, `${file}: dimensions d’introduction`);
  }
});

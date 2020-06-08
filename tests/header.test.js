const puppeteer = require('puppeteer');

let browser, page;

beforeEach(async () => {
  browser = await puppeteer.launch({ headless: false });
  page = await browser.newPage();

  await page.goto('localhost:3000');
});

afterEach(async () => {
  await browser.close();
});

test('We launch a browser', async () => {
  // The $eval callback function is serialized and passed to chromium instance,
  // then deserialized back.
  // Jest Node process and Chromium one are 2 separate processes and this is
  // the way they can comunicate.
  const text = await page.$eval('a.brand-logo', (el) => el.innerHTML);

  expect(text).toEqual('Blogster');
});

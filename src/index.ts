import chromium from 'chrome-aws-lambda';
import { addExtra } from 'puppeteer-extra';
import pluginStealth from 'puppeteer-extra-plugin-stealth';

export async function handler() {
    const puppeteerExtra = addExtra(chromium.puppeteer as any);
    puppeteerExtra.use(pluginStealth());

    const browser = await puppeteerExtra
        .launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless
        });

    const page = await browser.newPage();

    await page.goto('https://bot.sannysoft.com/');
    const rows = await page.$$('table:nth-of-type(1) tr');

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const handleTest = await row.$('th');

        if (handleTest) {
            console.log('We are in a header row, skipping');
            continue;
        }

        const test = await row.$eval('td:nth-of-type(1)', element => element.textContent);
        const result = await row.$eval('td:nth-of-type(2)', element => element.textContent);

        console.log('Test:', test, 'Result:', result);
        
    }

    await browser.close();
}
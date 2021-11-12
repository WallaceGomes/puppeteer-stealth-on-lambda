import chromium from 'chrome-aws-lambda';
import { addExtra } from 'puppeteer-extra';
import pluginStealth from 'puppeteer-extra-plugin-stealth';
import RecaptchaPlugin from 'puppeteer-extra-plugin-recaptcha';
import Client from '@infosimples/node_two_captcha';

export async function handler() {
    // await solveRecaptcha();

    await solveSimpleCatcha();
}

async function solveSimpleCatcha() {
    const captchaDecoderClient = new Client(process.env.captchaToken, {
        timeout: 60000,
        polling: 5000,
        throwErrors: false
    });
    const puppeteerExtra = addExtra(chromium.puppeteer as any);
    puppeteerExtra.use(pluginStealth());
    const browser = await puppeteerExtra
        .launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless
        });
    const url = 'https://quickstart.sos.nh.gov/online/BusinessInquire';
    const page = await browser.newPage();
    await page.goto(url);

    const image = await page.screenshot({
        // This should be the region where the simple captcha is located
        clip: { x: 625, y: 400, width: 110, height: 35 },
        encoding: 'base64'
    });

    console.log('base 64 captcha image', image);

    const decodedResponse = await captchaDecoderClient.decode({
        base64: image
    });

    console.log('decodedResponse', decodedResponse._text);
    await page.type('#txtCaptcha', decodedResponse._text.toLocaleUpperCase());
    await page.click('#rbContains');
    await page.type('#txtBusinessName', 'pizza');
    await page.click('#btnSearch');
    await page.waitForSelector('#tdBusinessSearch', { timeout: 10000 });

    const businessName = await page.$eval('#tdBusinessSearch tbody tr:nth-of-type(1) td:nth-of-type(1)', element => element.textContent);
    console.log('businessName', businessName);

    await browser.close();
}

async function solveRecaptcha() {
    const puppeteerExtra = addExtra(chromium.puppeteer as any);
    puppeteerExtra.use(pluginStealth());
    puppeteerExtra.use(
        RecaptchaPlugin({
            provider: { id: '2captcha', token: process.env.captchaToken },
            visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
        })
    );

    const browser = await puppeteerExtra
        .launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless
        });

    const url = 'https://tnbear.tn.gov/Ecommerce/FilingSearch.aspx';

    const page = await browser.newPage();

    await page.goto(url);
    // Captcha is usually there but not always.
    let captcha = false;
    try {
        await page.waitForSelector('.g-recaptcha', { timeout: 5000 });
        captcha = true;
    } catch (e) {
        console.log('No captcha here');
        captcha = false;
    }
    if (captcha) {
        try {
            console.log('About to solve captcha');
            await page.solveRecaptchas();
            console.log('Captcha solved, moving on');
        } catch (e) {
            console.log('Error happened when trying to solve captcha.');
            throw e;
        }
    }

    await page.type('#ctl00_MainContent_txtSearchValue', 'pizza');

    await page.click('#ctl00_MainContent_SearchButton');
    await page.waitForSelector('#ctl00_MainContent_SearchResultList');
    const businessName = await page.$eval('#ctl00_MainContent_SearchResultList tbody tr:nth-of-type(2) td:nth-of-type(3)', element => element.textContent);

    console.log('business name', businessName);

    await browser.close();
}

async function testStealth() {
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
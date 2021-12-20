import chromium from 'chrome-aws-lambda';
import recaptcha from 'puppeteer-extra-plugin-recaptcha';
import pluginStealth from 'puppeteer-extra-plugin-stealth';
import { addExtra } from 'puppeteer-extra';
import AWS from 'aws-sdk';

AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRECT_KEY,
});

const s3 = new AWS.S3();
const bucket = 'rpapuppeteerscreenshots';
const prints = [];

const USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.131 Safari/537.36';


exports.handler = async function (event) {
    const { queryStringParameters } = event;
    const { user, pass, url, program } = queryStringParameters;

    let response;

    try {
        switch (program) {
            case 'azul':
                response = await scrapAzul(user, pass, url);
                break;
            case 'latam':
                response = await scrapLatam(user, pass, url);
        
            default:
                response = await scrap(user, pass, url);
                break;
        }

    } catch (error) {
        response = {
			error:
				'Ocorreu um erro durante a operação. Cheque seus dados e tente novamente.',
		};
    }

    return response;
}

async function scrap(user, pass, url) {
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

    page.setDefaultNavigationTimeout(30000);

    console.log(`Loading page...:${url}`);
    await page.goto(url);

    console.log('page loaded!')
    await browser.close();

    return { miles: 'ok', expiryDate: 'ok' };
}

async function scrapAzul(user, pass, url) {

    const puppeteerExtra = addExtra(chromium.puppeteer as any);

	const browser = await puppeteerExtra.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath,
        headless: chromium.headless,
        ignoreHTTPSErrors: true,
    });

    //página de extrato https://tudoazul.voeazul.com.br/group/azul/activity-history
    //página de login https://apps.voeazul.com.br/TudoAzulRenew/

	const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);

    console.log(`Loading page...:${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('#agentName');
    console.log('type login');
    await page.type('#agentName', user, {
        delay: 50,
    });
    await page.waitForSelector('#password');
    console.log('type password');
    await page.type('#password', pass, {
        delay: 50,
    });
    await page.click('#btnEfetuarLogin');
    console.log('click login');

    //if the form has some error the rpa will not find the button
    // await page.waitForSelector(
    //     'a.btn.btn-block.btn-outline.btn-outline-light',
    //     { timeout: 30000 },
    // );
    // await page.click('a.btn.btn-block.btn-outline.btn-outline-light');

    await page.goto('https://tudoazul.voeazul.com.br/group/azul/activity-history', { waitUntil: 'networkidle2' });

    await page.waitForSelector('#balance');
    const balance = await page.evaluate(() => {
        const auxBalance = document.getElementById('balance');
        const miles = auxBalance.textContent;
        return miles;
    });

    // const expDate = await page.evaluate(() => {
    // 	const auxDate = document.querySelector('.ng-binding.ng-scope');
    // 	const date = auxDate.innerText;
    // 	if (date) {
    // 		return date.replace('A vencer (', '').replace(')', '').replace(':', '');
    // 	}
    // });

    const expDate = page.$eval('.ng-binding.ng-scope', element => element.innerHTML);

    console.log(`Milhas : ${balance}`);
    console.log(`Date : ${expDate}`);
    console.log('finish');

    await browser.close();

    return { miles: balance, expiryDate: expDate };
}

async function scrapLatam(user, pass, url) {
    const puppeteerExtra = addExtra(chromium.puppeteer as any);
    puppeteerExtra.use(pluginStealth());
    puppeteerExtra.use(
        recaptcha({
            provider: {
                id: '2captcha',
                token: process.env.CAPTCHA_KEY,
            },
            visualFeedback: true,
        }),
    );

    const browser = await puppeteerExtra
        .launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless
        });

	const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);
    await page.setUserAgent(USER_AGENT);
	await page.setJavaScriptEnabled(true);
	await page.setDefaultTimeout(0);

	// Randomize viewport size
	await page.setViewport({
		width: 1200 + Math.floor(Math.random() * 100),
		height: 720 + Math.floor(Math.random() * 100),
		deviceScaleFactor: 1,
		hasTouch: false,
		isLandscape: false,
		isMobile: false,
	});

	// Skip images/styles/fonts loading for performance
	await page.setRequestInterception(true);
	page.on('request', (req) => {
		if (
			req.resourceType() == 'stylesheet' ||
			req.resourceType() == 'font' ||
			req.resourceType() == 'image'
		) {
			req.abort();
		} else {
			req.continue();
		}
	});

	await page.evaluateOnNewDocument(() => {
		// Pass webdriver check
		Object.defineProperty(navigator, 'webdriver', {
			get: () => false,
		});
	});

	await page.evaluateOnNewDocument(() => {
		// Overwrite the `plugins` property to use a custom getter.
		Object.defineProperty(navigator, 'plugins', {
			// This just needs to have `length > 0` for the current test,
			// but we could mock the plugins too if necessary.
			get: () => [1, 2, 3, 4, 5],
		});
	});

	await page.evaluateOnNewDocument(() => {
		// Overwrite the `languages` property to use a custom getter.
		Object.defineProperty(navigator, 'languages', {
			get: () => ['en-US', 'en'],
		});
	});

    console.log('Loading page...: https://www.pontosmultiplus.com.br/portal/');

    await page.goto('https://www.pontosmultiplus.com.br/portal/', { waitUntil: 'networkidle2' });

    // await page.waitForSelector('#auth0-login');
    // await page.click('#auth0-login');
    await page.waitForSelector('#form-input--alias');
    console.log(`type login: ${user}`);
    await page.type('#form-input--alias', user, {
        delay: 100,
    });
    await page.waitForSelector('#form-input--password');
    console.log(`type password: ${pass}`);
    await page.type('#form-input--password', pass, {
        delay: 100,
    });
    await page.waitForTimeout(1000)
    await page.solveRecaptchas();
    await page.click('#form-button--submit');
    console.log('click login');

    await page.waitForTimeout(15000)

    // console.log(
    // 	'Loading page...:https://www.pontosmultiplus.com.br/portal/pages/home.html',
    // );

    // // console.log('EXP page...');
    // await page.goto(
    // 	'https://www.pontosmultiplus.com.br/portal/pages/home.html',
    //     { waitUntil: 'networkidle2' }
    // );

    const print = await page.screenshot();
    const params = {
        Bucket: bucket,
        Key: `${(Math.random() * 10000).toFixed(0).toString()}.png`,
        Body: print,
    }
    await s3.putObject(params).promise();
    // await page.waitForSelector('#dropdownMenuButton');
    // console.log(
    //     'Loading page...:https://www.pontosmultiplus.com.br/portal/pages/home.html',
    // );

    // // console.log('EXP page...');
    // await page.goto(
    //     'https://www.pontosmultiplus.com.br/portal/pages/home.html',
    // );

    // await page.waitForSelector('a.header-account__my-account.small');
    // await page.click('a.header-account__my-account.small');

    // console.log('EXP page...');

    // await page.waitForSelector('#info-box-points');

    // await page.waitForTimeout(500);

    return { miles: 'ok', expiryDate: 'ok' };
}

# Cool Puppeteer things on Lambda (stealth and solving captchas)

This package has some examples of how to run Puppeteer on Lambda in stealth mode (so stealthy) and also solving both reCaptcha and simple image captchas.

## Getting Started

Clone the repository and run `npm i`.

I have a neat script in the package.json that allows you to easily push to Lambda. You'll need to create and rename the s3 bucket and rename the lambda function name to match your own.

Then...just comment in the function you want to use and run it!

* [Video: Setting up Puppeteer Stealth on Lambda](https://www.youtube.com/watch?v=pkqIEv9i1KY)
* [Video: How to Solve reCaptchas with Puppeteer](https://www.youtube.com/watch?v=D52NjoZWn14)
* [Video: How to Solve Simple Captchas with Puppeteer](https://www.youtube.com/watch?v=r-ANFgW5Y3o)

### Prerequisites

Tested on Node v14.17.5 and NPM v6.14.14.

### Installing

After installing [NodeJS](https://nodejs.org/en/) you should be able to just run the following in the terminal.

```
npm i
```

## Built With

* [NodeJS](https://nodejs.org/en/) - NodeJS
* [2Captcha](https://2captcha.com?from=7390140) - 2Captcha
* [puppeteer](https://github.com/puppeteer/puppeteer) - Headless browser
* [puppeteer-extra](https://github.com/berstend/puppeteer-extra) - Amazing package for extra puppeteer plugins
* [chrome-aws-lambda](https://github.com/alixaxel/chrome-aws-lambda) - Allows you to run Puppeteer on lambda
* [@infosimples/node_two_captcha](https://github.com/infosimples/node_two_captcha) - Easy way to interface with 2Captcha

## Authors

* **Jordan Hansen** - *Initial work* - [Jordan Hansen](https://github.com/aarmora)


## License

This project is licensed under the ISC License

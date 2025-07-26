const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
require('dotenv').config();

const chrome = require('selenium-webdriver/chrome');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { setTimeout } = require('timers/promises');

const LOG_FILE = path.resolve(__dirname, 'logs', 'last_run.log');
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
const logStream = fs.createWriteStream(LOG_FILE, { flags: 'w' });

function log(...args) {
  const msg = args.map(String).join(' ');
  console.log(msg);
  logStream.write(`[${new Date().toISOString()}] ${msg}\n`);
}

const timeoutTime = 10000;

const clickElementWithFallback = async (driver, selectors) => {
  for (const sel of selectors) {
    try {
      const el = await driver.wait(until.elementLocated(sel), timeoutTime);
      await driver.wait(until.elementIsVisible(el), timeoutTime);
      await driver.wait(until.elementIsEnabled(el), timeoutTime);
      await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", el);
      await driver.executeScript("arguments[0].click();", el);
      return true;
    } catch {}
  }
  return false;
};

const fillInputSafely = async (driver, el, value) => {
  await setTimeout(200);
  await driver.executeScript(`
    arguments[0].value = arguments[1];
    arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
    arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
  `, el, value);
};

async function performGoogleLogin(driver) {
  const email = process.env.EMAIL;
  const password = process.env.PASSWORD;
  if (!email || !password) {
    log("EMAIL and PASSWORD must be set in the environment or .env");
    process.exit(1);
  }

  log("Starting Google login...");
  await driver.get('https://home.google.com/login');
  await setTimeout(3000);

  try {
    const emailInput = await driver.wait(until.elementLocated(By.css('input[type="email"]')), timeoutTime);
    await fillInputSafely(driver, emailInput, email);
    const emailClicked = await clickElementWithFallback(driver, [
      By.id('identifierNext'),
      By.css('button[jsname="LgbsSe"]'),
      By.css('button:nth-of-type(2)')
    ]);
    if (!emailClicked) throw new Error("Could not click email 'Next' button.");
    log("Submitted email");
    await setTimeout(2000);
  } catch (err) {
    log("Email input error:", err.message);
    throw err;
  }

  try {
    const passwordInput = await driver.wait(until.elementLocated(By.css('input[type="password"]')), timeoutTime);
    await fillInputSafely(driver, passwordInput, password);
    const passwordClicked = await clickElementWithFallback(driver, [
      By.id('passwordNext'),
      By.css('button[jsname="LgbsSe"]'),
      By.css('button:nth-of-type(2)')
    ]);
    if (!passwordClicked) throw new Error("Could not click password 'Next' button.");
    log("Submitted password, waiting...");
    await setTimeout(20000);
  } catch (err) {
    log("Password input error:", err.message);
    throw err;
  }
}

async function setupBrowser() {
  const options = new chrome.Options()
    .addArguments(`--user-data-dir=${path.resolve(__dirname, 'profile')}`)
    .addArguments('--profile-directory=Default')
    .addArguments('--disable-blink-features=AutomationControlled')
    .addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.91 Safari/537.36')
    .excludeSwitches('enable-automation')
    .addArguments('--enable-unsafe-swiftshader', '--no-sandbox', '--disable-dev-shm-usage', '--disable-extensions', '--disable-background-networking', '--disable-sync', '--metrics-recording-only', '--disable-default-apps', '--mute-audio', '--disable-translate', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=TranslateUI,BlinkGenPropertyTrees', '--blink-settings=imagesEnabled=false', '--window-size=800,600');

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
  try {
    await driver.get('https://home.google.com/u/0/');
    await driver.wait(until.elementLocated(By.css('body')), 7000);
  } catch {
    log("Login required, starting auth...");
    await performGoogleLogin(driver);
    await driver.get('https://home.google.com/u/0/');
    await driver.wait(until.elementLocated(By.css('body')), 7000);
  }
  return driver;
}

async function clickAutomation(driver, name) {
  try {
    const el = await driver.wait(until.elementLocated(
      By.xpath(`//div[contains(@class, 'automation-name') and normalize-space(text())='${name}']`)
    ), timeoutTime);
    const card = await el.findElement(By.xpath('./ancestor::mat-card[1]'));
    let clickable;
    try {
      clickable = await card.findElement(By.css('span.mat-ripple.mat-mdc-button-ripple'));
    } catch {
      clickable = await card.findElement(By.css('button'));
    }
    await driver.wait(until.elementIsVisible(clickable), timeoutTime);
    await driver.wait(until.elementIsEnabled(clickable), timeoutTime);
    await driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", clickable);
    await driver.actions({ bridge: true }).move({ origin: clickable }).perform();
    await driver.executeScript("arguments[0].focus();", clickable);
    await driver.executeScript("arguments[0].click();", clickable);
    log(`Clicked automation: "${name}"`);
    return true;
  } catch (err) {
    log("Error clicking automation:", err.message);
    return false;
  }
}

(async () => {
  const driver = await setupBrowser();

  const server = http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/command') {
      let body = '';
      req.on('data', chunk => body += chunk.toString());
      req.on('end', async () => {
        const command = JSON.parse(body).command?.trim();
        if (!command) {
          res.writeHead(400);
          return res.end('Missing "command" field.');
        }

        log(`Received command: ${command}`);
        const success = await clickAutomation(driver, command);
        res.writeHead(success ? 200 : 500);
        res.end(success ? 'Clicked' : 'Failed to click');
      });
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(8602, () => {
    log("Daemon ready at http://localhost:8602/command");
  });

  process.on('SIGINT', async () => {
    log('Shutting down...');
    await driver.quit();
    server.close(() => {
      logStream.end();
      process.exit(0);
    });
  });
})();

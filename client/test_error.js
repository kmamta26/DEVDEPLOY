import puppeteer from 'puppeteer';
import fs from 'fs';

let log = '';
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => { log += 'PAGE LOG: ' + msg.text() + '\n'; });
    page.on('pageerror', error => { log += 'PAGE ERROR: ' + error.message + '\n'; });
    
    try {
        await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0', timeout: 10000 });
        log += 'CONTENT START\n';
        const content = await page.content();
        log += content.substring(0, 1000) + '\n';
        log += 'CONTENT END\n';
    } catch (e) {
        log += 'Nav error: ' + e.message + '\n';
    }
    
    fs.writeFileSync('out.txt', log, 'utf8');
    await browser.close();
})();

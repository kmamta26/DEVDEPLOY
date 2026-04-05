import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    let text = "";
    
    page.on('console', msg => { text += 'CONSOLE: ' + msg.text() + '\n'; });
    page.on('pageerror', error => { text += 'PAGE_ERROR: ' + error.message + '\n'; });
    
    try {
        await page.goto('http://localhost:5000/login', { waitUntil: 'networkidle0', timeout: 5000 });
        text += '\n--- HTML ---\n';
        const html = await page.content();
        text += html;
    } catch (e) {
        text += 'Nav Error: ' + e.message + '\n';
    }
    
    fs.writeFileSync('page_dump.txt', text, 'utf8');
    await browser.close();
})();

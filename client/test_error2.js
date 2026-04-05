import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));
    
    page.on('response', response => {
        if (!response.ok() && response.status() !== 200 && response.status() !== 304) {
            console.log('BAD RESPONSE:', response.status(), response.url());
        }
    });

    try {
        await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0', timeout: 10000 });
        const content = await page.content();
        console.log("HTML ROOT:", content.match(/<div id="root">.*?<\/div>/s)?.[0] || 'NO ROOT DIV');
    } catch (e) {
        console.log('Nav error:', e.message);
    }
    
    await browser.close();
})();

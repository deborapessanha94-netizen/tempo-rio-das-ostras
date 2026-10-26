import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 900})
        await page.goto("http://localhost:9012/index.html", wait_until="networkidle")
        
        # Click button to open modal
        btn = page.locator("#dock-btn-meteogramas")
        await btn.click()
        await page.wait_for_timeout(500)
        
        # Screenshot modal
        modal = page.locator("#modal-meteogramas")
        await modal.screenshot(path="C:/Users/debor/.gemini/antigravity/brain/ec824ae4-216a-462f-9550-50517e326bdf/meteo_current_modal.png")
        await browser.close()

asyncio.run(run())

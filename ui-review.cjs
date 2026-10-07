const fs=require('fs');
const {chromium}=require('C:/Users/nader/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
const browser=await chromium.launch({headless:true,channel:'msedge'});
const page=await browser.newPage();
const modules=['dashboard','events','items','purchase','suppliers','warehouse','staff','dispatch','returns','reports','settings'];
const files=['dashboard.css','mobile-sidebar-offcanvas.css','Events.css','Items.css','Purchase.css','Suppliers.css','Warehouse.css','Dispatch.css','Returns.css','Reports.css','Settings.css','Staff.css','bites-theme.css'];
const css=files.map(f=>fs.readFileSync('src/styles/'+f,'utf8')).join('\n').replace('../assets/images/bites-background.png','data:image/png;base64,'+fs.readFileSync('src/assets/images/bites-background.png').toString('base64'));
let count=0;const failures=[];
for(const dir of ['ltr','rtl'])for(const width of [1900,1366,1024,768,390])for(const m of modules){
await page.setViewportSize({width,height:1000});
await page.setContent(`<html dir="${dir}"><style>${css}</style><div class="dashboard-page"><aside class="dashboard-sidebar"><div class="sidebar-top"><button class="dashboard-logo">bites</button><nav class="sidebar-nav"><ul class="dashboard-menu">${modules.map(n=>`<li class="${n===m?'active':''}"><button class="dashboard-menu-button"><span class="dashboard-menu-text">${dir==='rtl'?'المخزون ':''}${n}</span></button></li>`).join('')}</ul></nav></div><div class="dashboard-user-wrapper"><button class="dashboard-user"><div class="dashboard-avatar">N</div><div class="dashboard-user-info"><strong>Nada</strong><small>Employee</small></div></button></div></aside><main class="${m}-main"><header class="dashboard-topbar"><div class="dashboard-search"><input placeholder="Search"></div><div class="dashboard-topbar-actions"><button class="dashboard-language-button">العربية</button><button class="dashboard-notification-button">Bell</button></div></header><section class="${m}-title-section"><h1>${m}</h1><button class="add-item-button">Add</button></section><section class="${m}-table-card table-card"><div class="table-header"><h2>${m}</h2></div><div class="${m}-table-wrapper"><table><thead><tr><th>Item</th><th>Quantity</th><th>Actions</th></tr></thead><tbody><tr><td>Inventory</td><td>24</td><td><button>Edit</button></td></tr></tbody></table></div></section></main></div></html>`);
const r=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,nav:getComputedStyle(document.querySelector('.dashboard-menu')).flexDirection,labels:[...document.querySelectorAll('.dashboard-menu-text')].every(x=>getComputedStyle(x).display!=='none'),table:getComputedStyle(document.querySelector('[class$="table-wrapper"]')).overflowX}));
count++;if(r.overflow||r.nav!=='row'||!r.labels||r.table!=='auto')failures.push({dir,width,m,...r});
}
await page.screenshot({path:'C:/Users/nader/.codex/visualizations/2026/10/07/01a11537-7e63-7e72-bc35-00592395706b/inventory-mobile-rtl.png',fullPage:true});
await page.setViewportSize({width:1900,height:1000});
await page.screenshot({path:'C:/Users/nader/.codex/visualizations/2026/10/07/01a11537-7e63-7e72-bc35-00592395706b/inventory-desktop-rtl.png',fullPage:true});
console.log(JSON.stringify({count,failures}));await browser.close();if(failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});

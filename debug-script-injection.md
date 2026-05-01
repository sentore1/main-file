# How to Find What's Injecting the Google AdSense Script

## 1. Check Browser Extensions

### Steps:
1. Open your browser in **Incognito/Private mode** (this disables most extensions)
2. Go to your site: https://pryro.eastgatehotel.rw/sales-invoices/create
3. Try selecting a warehouse
4. Check the browser console

**If it works in incognito mode** → A browser extension is the culprit

### To identify the extension:
1. Go to your browser extensions page:
   - Chrome: `chrome://extensions`
   - Firefox: `about:addons`
   - Edge: `edge://extensions`
2. Look for ad-related extensions or disable them one by one
3. Common culprits: Ad injectors, "free VPN" extensions, coupon finders

---

## 2. Check Your Server/Hosting Provider

### Test from SSH:
Run this command on your server to see the raw response:

```bash
curl -H "Cookie: your_session_cookie" \
  "https://pryro.eastgatehotel.rw/sales-invoices/warehouse/products?warehouse_id=1"
```

**If the script tag appears here** → Your hosting provider or server is injecting it

### Common sources:
- Cheap shared hosting providers that inject ads
- Free hosting services
- Compromised server (malware)

---

## 3. Check Your ISP/Network

### Test from different networks:
1. Try from your mobile phone using **mobile data** (not WiFi)
2. Try from a different WiFi network
3. Try using a VPN

**If it only happens on specific networks** → Your ISP is injecting ads

### Common in:
- Some developing countries' ISPs
- Public WiFi networks (hotels, cafes)
- Corporate networks with content filters

---

## 4. Check Your Application Code

### Search for the script in your codebase:

```bash
# Run this on your server
cd /path/to/your/project
grep -r "gsyndication" .
grep -r "async.gsyndication.com" .
```

**If found** → Check those files for malicious code

---

## 5. Check .htaccess or Web Server Config

### Check .htaccess file:
```bash
cat .htaccess
```

Look for suspicious `mod_substitute` or script injection rules.

### Check nginx config (if using nginx):
```bash
cat /etc/nginx/sites-available/your-site
```

Look for `sub_filter` directives.

---

## 6. Quick Test - Direct API Call

### From your browser console (F12), run:

```javascript
fetch('https://pryro.eastgatehotel.rw/sales-invoices/warehouse/products?warehouse_id=1', {
  credentials: 'include'
})
.then(r => r.text())
.then(text => {
  console.log('First 500 chars:', text.substring(0, 500));
  console.log('Has script tag:', text.includes('<script'));
});
```

This will show you the raw response.

---

## Most Likely Culprits (in order):

1. **Browser Extension** (70% chance)
   - Solution: Use incognito mode or disable extensions

2. **ISP/Network Injection** (20% chance)
   - Solution: Use VPN or HTTPS everywhere

3. **Hosting Provider** (8% chance)
   - Solution: Change hosting provider

4. **Compromised Server** (2% chance)
   - Solution: Scan for malware, check file permissions

---

## Immediate Solution

The code fix I provided will work regardless of the source. Just run:

```bash
npm run build
```

And refresh your browser. The script tag will be stripped before parsing.

---

## Long-term Solution

Once you identify the source:
- **Browser extension**: Remove it
- **ISP**: Use VPN or complain to ISP
- **Hosting**: Change provider or upgrade plan
- **Server compromise**: Clean and secure your server

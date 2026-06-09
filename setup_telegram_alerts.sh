#!/bin/bash

#############################################
# TELEGRAM ALERT SYSTEM (Email Alternative)
# More reliable than email for instant alerts
#############################################

echo "=========================================="
echo "TELEGRAM INSTANT ALERTS SETUP"
echo "=========================================="
echo ""
echo "Telegram is more reliable than email for instant security alerts!"
echo ""
echo "Setup Steps:"
echo "1. Open Telegram app on your phone"
echo "2. Search for @BotFather"
echo "3. Send: /newbot"
echo "4. Follow instructions to create bot"
echo "5. Copy the bot token (looks like: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)"
echo "6. Search for @userinfobot"
echo "7. Send any message to get your Chat ID"
echo ""
read -p "Enter Bot Token: " BOT_TOKEN
read -p "Enter Your Chat ID: " CHAT_ID

# Create Telegram alert script
cat > /root/intrusion_alert.sh << TELEGRAM_EOF
#!/bin/bash

BOT_TOKEN="$BOT_TOKEN"
CHAT_ID="$CHAT_ID"
LOG_FILE="/var/log/intrusion_alerts.log"
ATTACKER_SSH_KEY="IPCsi58xDKuXuq8CMnlIFQHoqiGkyziMQpAks2t0EBa0"

send_telegram() {
    local MESSAGE="\$1"
    curl -s -X POST "https://api.telegram.org/bot\${BOT_TOKEN}/sendMessage" \\
        -d "chat_id=\${CHAT_ID}" \\
        -d "text=\${MESSAGE}" \\
        -d "parse_mode=HTML" >/dev/null 2>&1
}

send_alert() {
    local SUBJECT="\$1"
    local BODY="\$2"
    
    echo "[\$(date)] ALERT: \$SUBJECT" >> "\$LOG_FILE"
    
    MESSAGE="🚨 <b>SECURITY ALERT</b> 🚨

<b>Server:</b> vmi3109658.contaboserver.net
<b>Time:</b> \$(date '+%Y-%m-%d %H:%M:%S')
<b>Alert:</b> \$SUBJECT

<b>Details:</b>
\$BODY

<b>Actions:</b>
• SSH: root@84.247.178.165
• Check: tail -50 /var/log/intrusion_alerts.log"

    send_telegram "\$MESSAGE"
}

ALERTS=0

# Check malware
INFECTED=\$(find /home/*/public_html -name "*.php" -exec grep -l "eval(base64_decode" {} \\; 2>/dev/null | wc -l)
[ "\$INFECTED" -gt 0 ] && { ALERTS=\$((ALERTS+1)); send_alert "Malware: \$INFECTED files" "Found \$INFECTED infected PHP files with eval(base64_decode) malware"; }

# Check SSH key
grep -qr "\$ATTACKER_SSH_KEY" /root/.ssh/ /home/*/.ssh/ 2>/dev/null && { ALERTS=\$((ALERTS+1)); send_alert "Attacker SSH Key" "Known attacker key detected in authorized_keys"; }

# Check processes
SUSP=\$(ps aux | grep -E "defunct|miner|cryptonight" | grep -v grep)
[ -n "\$SUSP" ] && { ALERTS=\$((ALERTS+1)); send_alert "Suspicious Processes" "Found: \${SUSP:0:200}"; }

# Check rootkit
systemctl list-units --all 2>/dev/null | grep -qE "defunct|gssocket" && { ALERTS=\$((ALERTS+1)); send_alert "Rootkit Active" "Detected defunct.service or GSSocket"; }

# Check connections
UNAUTH=\$(who | grep -v "41.173.251.217")
[ -n "\$UNAUTH" ] && { ALERTS=\$((ALERTS+1)); send_alert "Unauthorized Login" "Unknown IP: \$UNAUTH"; }

# Check files
MOD=\$(find /home/solaceministries.org/public_html/wp-config.php /home/login.pryro.com/public_html/public/index.php /home/pos.pryro.com/public_html/public/index.php -type f -mmin -60 2>/dev/null)
[ -n "\$MOD" ] && { ALERTS=\$((ALERTS+1)); send_alert "Files Modified" "\$MOD"; }

# Check protection
for file in /home/solaceministries.org/public_html/wp-config.php /root/.ssh/authorized_keys; do
    [ -f "\$file" ] && ! lsattr "\$file" 2>/dev/null | grep -q "i" && { ALERTS=\$((ALERTS+1)); send_alert "Protection Removed" "Immutable flag removed: \$file"; break; }
done

[ \$ALERTS -eq 0 ] && echo "[\$(date)] ✅ No threats" >> "\$LOG_FILE"

exit \$ALERTS
TELEGRAM_EOF

chmod +x /root/intrusion_alert.sh

# Schedule cron
(crontab -l 2>/dev/null | grep -v intrusion_alert; echo "*/15 * * * * /root/intrusion_alert.sh") | crontab -

# Send test message
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -d "chat_id=${CHAT_ID}" \
    -d "text=✅ <b>Intrusion Detection System Active</b>

Server: vmi3109658.contaboserver.net
IP: 84.247.178.165
Time: $(date)

You will receive instant Telegram alerts for:
✓ Malware detection
✓ SSH key tampering
✓ Suspicious processes
✓ Rootkit activity
✓ Unauthorized logins
✓ File modifications

Scans run every 15 minutes." \
    -d "parse_mode=HTML"

echo ""
echo "=========================================="
echo "✅ TELEGRAM ALERTS ACTIVE!"
echo "=========================================="
echo ""
echo "📱 Check your Telegram app for test message"
echo ""
echo "Configuration:"
echo "  📱 Platform: Telegram"
echo "  ⏱️  Frequency: Every 15 minutes"
echo "  📝 Log: /var/log/intrusion_alerts.log"
echo ""
echo "Commands:"
echo "  Manual scan: /root/intrusion_alert.sh"
echo "  View log: tail -f /var/log/intrusion_alerts.log"
echo ""
echo "=========================================="

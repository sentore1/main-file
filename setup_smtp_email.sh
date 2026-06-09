#!/bin/bash

#############################################
# SETUP EMAIL ALERTS VIA SMTP RELAY
# More reliable than direct postfix
# Email: abdousentore@gmail.com
#############################################

echo "=========================================="
echo "SMTP EMAIL SETUP (Using Gmail SMTP)"
echo "=========================================="
echo ""

# Install required packages
echo "=== Installing Required Packages ==="
apt-get update -qq
apt-get install -y mailutils msmtp msmtp-mta ca-certificates
echo "✅ Packages installed"

# Get Gmail credentials
echo ""
echo "=== Gmail SMTP Configuration ==="
echo "To use Gmail SMTP, you need:"
echo "1. Your Gmail address: abdousentore@gmail.com"
echo "2. Gmail App Password (NOT your regular password)"
echo ""
echo "To create an App Password:"
echo "   1. Go to: https://myaccount.google.com/apppasswords"
echo "   2. Select 'Mail' and 'Other (Custom name)'"
echo "   3. Enter 'Server Alerts' as the name"
echo "   4. Copy the 16-character password"
echo ""
read -p "Enter Gmail App Password (16 chars, no spaces): " -s GMAIL_PASS
echo ""

# Configure msmtp
echo ""
echo "=== Configuring SMTP ==="
cat > /etc/msmtprc << EOF
# Default settings
defaults
auth           on
tls            on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile        /var/log/msmtp.log

# Gmail account
account        gmail
host           smtp.gmail.com
port           587
from           abdousentore@gmail.com
user           abdousentore@gmail.com
password       $GMAIL_PASS

# Set default account
account default : gmail
EOF

chmod 600 /etc/msmtprc
echo "✅ SMTP configured"

# Configure mail to use msmtp
echo ""
echo "=== Configuring Mail Command ==="
cat > /etc/mailrc << 'EOF'
set sendmail="/usr/bin/msmtp"
EOF

# Alternative: Create mail wrapper
cat > /usr/local/bin/sendmail-wrapper.sh << 'EOF'
#!/bin/bash
/usr/bin/msmtp -t "$@"
EOF
chmod +x /usr/local/bin/sendmail-wrapper.sh

# Update alternatives
update-alternatives --set mta /usr/bin/msmtp
echo "✅ Mail command configured"

# Test email
echo ""
echo "=== Sending Test Email ==="
cat > /tmp/test_email.txt << 'EOF'
Subject: ✅ Test - Server Email Alerts Working
To: abdousentore@gmail.com
From: abdousentore@gmail.com

Test Email from Server Alert System

Server: vmi3109658.contaboserver.net
IP: 84.247.178.165
Time: $(date)

If you received this email, your server alert system is working correctly!

The system will now send you emails when:
✓ Malware is detected
✓ Attacker's SSH key appears
✓ Suspicious processes run
✓ Rootkit services start
✓ Unauthorized connections occur
✓ Critical files are modified

---
Automated Email Alert System
EOF

cat /tmp/test_email.txt | msmtp -t
echo "✅ Test email sent!"
rm /tmp/test_email.txt

echo ""
echo "=== Verifying ==="
sleep 2
tail -10 /var/log/msmtp.log
echo ""

# Now update the intrusion detection script to use msmtp
echo ""
echo "=== Updating Intrusion Detection Script ==="
cat > /root/intrusion_alert.sh << 'SCRIPT_EOF'
#!/bin/bash

ALERT_EMAIL="abdousentore@gmail.com"
LOG_FILE="/var/log/intrusion_alerts.log"
ATTACKER_SSH_KEY="IPCsi58xDKuXuq8CMnlIFQHoqiGkyziMQpAks2t0EBa0"

send_alert() {
    local SUBJECT="$1"
    local BODY="$2"
    
    echo "[$(date)] ALERT: $SUBJECT" >> "$LOG_FILE"
    echo "$BODY" >> "$LOG_FILE"
    
    # Create email with proper headers
    cat > /tmp/alert_email.txt << ALERT_EOF
To: $ALERT_EMAIL
From: $ALERT_EMAIL
Subject: 🚨 SECURITY ALERT: $SUBJECT

🚨 SERVER COMPROMISE DETECTED! 🚨

Server: vmi3109658.contaboserver.net (84.247.178.165)
Time: $(date)
Alert Type: $SUBJECT

DETAILS:
========
$BODY

IMMEDIATE ACTIONS:
==================
1. SSH to server: ssh root@84.247.178.165
2. Check log: tail -50 $LOG_FILE
3. Active connections: who
4. Recent logins: last -i -n 20

CURRENT SERVER STATUS:
======================
Uptime: $(uptime)

Active SSH Sessions:
$(who)

Recent Logins (Last 10):
$(last -i -n 10 | head -15)

---
Automated Security Alert System
ALERT_EOF

    # Send using msmtp
    /usr/bin/msmtp -t < /tmp/alert_email.txt
    rm -f /tmp/alert_email.txt
}

ALERTS=0

# Check 1: Malware
INFECTED=$(find /home/*/public_html -name "*.php" -exec grep -l "eval(base64_decode" {} \; 2>/dev/null | wc -l)
if [ "$INFECTED" -gt 0 ]; then
    ALERTS=$((ALERTS+1))
    FILES=$(find /home/*/public_html -name "*.php" -exec grep -l "eval(base64_decode" {} \; 2>/dev/null | head -10)
    send_alert "Malware - $INFECTED files infected" "Found $INFECTED PHP files with eval(base64_decode) malware:

$FILES

Clean with:
find /home/*/public_html -name '*.php' -exec grep -l 'eval(base64_decode' {} \\;"
fi

# Check 2: Attacker SSH key
if grep -qr "$ATTACKER_SSH_KEY" /root/.ssh/ /home/*/.ssh/ 2>/dev/null; then
    ALERTS=$((ALERTS+1))
    LOCS=$(grep -r "$ATTACKER_SSH_KEY" /root/.ssh/ /home/*/.ssh/ 2>/dev/null)
    send_alert "Attacker SSH Key Detected" "The known attacker SSH key was found:

$LOCS

Remove immediately:
chattr -i /root/.ssh/authorized_keys
grep -v 'IPCsi58xDKuXuq8CMnlIFQHoqiGkyziMQpAks2t0EBa0' /root/.ssh/authorized_keys > /tmp/clean
cat /tmp/clean > /root/.ssh/authorized_keys
chattr +i /root/.ssh/authorized_keys"
fi

# Check 3: Suspicious processes
SUSP=$(ps aux | grep -E "defunct|miner|cryptonight|xmrig" | grep -v grep)
if [ -n "$SUSP" ]; then
    ALERTS=$((ALERTS+1))
    send_alert "Suspicious Processes" "Detected suspicious processes:

$SUSP

Kill with: pkill -9 defunct"
fi

# Check 4: Rootkit
if systemctl list-units --all 2>/dev/null | grep -qE "defunct|gssocket"; then
    ALERTS=$((ALERTS+1))
    SERVICES=$(systemctl list-units --all 2>/dev/null | grep -E "defunct|gssocket")
    send_alert "Rootkit Service" "Rootkit detected:

$SERVICES

Stop with:
systemctl stop defunct
systemctl disable defunct"
fi

# Check 5: Unauthorized connections
UNAUTH=$(who | grep -v "41.173.251.217")
if [ -n "$UNAUTH" ]; then
    ALERTS=$((ALERTS+1))
    send_alert "Unauthorized Connection" "Unknown IP connected:

$UNAUTH

Your legitimate IP: 41.173.251.217"
fi

# Check 6: File modifications
MOD=$(find /home/solaceministries.org/public_html/wp-config.php /home/login.pryro.com/public_html/public/index.php /home/pos.pryro.com/public_html/public/index.php -type f -mmin -60 2>/dev/null)
if [ -n "$MOD" ]; then
    ALERTS=$((ALERTS+1))
    send_alert "Critical Files Modified" "Protected files modified in last hour:

$MOD"
fi

# Check 7: Immutable flags
for file in /home/solaceministries.org/public_html/wp-config.php /home/login.pryro.com/public_html/public/index.php /home/pos.pryro.com/public_html/public/index.php /root/.ssh/authorized_keys; do
    if [ -f "$file" ] && ! lsattr "$file" 2>/dev/null | grep -q "i"; then
        ALERTS=$((ALERTS+1))
        send_alert "Protection Removed" "Immutable flag removed from:

$file

Re-protect: chattr +i $file"
        break
    fi
done

[ $ALERTS -eq 0 ] && echo "[$(date)] ✅ No threats" >> "$LOG_FILE"

exit $ALERTS
SCRIPT_EOF

chmod +x /root/intrusion_alert.sh
echo "✅ Intrusion detection script updated"

# Schedule cron job
echo ""
echo "=== Scheduling Automatic Scans ==="
(crontab -l 2>/dev/null | grep -v intrusion_alert; echo "*/15 * * * * /root/intrusion_alert.sh >/dev/null 2>&1") | crontab -
echo "✅ Scheduled every 15 minutes"

# Final test
echo ""
echo "=== Final Test ==="
/root/intrusion_alert.sh
TEST_RESULT=$?

echo ""
echo "=========================================="
echo "✅ SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  📧 Email: abdousentore@gmail.com"
echo "  📡 SMTP: Gmail (smtp.gmail.com:587)"
echo "  ⏱️  Frequency: Every 15 minutes"
echo "  📝 Log: /var/log/intrusion_alerts.log"
echo "  📋 SMTP Log: /var/log/msmtp.log"
echo ""
echo "Test Results:"
if [ $TEST_RESULT -eq 0 ]; then
    echo "  ✅ No threats detected"
else
    echo "  ⚠️  $TEST_RESULT threats found - check email!"
fi
echo ""
echo "Commands:"
echo "  Manual scan: /root/intrusion_alert.sh"
echo "  View log: tail -f /var/log/intrusion_alerts.log"
echo "  SMTP log: tail -f /var/log/msmtp.log"
echo "  Test email: echo 'test' | mail -s 'test' abdousentore@gmail.com"
echo ""
echo "📧 CHECK YOUR EMAIL NOW!"
echo "   (Check spam folder too)"
echo ""
echo "=========================================="

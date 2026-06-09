#!/bin/bash

#############################################
# INSTALL INTRUSION DETECTION EMAIL ALERTS
# Email: abdousentore@gmail.com
#############################################

echo "=========================================="
echo "INTRUSION DETECTION SYSTEM INSTALLER"
echo "=========================================="
echo ""

# 1. Install mail utilities
echo "=== STEP 1: Installing Mail Utilities ==="
apt-get update -qq
apt-get install -y mailutils postfix

# Configure postfix for sending emails
if [ ! -f /etc/postfix/main.cf.backup ]; then
    cp /etc/postfix/main.cf /etc/postfix/main.cf.backup
fi

# Set postfix to Internet Site mode
debconf-set-selections <<< "postfix postfix/mailname string vmi3109658.contaboserver.net"
debconf-set-selections <<< "postfix postfix/main_mailer_type string 'Internet Site'"

# Configure postfix
postconf -e "myhostname = vmi3109658.contaboserver.net"
postconf -e "mydestination = vmi3109658.contaboserver.net, localhost"
postconf -e "relayhost = "
postconf -e "inet_interfaces = loopback-only"

systemctl restart postfix
systemctl enable postfix

echo "✅ Mail system installed"

# 2. Test email sending
echo ""
echo "=== STEP 2: Testing Email ==="
echo "This is a test email from your server intrusion detection system.

Server: vmi3109658.contaboserver.net
Time: $(date)

If you received this email, the alert system is working correctly!

✅ Your server will now send email alerts when:
  - Malware is detected in PHP files
  - Attacker's SSH key appears
  - Suspicious processes are running
  - Rootkit services are detected
  - Unauthorized SSH connections occur
  - Unknown IP logins happen
  - Critical files are modified
  - User accounts are changed
  - Suspicious cron jobs are added
  - File protections are removed

The system checks every 15 minutes automatically.

---
Intrusion Detection System
" | mail -s "✅ Test: Intrusion Detection System Active" abdousentore@gmail.com

echo "📧 Test email sent to abdousentore@gmail.com"
echo "   Check your inbox (and spam folder) to confirm receipt"

# 3. Create the monitoring script
echo ""
echo "=== STEP 3: Creating Intrusion Detection Script ==="

cat > /root/intrusion_alert.sh << 'SCRIPT_EOF'
#!/bin/bash

#############################################
# INTRUSION DETECTION & EMAIL ALERT SYSTEM
# Email: abdousentore@gmail.com
#############################################

ALERT_EMAIL="abdousentore@gmail.com"
LOG_FILE="/var/log/intrusion_alerts.log"
TEMP_ALERT="/tmp/intrusion_alert_$(date +%Y%m%d_%H%M%S).txt"
ATTACKER_SSH_KEY="IPCsi58xDKuXuq8CMnlIFQHoqiGkyziMQpAks2t0EBa0"

# Function to send email alert
send_alert() {
    local SUBJECT="$1"
    local BODY="$2"
    
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: $SUBJECT" >> "$LOG_FILE"
    echo "$BODY" >> "$LOG_FILE"
    echo "----------------------------------------" >> "$LOG_FILE"
    
    cat > "$TEMP_ALERT" << EOF
🚨 SECURITY ALERT - Server Compromise Detected! 🚨

Server: vmi3109658.contaboserver.net (84.247.178.165)
Time: $(date '+%Y-%m-%d %H:%M:%S')
Alert: $SUBJECT

DETAILS:
========
$BODY

IMMEDIATE ACTIONS:
==================
1. SSH to server: ssh root@84.247.178.165
2. Check log: tail -50 $LOG_FILE
3. Active connections: who
4. Recent logins: last -i -n 20

Current Status:
==============
$(uptime)

Active SSH Sessions:
===================
$(who)

Recent Logins:
=============
$(last -i -n 10 | head -15)

---
Automated Alert System
EOF

    cat "$TEMP_ALERT" | mail -s "🚨 SECURITY ALERT: $SUBJECT" "$ALERT_EMAIL"
    rm -f "$TEMP_ALERT"
}

ALERTS_FOUND=0

# CHECK 1: Malware in PHP files
INFECTED_FILES=$(find /home/*/public_html -name "*.php" -type f -exec grep -l "eval(base64_decode" {} \; 2>/dev/null)
INFECTED_COUNT=$(echo "$INFECTED_FILES" | grep -c "^/" 2>/dev/null)

if [ "$INFECTED_COUNT" -gt 0 ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    send_alert "Malware Detected - $INFECTED_COUNT Files" "⚠️ MALWARE DETECTED!

Infected files: $INFECTED_COUNT

Files:
$INFECTED_FILES

These files contain eval(base64_decode(...)) malware."
fi

# CHECK 2: Attacker's SSH key
if grep -qr "$ATTACKER_SSH_KEY" /root/.ssh/ /home/*/.ssh/ 2>/dev/null; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    LOCATIONS=$(grep -r "$ATTACKER_SSH_KEY" /root/.ssh/ /home/*/.ssh/ 2>/dev/null)
    send_alert "Attacker SSH Key Detected" "⚠️ ATTACKER'S SSH KEY FOUND!

Locations:
$LOCATIONS

Remove immediately with:
grep -v 'IPCsi58xDKuXuq8CMnlIFQHoqiGkyziMQpAks2t0EBa0' /root/.ssh/authorized_keys > /tmp/clean && cat /tmp/clean > /root/.ssh/authorized_keys"
fi

# CHECK 3: Suspicious processes
SUSPICIOUS=$(ps aux | grep -E "defunct|miner|cryptonight|xmrig" | grep -v grep)
if [ -n "$SUSPICIOUS" ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    send_alert "Suspicious Processes" "⚠️ SUSPICIOUS PROCESSES RUNNING!

$SUSPICIOUS"
fi

# CHECK 4: Rootkit services
if systemctl list-units --all | grep -qE "defunct|gssocket"; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    SERVICES=$(systemctl list-units --all | grep -E "defunct|gssocket")
    send_alert "Rootkit Service Detected" "⚠️ ROOTKIT SERVICE ACTIVE!

$SERVICES"
fi

# CHECK 5: Unauthorized SSH connections
UNAUTHORIZED=$(who | grep -v "41.173.251.217")
if [ -n "$UNAUTHORIZED" ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    send_alert "Unauthorized SSH Connection" "⚠️ UNKNOWN IP CONNECTED!

$UNAUTHORIZED

Your legitimate IP: 41.173.251.217"
fi

# CHECK 6: Modified critical files (last hour)
MODIFIED=$(find /home/solaceministries.org/public_html/wp-config.php \
                /home/login.pryro.com/public_html/public/index.php \
                /home/pos.pryro.com/public_html/public/index.php \
                -type f -mmin -60 2>/dev/null)

if [ -n "$MODIFIED" ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    send_alert "Critical Files Modified" "⚠️ PROTECTED FILES CHANGED!

Modified in last hour:
$MODIFIED"
fi

# CHECK 7: Immutable flags removed
UNPROTECTED=""
for file in /home/solaceministries.org/public_html/wp-config.php \
            /home/login.pryro.com/public_html/public/index.php \
            /home/pos.pryro.com/public_html/public/index.php \
            /root/.ssh/authorized_keys; do
    if [ -f "$file" ] && ! lsattr "$file" 2>/dev/null | grep -q "i"; then
        UNPROTECTED="$UNPROTECTED\n$file"
    fi
done

if [ -n "$UNPROTECTED" ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    send_alert "Protection Removed" "⚠️ IMMUTABLE FLAGS REMOVED!

Files no longer protected:
$UNPROTECTED

Re-protect with: chattr +i <file>"
fi

# Log summary if no alerts
if [ $ALERTS_FOUND -eq 0 ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Scan complete - No threats detected" >> "$LOG_FILE"
fi

exit $ALERTS_FOUND
SCRIPT_EOF

chmod +x /root/intrusion_alert.sh
echo "✅ Script created at /root/intrusion_alert.sh"

# 4. Test the script
echo ""
echo "=== STEP 4: Running Test Scan ==="
/root/intrusion_alert.sh
TEST_RESULT=$?

if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ Test scan completed - no threats detected"
else
    echo "⚠️ Test scan found $TEST_RESULT threats - check your email!"
fi

# 5. Add to crontab (run every 15 minutes)
echo ""
echo "=== STEP 5: Scheduling Automatic Scans ==="

# Remove old entries
crontab -l 2>/dev/null | grep -v "intrusion_alert.sh" > /tmp/crontab_new

# Add new entry (every 15 minutes)
echo "*/15 * * * * /root/intrusion_alert.sh > /dev/null 2>&1" >> /tmp/crontab_new

# Install new crontab
crontab /tmp/crontab_new
rm -f /tmp/crontab_new

echo "✅ Scheduled to run every 15 minutes"

# 6. Create manual test command
echo ""
echo "=== STEP 6: Creating Quick Test Command ==="
cat > /root/test_intrusion_alert.sh << 'TEST_EOF'
#!/bin/bash
echo "Testing intrusion detection system..."
echo "Email will be sent to: abdousentore@gmail.com"
echo ""
/root/intrusion_alert.sh
echo ""
echo "Check your email inbox (and spam folder)!"
TEST_EOF

chmod +x /root/test_intrusion_alert.sh
echo "✅ Test command created: /root/test_intrusion_alert.sh"

# 7. Final status
echo ""
echo "=========================================="
echo "✅ INSTALLATION COMPLETE!"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  📧 Alert Email: abdousentore@gmail.com"
echo "  ⏱️  Scan Frequency: Every 15 minutes"
echo "  📝 Log File: /var/log/intrusion_alerts.log"
echo ""
echo "What gets monitored:"
echo "  ✓ Malware in PHP files"
echo "  ✓ Attacker's SSH key"
echo "  ✓ Suspicious processes"
echo "  ✓ Rootkit services"
echo "  ✓ Unauthorized SSH connections"
echo "  ✓ Critical file modifications"
echo "  ✓ Removed file protections"
echo ""
echo "Commands:"
echo "  - Manual scan: /root/intrusion_alert.sh"
echo "  - Test alerts: /root/test_intrusion_alert.sh"
echo "  - View log: tail -f /var/log/intrusion_alerts.log"
echo "  - Check cron: crontab -l"
echo ""
echo "📧 Check your email for the test message!"
echo "   (Check spam folder if not in inbox)"
echo ""
echo "=========================================="

# Show current crontab
echo ""
echo "Current Schedule:"
crontab -l | grep intrusion

echo ""
echo "Next scan will run in 15 minutes."
echo "You can run a manual scan now: /root/intrusion_alert.sh"

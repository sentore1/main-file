#!/bin/bash

#############################################
# INTRUSION DETECTION & EMAIL ALERT SYSTEM
# Monitors for hacking attempts and sends email alerts
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
    
    # Log the alert
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ALERT: $SUBJECT" >> "$LOG_FILE"
    echo "$BODY" >> "$LOG_FILE"
    echo "----------------------------------------" >> "$LOG_FILE"
    
    # Create email body
    cat > "$TEMP_ALERT" << EOF
🚨 SECURITY ALERT - Server Compromise Detected! 🚨

Server: vmi3109658.contaboserver.net (84.247.178.165)
Time: $(date '+%Y-%m-%d %H:%M:%S')
Alert: $SUBJECT

DETAILS:
========
$BODY

IMMEDIATE ACTIONS REQUIRED:
===========================
1. Check server immediately: ssh root@84.247.178.165
2. Review security log: tail -50 $LOG_FILE
3. Check active connections: who
4. Review recent logins: last -i -n 20

Current Server Status:
=====================
$(uptime)

Active SSH Sessions:
===================
$(who)

Recent Login Attempts (Last 10):
================================
$(last -i -n 10 | head -15)

Failed Login Attempts (Last 20):
================================
$(grep "Failed password" /var/log/auth.log | tail -20)

---
This is an automated alert from your server intrusion detection system.
EOF

    # Send email using mail command
    if command -v mail &> /dev/null; then
        cat "$TEMP_ALERT" | mail -s "🚨 SECURITY ALERT: $SUBJECT" "$ALERT_EMAIL"
        echo "✅ Email sent via mail command"
    # Try using sendmail
    elif command -v sendmail &> /dev/null; then
        {
            echo "To: $ALERT_EMAIL"
            echo "Subject: 🚨 SECURITY ALERT: $SUBJECT"
            echo "From: root@vmi3109658.contaboserver.net"
            echo ""
            cat "$TEMP_ALERT"
        } | sendmail -t
        echo "✅ Email sent via sendmail"
    # Try using PHP mail
    elif command -v php &> /dev/null; then
        php -r "mail('$ALERT_EMAIL', '🚨 SECURITY ALERT: $SUBJECT', file_get_contents('$TEMP_ALERT'), 'From: root@vmi3109658.contaboserver.net');"
        echo "✅ Email sent via PHP"
    else
        echo "❌ No mail system available - alert logged only"
    fi
    
    # Clean up
    rm -f "$TEMP_ALERT"
}

echo "=========================================="
echo "INTRUSION DETECTION SCAN"
echo "Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

ALERTS_FOUND=0

# CHECK 1: Malware in PHP files
echo ""
echo "🔍 Checking for malware in PHP files..."
INFECTED_FILES=$(find /home/*/public_html -name "*.php" -type f -exec grep -l "eval(base64_decode" {} \; 2>/dev/null)
INFECTED_COUNT=$(echo "$INFECTED_FILES" | grep -c "^/")

if [ $INFECTED_COUNT -gt 0 ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    ALERT_BODY="⚠️ MALWARE DETECTED IN PHP FILES!

Number of infected files: $INFECTED_COUNT

Infected files:
$INFECTED_FILES

Action Required:
- These files contain eval(base64_decode(...)) malware
- Review and clean these files immediately
- Check file modification times to determine when infection occurred"

    send_alert "Malware Detected - $INFECTED_COUNT Files Infected" "$ALERT_BODY"
    echo "🚨 ALERT: $INFECTED_COUNT infected PHP files found!"
else
    echo "✅ No malware found in PHP files"
fi

# CHECK 2: Attacker's SSH key
echo ""
echo "🔍 Checking for attacker's SSH key..."
ATTACKER_KEYS=$(grep -r "$ATTACKER_SSH_KEY" /root/.ssh/ /home/*/.ssh/ 2>/dev/null)
ATTACKER_KEY_COUNT=$(echo "$ATTACKER_KEYS" | grep -c "$ATTACKER_SSH_KEY")

if [ $ATTACKER_KEY_COUNT -gt 0 ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    ALERT_BODY="⚠️ ATTACKER'S SSH KEY DETECTED!

The known attacker SSH key has been found in authorized_keys files!

Key fingerprint: ssh-ed25519 ...IPCsi58xDKuXuq8CMnlIFQHoqiGkyziMQpAks2t0EBa0

Locations:
$ATTACKER_KEYS

Action Required:
- Remove this SSH key immediately
- Check who added it (check auth.log)
- Review all recent SSH connections
- Consider changing root password"

    send_alert "Attacker SSH Key Detected" "$ALERT_BODY"
    echo "🚨 ALERT: Attacker's SSH key found in $ATTACKER_KEY_COUNT locations!"
else
    echo "✅ Attacker's SSH key not found"
fi

# CHECK 3: Suspicious processes
echo ""
echo "🔍 Checking for suspicious processes..."
SUSPICIOUS_PROCS=$(ps aux | grep -E "defunct|miner|cryptonight|xmrig|masscan|zmap" | grep -v grep)

if [ -n "$SUSPICIOUS_PROCS" ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    ALERT_BODY="⚠️ SUSPICIOUS PROCESSES DETECTED!

The following suspicious processes are running:

$SUSPICIOUS_PROCS

Action Required:
- Kill these processes immediately
- Check what started them
- Review crontab and systemd services
- Check for rootkits"

    send_alert "Suspicious Processes Running" "$ALERT_BODY"
    echo "🚨 ALERT: Suspicious processes detected!"
else
    echo "✅ No suspicious processes found"
fi

# CHECK 4: Rootkit services (defunct.service)
echo ""
echo "🔍 Checking for rootkit services..."
ROOTKIT_SERVICES=$(systemctl list-units --all | grep -E "defunct|gssocket|khugepaged" | grep -v grep)

if [ -n "$ROOTKIT_SERVICES" ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    ALERT_BODY="⚠️ ROOTKIT SERVICE DETECTED!

Suspicious systemd services found:

$ROOTKIT_SERVICES

Known rootkit services detected (defunct.service, GSSocket, etc.)

Action Required:
- Stop and disable these services immediately
- Remove service files from /etc/systemd/system/
- Check for additional rootkit components"

    send_alert "Rootkit Service Detected" "$ALERT_BODY"
    echo "🚨 ALERT: Rootkit services found!"
else
    echo "✅ No rootkit services found"
fi

# CHECK 5: Unauthorized SSH connections
echo ""
echo "🔍 Checking for unauthorized SSH connections..."
CURRENT_CONNECTIONS=$(who | grep -v "41.173.251.217")

if [ -n "$CURRENT_CONNECTIONS" ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    ALERT_BODY="⚠️ UNAUTHORIZED SSH CONNECTION!

Unknown IP address connected to server:

$CURRENT_CONNECTIONS

Your legitimate IP: 41.173.251.217

Action Required:
- Kill this connection immediately
- Check what they're doing: ps aux | grep pts/X
- Review /var/log/auth.log for how they connected
- Change passwords immediately"

    send_alert "Unauthorized SSH Connection" "$ALERT_BODY"
    echo "🚨 ALERT: Unauthorized SSH connection detected!"
else
    echo "✅ All SSH connections are from authorized IP"
fi

# CHECK 6: Recent successful logins from unknown IPs
echo ""
echo "🔍 Checking recent successful logins..."
UNKNOWN_LOGINS=$(last -i -n 20 | grep -v "41.173.251.217" | grep -v "wtmp begins" | grep -v "^$")

if [ -n "$UNKNOWN_LOGINS" ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    ALERT_BODY="⚠️ LOGINS FROM UNKNOWN IP ADDRESSES!

Recent successful logins from IPs other than 41.173.251.217:

$UNKNOWN_LOGINS

Action Required:
- Verify if these are legitimate
- If unauthorized, change all passwords
- Review what these sessions did
- Check auth.log for details"

    send_alert "Unknown IP Logins Detected" "$ALERT_BODY"
    echo "🚨 ALERT: Logins from unknown IPs detected!"
else
    echo "✅ All recent logins from authorized IP"
fi

# CHECK 7: Modified critical files
echo ""
echo "🔍 Checking for recently modified critical files..."
MODIFIED_CONFIGS=$(find /etc/ssh /etc/systemd/system /root/.ssh /home/*/.ssh -type f -mtime -1 2>/dev/null)

if [ -n "$MODIFIED_CONFIGS" ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    ALERT_BODY="⚠️ CRITICAL FILES MODIFIED IN LAST 24 HOURS!

The following critical configuration files were recently modified:

$MODIFIED_CONFIGS

Action Required:
- Review these files for unauthorized changes
- Check file contents and compare with backups
- Verify modification times: ls -la <file>"

    send_alert "Critical Files Modified" "$ALERT_BODY"
    echo "⚠️ WARNING: Critical files modified in last 24 hours"
else
    echo "✅ No critical files modified recently"
fi

# CHECK 8: New users or user modifications
echo ""
echo "🔍 Checking for new or modified user accounts..."
RECENT_PASSWD_MODS=$(find /etc/passwd /etc/shadow /etc/sudoers -type f -mtime -7 2>/dev/null)

if [ -n "$RECENT_PASSWD_MODS" ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    CURRENT_USERS=$(cat /etc/passwd | grep -E "bash|sh" | cut -d: -f1)
    
    ALERT_BODY="⚠️ USER ACCOUNT FILES MODIFIED!

User account files have been modified recently:
$RECENT_PASSWD_MODS

Current users with shell access:
$CURRENT_USERS

Action Required:
- Review /etc/passwd for unauthorized users
- Check /etc/shadow for password changes
- Review /etc/sudoers for privilege escalation
- Check for backdoor accounts"

    send_alert "User Accounts Modified" "$ALERT_BODY"
    echo "⚠️ WARNING: User account files modified recently"
else
    echo "✅ No user account modifications"
fi

# CHECK 9: Suspicious cron jobs
echo ""
echo "🔍 Checking for suspicious cron jobs..."
SUSPICIOUS_CRONS=""
for user in root $(ls /home); do
    if [ -f "/var/spool/cron/crontabs/$user" ]; then
        SUSPICIOUS=$(grep -E "curl|wget|nc|bash|sh|/tmp/|/dev/shm/" /var/spool/cron/crontabs/$user 2>/dev/null)
        if [ -n "$SUSPICIOUS" ]; then
            SUSPICIOUS_CRONS="$SUSPICIOUS_CRONS\n\n[$user]:\n$SUSPICIOUS"
        fi
    fi
done

if [ -n "$SUSPICIOUS_CRONS" ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    ALERT_BODY="⚠️ SUSPICIOUS CRON JOBS DETECTED!

Found potentially malicious cron jobs:
$SUSPICIOUS_CRONS

Action Required:
- Review these cron jobs immediately
- Remove any malicious entries
- Check what these commands do
- Review crontab history"

    send_alert "Suspicious Cron Jobs Found" "$ALERT_BODY"
    echo "🚨 ALERT: Suspicious cron jobs detected!"
else
    echo "✅ No suspicious cron jobs found"
fi

# CHECK 10: Immutable flag status on critical files
echo ""
echo "🔍 Checking immutable flags on critical files..."
UNPROTECTED_FILES=""

for file in /home/solaceministries.org/public_html/wp-config.php \
            /home/login.pryro.com/public_html/public/index.php \
            /home/pos.pryro.com/public_html/public/index.php \
            /root/.ssh/authorized_keys; do
    if [ -f "$file" ]; then
        if ! lsattr "$file" 2>/dev/null | grep -q "i"; then
            UNPROTECTED_FILES="$UNPROTECTED_FILES\n$file"
        fi
    fi
done

if [ -n "$UNPROTECTED_FILES" ]; then
    ALERTS_FOUND=$((ALERTS_FOUND + 1))
    ALERT_BODY="⚠️ CRITICAL FILES LOST IMMUTABLE PROTECTION!

These files should be immutable but are not:
$UNPROTECTED_FILES

Action Required:
- Someone removed immutable flags (chattr -i)
- Re-apply protection: chattr +i <file>
- Investigate who removed the protection
- Check if files were modified"

    send_alert "Immutable Protection Removed" "$ALERT_BODY"
    echo "🚨 ALERT: Immutable flags removed from critical files!"
else
    echo "✅ All critical files properly protected"
fi

# FINAL SUMMARY
echo ""
echo "=========================================="
echo "SCAN COMPLETE"
echo "=========================================="
echo "Finished: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Total Alerts: $ALERTS_FOUND"
echo ""

if [ $ALERTS_FOUND -eq 0 ]; then
    echo "✅ No security threats detected - system is clean"
else
    echo "🚨 $ALERTS_FOUND SECURITY THREATS DETECTED!"
    echo "📧 Alert emails sent to: $ALERT_EMAIL"
    echo "📝 Details logged to: $LOG_FILE"
    echo ""
    echo "⚠️ IMMEDIATE ACTION REQUIRED!"
fi

echo "=========================================="

exit $ALERTS_FOUND

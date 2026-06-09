#!/bin/bash

echo "=========================================="
echo "SERVER SECURITY HARDENING SCRIPT"
echo "=========================================="
echo ""

# 1. CHANGE ROOT PASSWORD
echo "=== STEP 1: Change Root Password ==="
echo "You will be prompted to enter a NEW strong password:"
passwd

# 2. CHANGE CYBERPANEL PASSWORD
echo ""
echo "=== STEP 2: Change CyberPanel Admin Password ==="
read -p "Enter NEW CyberPanel admin password: " -s CYBER_PASS
echo ""
adminPass "$CYBER_PASS"
echo "✅ CyberPanel password changed"

# 3. RESTRICT SSH TO YOUR IP ONLY
echo ""
echo "=== STEP 3: Restrict SSH to Your IP (41.173.251.217) ==="
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup.$(date +%Y%m%d_%H%M%S)

# Add IP restriction if not already present
if ! grep -q "AllowUsers.*@41.173.251.217" /etc/ssh/sshd_config; then
    echo "AllowUsers root@41.173.251.217 cyberpanel@41.173.251.217" >> /etc/ssh/sshd_config
    echo "✅ SSH restricted to 41.173.251.217"
else
    echo "⚠️ SSH restriction already exists"
fi

# Disable password authentication (keep key-based only)
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# Disable root login with password (but allow with keys from your IP)
sed -i 's/PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config

echo "✅ Password authentication disabled"

# 4. PROTECT SSH KEYS (make immutable again)
echo ""
echo "=== STEP 4: Protect SSH Keys ==="
chattr +i /root/.ssh/authorized_keys
chattr +i /home/cyberpanel/.ssh/authorized_keys
chattr +i /home/docker/.ssh/authorized_keys
chattr +i /home/login.pryro.com/.ssh/authorized_keys
chattr +i /home/pos.pryro.com/.ssh/authorized_keys
chattr +i /home/pryro.com/.ssh/authorized_keys
chattr +i /home/vmail/.ssh/authorized_keys
chattr +i /home/vmi3109658.contaboserver.net/.ssh/authorized_keys
echo "✅ All SSH keys protected (immutable)"

# 5. RESTART SSH SERVICE
echo ""
echo "=== STEP 5: Restart SSH Service ==="
echo "⚠️ WARNING: This will restart SSH. Your current connection will stay active."
read -p "Press Enter to restart SSH..."
systemctl restart sshd
echo "✅ SSH service restarted"

# 6. INSTALL FAIL2BAN
echo ""
echo "=== STEP 6: Install Fail2Ban ==="
apt-get update -qq
apt-get install -y fail2ban

# Configure Fail2Ban
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
destemail = root@localhost
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
EOF

systemctl enable fail2ban
systemctl restart fail2ban
echo "✅ Fail2Ban installed and configured"

# 7. CHANGE DATABASE PASSWORDS
echo ""
echo "=== STEP 7: Change Database Passwords ==="
echo "Changing MySQL root password..."
read -p "Enter NEW MySQL root password: " -s MYSQL_ROOT_PASS
echo ""

mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '$MYSQL_ROOT_PASS';" 2>/dev/null || \
    mysqladmin -u root password "$MYSQL_ROOT_PASS"

# Change solaceministries DB password
SOLACE_NEW_PASS=$(openssl rand -base64 16 | tr -d '/+=' | cut -c1-16)
mysql -u root -p"$MYSQL_ROOT_PASS" -e "ALTER USER 'J9ZAk3oUd615v7'@'localhost' IDENTIFIED BY '$SOLACE_NEW_PASS';"
echo "✅ Solace DB password: $SOLACE_NEW_PASS"
echo "$SOLACE_NEW_PASS" > /root/solace_db_password.txt

# Update wp-config.php
chattr -i /home/solaceministries.org/public_html/wp-config.php
sed -i "s/define( 'DB_PASSWORD', '.*' );/define( 'DB_PASSWORD', '$SOLACE_NEW_PASS' );/" /home/solaceministries.org/public_html/wp-config.php
chattr +i /home/solaceministries.org/public_html/wp-config.php
echo "✅ wp-config.php updated with new password"

# 8. CREATE MONITORING SCRIPT
echo ""
echo "=== STEP 8: Create Security Monitoring Script ==="
cat > /root/security_monitor.sh << 'MONITOR_EOF'
#!/bin/bash
LOG_FILE="/var/log/security_monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

echo "[$DATE] === Security Check ===" >> $LOG_FILE

# Check for malware patterns
MALWARE_COUNT=$(find /home/*/public_html -name "*.php" -type f -exec grep -l "eval(base64_decode" {} \; 2>/dev/null | wc -l)
echo "[$DATE] Infected files found: $MALWARE_COUNT" >> $LOG_FILE

if [ $MALWARE_COUNT -gt 0 ]; then
    echo "[$DATE] ⚠️ MALWARE DETECTED!" >> $LOG_FILE
    find /home/*/public_html -name "*.php" -type f -exec grep -l "eval(base64_decode" {} \; 2>/dev/null >> $LOG_FILE
fi

# Check SSH keys
ATTACKER_KEY_COUNT=$(grep -r "IPCsi58xDKuXuq8CMnlIFQHoqiGkyziMQpAks2t0EBa0" /root/.ssh/ /home/*/.ssh/ 2>/dev/null | wc -l)
echo "[$DATE] Attacker SSH keys found: $ATTACKER_KEY_COUNT" >> $LOG_FILE

if [ $ATTACKER_KEY_COUNT -gt 0 ]; then
    echo "[$DATE] ⚠️ ATTACKER SSH KEYS DETECTED!" >> $LOG_FILE
fi

# Check for suspicious processes
SUSPICIOUS_PROCS=$(ps aux | grep -E "defunct|miner|cryptonight" | grep -v grep | wc -l)
echo "[$DATE] Suspicious processes: $SUSPICIOUS_PROCS" >> $LOG_FILE

# Check recent logins
RECENT_LOGINS=$(last -i -n 10 | grep -v "41.173.251.217" | grep -v "wtmp" | wc -l)
echo "[$DATE] Non-user logins (last 10): $RECENT_LOGINS" >> $LOG_FILE

echo "[$DATE] Check complete" >> $LOG_FILE
echo "" >> $LOG_FILE
MONITOR_EOF

chmod +x /root/security_monitor.sh

# Add to crontab (run every hour)
(crontab -l 2>/dev/null | grep -v security_monitor.sh; echo "0 * * * * /root/security_monitor.sh") | crontab -
echo "✅ Security monitoring script installed (runs hourly)"

# 9. UPDATE ALL PACKAGES
echo ""
echo "=== STEP 9: Update All Packages ==="
apt-get update
apt-get upgrade -y
echo "✅ All packages updated"

# 10. FINAL SECURITY CHECK
echo ""
echo "=========================================="
echo "=== FINAL SECURITY STATUS ==="
echo "=========================================="
echo ""
echo "✅ Root password: CHANGED"
echo "✅ CyberPanel password: CHANGED"
echo "✅ SSH restricted to: 41.173.251.217"
echo "✅ Password auth: DISABLED"
echo "✅ SSH keys: PROTECTED (immutable)"
echo "✅ Fail2Ban: ACTIVE"
echo "✅ Database passwords: CHANGED"
echo "✅ Monitoring: ACTIVE (hourly)"
echo "✅ System packages: UPDATED"
echo ""
echo "📝 SAVE THESE CREDENTIALS:"
echo "   - New Solace DB password saved to: /root/solace_db_password.txt"
echo ""
echo "🔍 NEXT STEPS:"
echo "   1. Change WordPress admin password at: https://www.solaceministries.org/wp-admin"
echo "   2. Monitor logs daily: tail -f /var/log/security_monitor.log"
echo "   3. Check Fail2Ban status: fail2ban-client status sshd"
echo "   4. Review login attempts: tail -100 /var/log/auth.log"
echo ""
echo "⚠️ IMPORTANT:"
echo "   - Save your NEW root password somewhere safe!"
echo "   - Save your NEW CyberPanel password!"
echo "   - Save the NEW database password from /root/solace_db_password.txt"
echo ""
echo "=========================================="
echo "SECURITY HARDENING COMPLETE!"
echo "=========================================="

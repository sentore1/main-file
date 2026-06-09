#!/bin/bash
# IMMEDIATE SECURITY ACTIONS - RUN THIS NOW!

echo "=========================================="
echo "IMMEDIATE SECURITY LOCKDOWN"
echo "=========================================="

# 1. CHANGE ROOT PASSWORD NOW
echo ""
echo "=== CHANGING ROOT PASSWORD ==="
echo "Enter a STRONG password (mix of letters, numbers, symbols):"
passwd

# 2. RESTRICT SSH TO YOUR IP ONLY
echo ""
echo "=== RESTRICTING SSH TO YOUR IP ==="
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
echo "" >> /etc/ssh/sshd_config
echo "# Restrict SSH to legitimate user IP only" >> /etc/ssh/sshd_config
echo "AllowUsers root@41.173.251.217 cyberpanel@41.173.251.217" >> /etc/ssh/sshd_config
echo "PasswordAuthentication no" >> /etc/ssh/sshd_config
echo "PermitRootLogin prohibit-password" >> /etc/ssh/sshd_config
echo "✅ SSH config updated"

# 3. PROTECT SSH KEYS AGAIN
echo ""
echo "=== PROTECTING SSH KEYS ==="
chattr +i /root/.ssh/authorized_keys
chattr +i /home/*/.ssh/authorized_keys 2>/dev/null
echo "✅ SSH keys are now immutable"

# 4. RESTART SSH (your connection will stay active)
echo ""
echo "=== RESTARTING SSH SERVICE ==="
systemctl restart sshd
echo "✅ SSH restarted - only your IP can connect now"

# 5. INSTALL FAIL2BAN
echo ""
echo "=== INSTALLING FAIL2BAN ==="
apt-get update -qq && apt-get install -y fail2ban

cat > /etc/fail2ban/jail.local << 'EOF'
[sshd]
enabled = true
maxretry = 3
bantime = 86400
EOF

systemctl enable fail2ban
systemctl start fail2ban
echo "✅ Fail2Ban active - will ban IPs after 3 failed attempts"

# 6. SHOW STATUS
echo ""
echo "=========================================="
echo "✅ IMMEDIATE SECURITY COMPLETE!"
echo "=========================================="
echo ""
echo "Current Status:"
echo "  - Root password: CHANGED"
echo "  - SSH access: Only from 41.173.251.217"
echo "  - SSH keys: PROTECTED"
echo "  - Fail2Ban: ACTIVE"
echo ""
echo "Next: Change CyberPanel password:"
echo "  Run: adminPass YourNewStrongPassword123!"
echo ""
fail2ban-client status sshd

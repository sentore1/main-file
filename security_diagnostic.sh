#!/bin/bash

#############################################
# COMPREHENSIVE SECURITY DIAGNOSTIC TOOL
# Use this to diagnose why system isn't working after suspected hack
#############################################

echo "=========================================="
echo "🔍 SECURITY DIAGNOSTIC - SYSTEM HEALTH CHECK"
echo "Started: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "================================================"
echo "1. CHECKING WEB SERVER STATUS"
echo "================================================"

# Check Apache/Nginx status
if systemctl is-active --quiet apache2; then
    echo -e "${GREEN}✓${NC} Apache is running"
else
    echo -e "${RED}✗${NC} Apache is NOT running"
    echo "  Last 20 lines of Apache error log:"
    tail -20 /var/log/apache2/error.log 2>/dev/null || echo "  Cannot read Apache error log"
fi

if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✓${NC} Nginx is running"
else
    echo -e "${YELLOW}⚠${NC} Nginx is NOT running (may not be installed)"
fi

echo ""
echo "================================================"
echo "2. CHECKING DATABASE STATUS"
echo "================================================"

# Check MySQL/MariaDB status
if systemctl is-active --quiet mysql; then
    echo -e "${GREEN}✓${NC} MySQL is running"
else
    echo -e "${RED}✗${NC} MySQL is NOT running"
    echo "  Attempting to get MySQL error log:"
    tail -20 /var/log/mysql/error.log 2>/dev/null || echo "  Cannot read MySQL error log"
fi

if systemctl is-active --quiet mariadb; then
    echo -e "${GREEN}✓${NC} MariaDB is running"
else
    echo -e "${YELLOW}⚠${NC} MariaDB is NOT running (may not be installed)"
fi

echo ""
echo "================================================"
echo "3. CHECKING PHP-FPM STATUS"
echo "================================================"

# Check PHP-FPM services
for version in 7.4 8.0 8.1 8.2 8.3; do
    if systemctl is-active --quiet php${version}-fpm; then
        echo -e "${GREEN}✓${NC} PHP ${version} FPM is running"
    fi
done

# Check if any PHP-FPM is running
if ! ps aux | grep -v grep | grep -q php-fpm; then
    echo -e "${RED}✗${NC} No PHP-FPM process found"
fi

echo ""
echo "================================================"
echo "4. CHECKING DISK SPACE"
echo "================================================"

df -h | head -2
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo -e "${RED}✗${NC} CRITICAL: Disk is ${DISK_USAGE}% full!"
elif [ $DISK_USAGE -gt 80 ]; then
    echo -e "${YELLOW}⚠${NC} WARNING: Disk is ${DISK_USAGE}% full"
else
    echo -e "${GREEN}✓${NC} Disk space OK (${DISK_USAGE}% used)"
fi

echo ""
echo "================================================"
echo "5. CHECKING MEMORY USAGE"
echo "================================================"

free -h | head -2
MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
if [ $MEM_USAGE -gt 90 ]; then
    echo -e "${RED}✗${NC} CRITICAL: Memory usage is ${MEM_USAGE}%"
elif [ $MEM_USAGE -gt 80 ]; then
    echo -e "${YELLOW}⚠${NC} WARNING: Memory usage is ${MEM_USAGE}%"
else
    echo -e "${GREEN}✓${NC} Memory usage OK (${MEM_USAGE}%)"
fi

echo ""
echo "================================================"
echo "6. CHECKING FOR MALWARE IN PHP FILES"
echo "================================================"

INFECTED=$(find /home/*/public_html -name "*.php" -type f -exec grep -l "eval(base64_decode\|eval(gzinflate\|eval(str_rot13\|base64_decode.*eval\|\\$_POST\['.*'\].*eval" {} \; 2>/dev/null | wc -l)

if [ $INFECTED -gt 0 ]; then
    echo -e "${RED}✗${NC} CRITICAL: Found $INFECTED infected PHP files!"
    echo "  Listing first 10 infected files:"
    find /home/*/public_html -name "*.php" -type f -exec grep -l "eval(base64_decode\|eval(gzinflate" {} \; 2>/dev/null | head -10
else
    echo -e "${GREEN}✓${NC} No obvious malware detected in PHP files"
fi

echo ""
echo "================================================"
echo "7. CHECKING SSH SECURITY"
echo "================================================"

# Check for unauthorized SSH keys
echo "Checking authorized_keys files..."
find /root/.ssh /home/*/.ssh -name "authorized_keys" -type f 2>/dev/null | while read keyfile; do
    echo "  $keyfile:"
    KEY_COUNT=$(wc -l < "$keyfile")
    echo "    Keys found: $KEY_COUNT"
    if [ $KEY_COUNT -gt 2 ]; then
        echo -e "    ${YELLOW}⚠${NC} Multiple keys found - review them!"
    fi
done

# Check current SSH connections
ACTIVE_SSH=$(who | wc -l)
echo ""
echo "Active SSH sessions: $ACTIVE_SSH"
who | awk '{print "  " $1 " from " $5 " at " $3 " " $4}'

echo ""
echo "================================================"
echo "8. CHECKING FOR SUSPICIOUS PROCESSES"
echo "================================================"

# Check for cryptocurrency miners and common malware
SUSPICIOUS=$(ps aux | grep -E "xmrig|cryptonight|miner|masscan|zmap|pty[0-9]|defunct" | grep -v grep)
if [ -n "$SUSPICIOUS" ]; then
    echo -e "${RED}✗${NC} SUSPICIOUS PROCESSES FOUND:"
    echo "$SUSPICIOUS"
else
    echo -e "${GREEN}✓${NC} No obvious suspicious processes"
fi

# Check for high CPU usage processes
echo ""
echo "Top 5 CPU consuming processes:"
ps aux --sort=-%cpu | head -6

echo ""
echo "================================================"
echo "9. CHECKING SYSTEMD SERVICES FOR MALWARE"
echo "================================================"

MALWARE_SERVICES=$(systemctl list-units --all | grep -E "defunct|gssocket|khugepaged|systemd-login" | grep -v grep)
if [ -n "$MALWARE_SERVICES" ]; then
    echo -e "${RED}✗${NC} SUSPICIOUS SERVICES FOUND:"
    echo "$MALWARE_SERVICES"
else
    echo -e "${GREEN}✓${NC} No known malware services detected"
fi

echo ""
echo "================================================"
echo "10. CHECKING RECENT FILE MODIFICATIONS"
echo "================================================"

echo "Files modified in /var/www or /home in last 24 hours:"
find /home/*/public_html /var/www -type f -mtime -1 2>/dev/null | head -20

echo ""
echo "================================================"
echo "11. CHECKING FIREWALL STATUS"
echo "================================================"

if systemctl is-active --quiet ufw; then
    echo -e "${GREEN}✓${NC} UFW firewall is active"
    ufw status | head -10
elif systemctl is-active --quiet firewalld; then
    echo -e "${GREEN}✓${NC} FirewallD is active"
    firewall-cmd --list-all 2>/dev/null | head -10
else
    echo -e "${YELLOW}⚠${NC} No firewall detected or not active"
fi

echo ""
echo "================================================"
echo "12. CHECKING NETWORK CONNECTIONS"
echo "================================================"

echo "Active internet connections:"
netstat -tunap 2>/dev/null | grep ESTABLISHED | head -10

echo ""
echo "================================================"
echo "13. CHECKING SYSTEM LOGS FOR ERRORS"
echo "================================================"

echo "Recent critical errors in syslog:"
journalctl -p err -n 10 --no-pager 2>/dev/null || tail -10 /var/log/syslog 2>/dev/null

echo ""
echo "================================================"
echo "14. CHECKING FILE PERMISSIONS ON CRITICAL FILES"
echo "================================================"

for file in /home/*/public_html/.env /home/*/public_html/wp-config.php; do
    if [ -f "$file" ]; then
        PERMS=$(stat -c "%a" "$file")
        if [ "$PERMS" != "600" ] && [ "$PERMS" != "400" ]; then
            echo -e "${YELLOW}⚠${NC} $file has permissions $PERMS (should be 600 or 400)"
        else
            echo -e "${GREEN}✓${NC} $file has secure permissions ($PERMS)"
        fi
    fi
done

echo ""
echo "================================================"
echo "15. CHECKING LARAVEL APPLICATION STATUS"
echo "================================================"

# Find Laravel installations
for APP_PATH in /home/*/public_html; do
    if [ -f "$APP_PATH/artisan" ]; then
        echo ""
        echo "Found Laravel app in: $APP_PATH"
        
        # Check .env file exists
        if [ -f "$APP_PATH/.env" ]; then
            echo -e "  ${GREEN}✓${NC} .env file exists"
        else
            echo -e "  ${RED}✗${NC} .env file MISSING!"
        fi
        
        # Check storage permissions
        if [ -d "$APP_PATH/storage" ]; then
            STORAGE_PERMS=$(stat -c "%a" "$APP_PATH/storage")
            if [ "$STORAGE_PERMS" = "775" ] || [ "$STORAGE_PERMS" = "755" ]; then
                echo -e "  ${GREEN}✓${NC} Storage permissions OK ($STORAGE_PERMS)"
            else
                echo -e "  ${YELLOW}⚠${NC} Storage permissions: $STORAGE_PERMS (should be 775 or 755)"
            fi
        fi
        
        # Check bootstrap/cache permissions
        if [ -d "$APP_PATH/bootstrap/cache" ]; then
            CACHE_PERMS=$(stat -c "%a" "$APP_PATH/bootstrap/cache")
            if [ "$CACHE_PERMS" = "775" ] || [ "$CACHE_PERMS" = "755" ]; then
                echo -e "  ${GREEN}✓${NC} Bootstrap cache permissions OK ($CACHE_PERMS)"
            else
                echo -e "  ${YELLOW}⚠${NC} Bootstrap cache permissions: $CACHE_PERMS (should be 775 or 755)"
            fi
        fi
        
        # Check if app is in maintenance mode
        if [ -f "$APP_PATH/storage/framework/down" ]; then
            echo -e "  ${YELLOW}⚠${NC} Application is in MAINTENANCE MODE"
        fi
    fi
done

echo ""
echo "================================================"
echo "DIAGNOSTIC SUMMARY"
echo "================================================"

echo ""
echo "QUICK FIXES TO TRY:"
echo "==================="
echo ""
echo "If web server is down:"
echo "  sudo systemctl restart apache2"
echo "  sudo systemctl restart nginx"
echo ""
echo "If database is down:"
echo "  sudo systemctl restart mysql"
echo "  sudo systemctl restart mariadb"
echo ""
echo "If PHP-FPM is down:"
echo "  sudo systemctl restart php8.1-fpm  (adjust version)"
echo ""
echo "If Laravel app not working:"
echo "  cd /path/to/app"
echo "  php artisan config:clear"
echo "  php artisan cache:clear"
echo "  php artisan route:clear"
echo "  php artisan view:clear"
echo "  composer dump-autoload"
echo ""
echo "Check detailed application logs:"
echo "  tail -50 /home/*/public_html/storage/logs/laravel.log"
echo ""
echo "=========================================="
echo "Diagnostic completed: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

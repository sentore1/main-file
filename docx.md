
2. License
3. Installation Methods
4. Server Requirements
5. Database Setup
6. File Upload
7. Installation Wizard
8. Web Server Configuration
9. SSL Certificate Setup
10. Upgrade Documentation
11. Default Login Details
12. Essential Configuration
13. Payment Gateway Setup
14. Post-Installation Steps
15. Troubleshooting
16. Security Recommendations
17. Frontend Customization
1. Welcome
This documentation will guide you through the installation and configuration of the product.

While the installation process is straightforward, some instructions require basic understanding of databases and server file management.

2. License
2.1 Regular License
Use by you or one client, in a single end product which end users are **not charged for**. The total price includes the item price and buyer fee.

2.2 Extended License
Use by you or one client, in a single end product which end users **can be charged for**. The total price includes the item price and buyer fee.

Important: Please purchase an “Extended License” if you plan to sell this as a service. Envato License Policy

3. Installation Methods
3.1 Video Guides
3.2 Built-in Installer
The product comes with a “web installer”. Follow the steps below to install on your server.

4. Server Requirements
Built on “PHP 8.2.*” with the following minimum requirements:

4.1 Requirement
PHP: >= 8.2.*
MySQL: >= 8.0
Node.js: >= 18.x
Composer: >= 2.*
Memory: >= 2GB RAM
Storage: >= 10GB
Web Server: Apache/Nginx
SSL Certificate: Any Valid
4.2 Required PHP Extensions:
BCMath PHP Extension
Ctype PHP Extension
Fileinfo PHP Extension
JSON PHP Extension
Mbstring PHP Extension
OpenSSL PHP Extension
PDO PHP Extension
Tokenizer PHP Extension
XML PHP Extension
GD PHP Extension
Curl PHP Extension
Zip PHP Extension
Note: The installer will automatically check if your server meets these requirements.

5. Database Setup
Step 1: Create Database

Create a new “empty database” using your hosting control panel.

Step 2: Create Database User

1. Create a new database user

2. Assign “full permissions” to the database

3. Note down the credentials for installation

6. File Upload
Step 1: Show Hidden Files

Enable viewing of “hidden files” in your file manager (dotfiles like `.env` are hidden by default).

Step 2: Upload Files

Upload contents of the `main_file` folder to your domain’s web root directory:

`public_html` (most common)
`html`
`www`
`yourdomain.com`
7. Installation Wizard
Step 1: Start Installation

Visit: https://yourdomain.com/install

Step 2: Check Requirements

Click “Check Requirements” button to verify server compatibility.

Step 3: Check Permissions

Click “Check Permissions” to verify directory permissions.

Step 4: Set Permissions (if needed)

If permission errors occur, run:

sudo chmod 755 storage
sudo chmod 755 bootstrap/cache
sudo chown -R www-data:www-data storage bootstrap/cache
Step 5: Database Configuration

Enter your database credentials:

Database Host: `localhost` (usually)
Database Name: your_database_name
Database Username: your_database_username
Database Password: your_database_password
Step 6: Complete Installation

Follow the remaining wizard steps to complete installation.

8. Web Server Configuration
8.1 Apache (Default)
No additional configuration needed if using Apache with `.htaccess` support.

8.2 Nginx Setup
Create Nginx configuration file in `/etc/nginx/sites-available/`:


    server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /path/to/your/project;
    index index.php index.html;
                                                    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
                                                    
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.2-fmp.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
                                                                                       
     location ~ /\.ht {
        deny all;
    }
                                                
    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|woff|woff2|ttf|svg|pdf|doc|docx|csv|zip|mp4|mp3)$ {
        expires 1y;
         add_header Cache-Control "public, immutable";
        log_not_found off;
        access_log off;
    }
                                                
    # Handle public assets
    location ~* ^/public/(css|assets|market_assets|images|landing|uploads|storage|installer|js|vendor|build|screenshots|packages)/(.*)$ {
        try_files $uri $uri/ =404;
    }
                                                
    error_log /var/log/nginx/yourdomain_error.log;
    access_log /var/log/nginx/yourdomain_access.log;
}

Enable the site:

sudo ln -s /etc/nginx/sites-available/yourdomain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
9. SSL Certificate Setup
9.1 Using Let’s Encrypt (Free)
9.1.1 Install Certbot
sudo apt install certbot python3-certbot-nginx

9.1.2 Get SSL certificate
9.2 Get SSL certificate

9.1.3 Auto-renewal
sudo crontab -e

Add: 0 12 * * * /usr/bin/certbot renew –quiet

9.2 Using Cloudflare (Recommended)
1. Add your domain to Cloudflare

2. Update nameservers

3. Enable SSL/TLS encryption

4. Set SSL mode to “Full (strict)”

10. Upgrade Documentation
10.1 Before You Start
Always backup your application and database before upgrading to prevent data loss. Check the release notes for any breaking changes and ensure your server meets the latest system requirements.

Important: Test the upgrade process on a staging environment first before applying to production.

10.2 Pre-Upgrade Checklist
Create a complete backup of your database using your hosting panel or command line tools. Backup all important files including storage directory and your .env configuration file. Note down your current version number and any custom modifications you’ve made to the application.

System Requirements: Verify your server has PHP 8.2+, MySQL 8.0+, Node.js 18+, and Composer 2.0+ installed.

10.3 Backup Process
Database Backup: Use your hosting control panel (cPanel/Plesk) to create a full database backup, or use command line tools to export your database to a SQL file.
Files Backup: Download or backup your storage directory and .env file. These contain your application data and configuration that must be preserved during upgrade.
Custom Code: If you’ve made any customizations to the application code, create a backup of those modified files to reapply them after the upgrade.
10.4 Upgrade Process
Step 1: Preparation

Put your application in maintenance mode to prevent users from accessing it during the upgrade. This ensures data integrity and prevents any issues during the update process.

php artisan down

Step 2: File Replacement

Download the new version from your purchase source and extract it to a temporary location. Replace all application files except your .env file and storage directory folder to preserve your data and configuration.

Step 3: Complete Upgrade

Take your application out of maintenance mode.

php artisan up

Log in and follow the update wizard.

10.5 Version-Specific Updates
Each version may include new features, improvements, or breaking changes that require special attention during upgrade. Review the specific changes for your target version to understand what updates are included.

Check Release Notes: Visit our changelog page to see detailed information about each version including new features, bug fixes, and any special upgrade requirements.
Version Compatibility: Ensure you’re upgrading from a supported version. Some versions may require intermediate upgrades or additional steps depending on the changes introduced.
10.6 Post-Upgrade Verification
Functionality Testing: Test user login, Data creation, payment processing, and email notifications to ensure all features work correctly. Check the admin panel and verify all settings are preserved.
Performance Check: Monitor page load times and database performance. Ensure file uploads work correctly and all assets load properly.
Configuration Review: Verify your .env file settings, payment gateway configurations, and email settings. Update any new configuration options that may have been added.
10.7 Troubleshooting
Migration Issues: If database migrations fail, check your database connection and ensure you have sufficient privileges. Review the error logs for specific issues and contact support if needed.
File Permission Errors: Ensure your web server has proper read/write permissions to storage and cache directories. Set appropriate ownership and permissions as required by your hosting environment.
Frontend Issues: If the interface doesn’t load correctly, clear browser cache and rebuild frontend assets. Check for any JavaScript errors in the browser console.
Performance Problems: Clear all application caches and restart your web server. If using queue workers, restart them to ensure they’re running the latest code.
10.8 Rollback Procedure
If the upgrade fails or causes issues, immediately put the application in maintenance mode and restore from your backups. Restore the database from your SQL backup file and replace application files with your backup copies.

Database Restore: Use your hosting panel or command line tools to restore the database from your backup file.
File Restore: Replace the application files with your backup copies, ensuring the .env file and storage directory are properly restored.
10.9 Custom Code Migration
If you have custom modifications, carefully compare your backup files with the new version to identify changes. Reapply your customizations while ensuring compatibility with the new version.

Frontend Customizations: Check your custom CSS, JavaScript, and React components for compatibility. Update any deprecated code or API calls.
Backend Customizations: Review custom controllers, models, and routes for compatibility with the new version. Test all custom functionality thoroughly.
10.10 Final Steps
Security Review: Verify all security settings are intact and update any security keys if provided in the new version. Check file permissions and SSL certificate functionality.
Performance Optimization: Monitor the application for 24-48 hours after upgrade to ensure stability. Check error logs regularly and address any issues promptly.
User Communication: Inform your users about any new features or changes introduced in the upgrade. Provide documentation for any new functionality.
10.11 Upgrade Complete!
Your application has been successfully upgraded. Monitor the application closely for the first few days and contact support if you encounter any issues.

Support: Keep your backup files for at least one week after upgrade in case rollback is needed.

11. Default Login Details
After successful installation, you’ll receive default admin credentials:

URL: ‘https://yourdomain.com/login’
Email: Will be provided after installation
Password: Will be provided after installation
Security: Change the default password immediately after first login.

12. Essential Configuration
12.1 Application Settings
Set application name and logo
Configure timezone
Set default language
Configure file upload limits
12.2 Storage Configuration
Create required directories
mkdir -p storage/app/public/{uploads,media,exports}
12.3 Set proper permissions
chmod -R 775 storage
chown -R www-data:www-data storage
13. Payment Gateway Setup
Configure payment gateways in the admin panel:

13.1 Supported Gateways:
Stripe
PayPal
Razorpay
And 30+ more gateways
Documentation: Payment Gateway Setup Guide

14. Post-Installation Steps
14.1 Essential Tasks:
Change default admin password
Configure email settings (SMTP)
Set up payment gateways
Configure application settings
Test all functionality
Set up SSL certificate
Configure backups
14.2 Optional Enhancements:
Set up queue workers for background jobs
Configure Redis for caching
Enable CDN for static assets
Set up monitoring and logging
15. Troubleshooting
15.1 Common Issues:
15.1.1 Installation wizard not loading
Check file permissions
Verify web server configuration
Check PHP version and extensions
15.1.2 Database connection failed
Verify database credentials
Ensure database exists and is empty
Check database user permissions
15.1.3 500 Internal Server Error
Check server error logs
Verify file permissions
Ensure all PHP extensions are installed
15.1.4 Assets not loading
Check web server configuration
Verify public directory setup
Clear browser cache
15.1.5 Email not sending
Verify SMTP credentials
Check firewall blocking port 587
Test with different email provider
15.1.6 Getting Help
Contact our support team with:

Error messages and logs
Server configuration details
Steps to reproduce the issue
Screenshots of error pages
16. Security Recommendations
Use strong passwords for all accounts
Keep the application updated
Regular database backups
Enable SSL/HTTPS
Use secure hosting environment
Monitor access logs regularly
17. Frontend Customization
Customize the application’s UI/UX by modifying React components located in `resources/js/` directory. Edit components, pages, and layouts as needed, then rebuild assets using `npm run build` for production or `npm run dev` for development with hot reload.

Important: Always run `npm run build` after making frontend changes for production.

17.1 Installation Complete!
Your Web application is now ready to use. Access the admin panel to configure settings and start creating digital business cards.

Support: For technical assistance, please contact our support team with detailed error information.
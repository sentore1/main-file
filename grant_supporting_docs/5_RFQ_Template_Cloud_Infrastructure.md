# REQUEST FOR QUOTATION (RFQ)

---

**FROM:**  
Pryro Ltd.  
Kigali, Rwanda  
Contact: Umubyeyi Alice, Chief Technology Officer  
Email: tech@pryro.com  
Phone: +250 XXX XXX XXX  
Date: April 27, 2026

**TO:** [Cloud Service Provider]

**SUBJECT:** Request for Quotation - Multi-Region Cloud Infrastructure Services

---

## 1. INTRODUCTION

Pryro Ltd. is Rwanda's leading ERP software company serving 98+ customers with plans to scale to 2,000+ customers across Rwanda, United States, and Arab markets. We require enterprise-grade cloud infrastructure to support our growth.

We invite your company to submit a quotation for cloud hosting and infrastructure services as described below.

---

## 2. PROJECT OVERVIEW

**Project Name:** Pryro ERP Platform - Multi-Region Cloud Deployment  
**Project Duration:** 12 months (with option to extend)  
**Start Date:** June 2026  
**Regions Required:** Africa (existing), North America, Middle East

---

## 3. CURRENT INFRASTRUCTURE

**Current Setup:**
- Single region deployment (Africa/Europe)
- 98 active customers
- ~500 concurrent users
- Database size: 200 GB
- Monthly traffic: ~5 TB
- Uptime requirement: 99.5%

**Growth Projections:**
- Target: 2,000 customers by Month 18
- Projected users: 10,000+ concurrent
- Database size: 2-3 TB
- Monthly traffic: 50-75 TB
- Uptime requirement: 99.9%

---

## 4. TECHNICAL REQUIREMENTS

### 4.1 Compute Resources

| Component | Current | Required (Year 1) | Scalability |
|-----------|---------|-------------------|-------------|
| Application Servers | 2 instances | 6-8 instances | Auto-scaling |
| Database Servers | 1 instance | 3 instances (multi-region) | High availability |
| Cache Servers | 1 instance | 3 instances | Redis/Memcached |
| Load Balancers | 1 | 3 (per region) | Managed service |
| Background Workers | 2 instances | 6 instances | Queue-based |

**Specifications per Application Server:**
- CPU: 4-8 vCPUs
- RAM: 16-32 GB
- Storage: 100 GB SSD
- OS: Ubuntu 22.04 LTS or similar

**Database Specifications:**
- CPU: 8-16 vCPUs
- RAM: 32-64 GB
- Storage: 500 GB SSD (with auto-scaling to 3 TB)
- Database: PostgreSQL 14+ or MySQL 8+
- Backup: Daily automated backups with 30-day retention

### 4.2 Geographic Distribution

**Required Regions:**

1. **Africa Region** (Primary - existing)
   - Location: South Africa or Kenya preferred
   - Purpose: Rwanda and East African customers
   - Latency target: <50ms for Rwanda

2. **North America Region** (New)
   - Location: US East (Virginia) or US West (California)
   - Purpose: US market customers
   - Latency target: <30ms for US customers

3. **Middle East Region** (New)
   - Location: UAE (Dubai) or Bahrain
   - Purpose: Arab market customers
   - Latency target: <40ms for GCC countries

### 4.3 Storage Requirements

| Storage Type | Current | Required | Purpose |
|--------------|---------|----------|---------|
| Database Storage | 200 GB | 3 TB | Customer data, transactions |
| File Storage (S3/Blob) | 500 GB | 5 TB | Documents, images, backups |
| Backup Storage | 300 GB | 4 TB | Database backups, snapshots |
| CDN Storage | 50 GB | 500 GB | Static assets, media files |

### 4.4 Network & Security

**Required Features:**
- DDoS protection
- Web Application Firewall (WAF)
- SSL/TLS certificates (managed)
- VPN for secure admin access
- Private networking between services
- Network ACLs and security groups
- Intrusion detection/prevention

**Bandwidth:**
- Current: 5 TB/month
- Projected: 50-75 TB/month
- Burst capacity: 100 TB/month

### 4.5 Database Services

**Requirements:**
- Managed database service (RDS, Cloud SQL, or equivalent)
- Multi-AZ deployment for high availability
- Automated backups (daily, 30-day retention)
- Point-in-time recovery
- Read replicas for performance
- Encryption at rest and in transit
- Automated patching and maintenance

### 4.6 Additional Services

**Required:**
- Content Delivery Network (CDN) - Global distribution
- Email service (SMTP) - 100,000 emails/month
- DNS management - Managed DNS with health checks
- Monitoring & Logging - CloudWatch/equivalent
- Container orchestration - Kubernetes or ECS (optional)
- Serverless functions - Lambda/equivalent for background tasks

---

## 5. PERFORMANCE & AVAILABILITY

### 5.1 Service Level Agreement (SLA)

- **Uptime:** 99.9% monthly uptime guarantee
- **Latency:** <100ms response time for 95th percentile
- **Recovery Time Objective (RTO):** <1 hour
- **Recovery Point Objective (RPO):** <15 minutes
- **Support Response Time:** <30 minutes for critical issues

### 5.2 Disaster Recovery

- Automated daily backups
- Cross-region backup replication
- Disaster recovery plan and testing
- Failover capabilities
- Data retention: 30 days minimum

---

## 6. SECURITY & COMPLIANCE

**Required Certifications:**
- ISO 27001
- SOC 2 Type II
- GDPR compliance
- PCI DSS (for payment data)

**Security Features:**
- Data encryption at rest (AES-256)
- Data encryption in transit (TLS 1.3)
- Identity and Access Management (IAM)
- Multi-factor authentication (MFA)
- Audit logging and compliance reporting
- Regular security patches and updates

---

## 7. MIGRATION SUPPORT

**Required Migration Services:**
- Migration planning and assessment
- Data migration from current infrastructure
- Zero-downtime migration strategy
- Post-migration validation and testing
- Rollback plan

**Current Infrastructure:**
- Platform: [Specify current provider]
- Database: PostgreSQL 14
- Application: Laravel PHP + React
- Estimated migration time: 2-4 weeks

---

## 8. SUPPORT & MANAGEMENT

**Required Support Level:**
- 24/7 technical support
- Dedicated account manager
- Monthly infrastructure review
- Quarterly capacity planning
- Architecture consultation
- Performance optimization recommendations

**Preferred Support Channels:**
- Phone support (24/7)
- Email support
- Live chat
- Ticketing system
- Emergency hotline

---

## 9. PRICING REQUIREMENTS

Please provide detailed pricing for:

### 9.1 Monthly Recurring Costs

| Component | Unit | Quantity | Unit Price | Total |
|-----------|------|----------|------------|-------|
| Compute instances | vCPU-hours | | | |
| Memory | GB-hours | | | |
| Storage (SSD) | GB/month | | | |
| Database service | Instance-hours | | | |
| Data transfer (outbound) | GB | | | |
| Load balancing | Hours | | | |
| Backup storage | GB/month | | | |
| CDN | GB transferred | | | |
| Additional services | | | | |

### 9.2 One-Time Costs

- Setup and configuration fees
- Migration services
- Architecture consultation
- Training sessions

### 9.3 Pricing Tiers

Please provide pricing for:
1. **Current scale** (98 customers, 500 users)
2. **6-month projection** (500 customers, 2,500 users)
3. **12-month projection** (1,000 customers, 5,000 users)
4. **18-month projection** (2,000 customers, 10,000 users)

### 9.4 Cost Optimization

- Reserved instance discounts (1-year, 3-year)
- Committed use discounts
- Volume discounts
- Startup/scale-up programs (if applicable)

---

## 10. IMPLEMENTATION TIMELINE

| Phase | Duration | Activities |
|-------|----------|------------|
| Planning & Design | 2 weeks | Architecture review, capacity planning |
| Infrastructure Setup | 2 weeks | Provision resources, configure services |
| Migration | 2-3 weeks | Data migration, application deployment |
| Testing & Validation | 1 week | Performance testing, security audit |
| Go-Live | 1 week | Cutover, monitoring, optimization |

**Total Timeline:** 8-10 weeks

---

## 11. EVALUATION CRITERIA

Quotations will be evaluated based on:

1. **Total Cost of Ownership** (35%) - Competitive pricing and value
2. **Performance & Reliability** (25%) - SLA guarantees, uptime history
3. **Geographic Coverage** (15%) - Availability in required regions
4. **Security & Compliance** (15%) - Certifications and security features
5. **Support Quality** (10%) - Support responsiveness and expertise

---

## 12. SUBMISSION REQUIREMENTS

Please submit:

1. **Detailed Pricing Quotation** - Itemized costs for all components
2. **Architecture Proposal** - Recommended infrastructure design
3. **Company Profile** - Overview of cloud services and capabilities
4. **Case Studies** - Similar deployments (SaaS/ERP platforms)
5. **SLA Documentation** - Service level agreements and guarantees
6. **Security & Compliance** - Certifications and compliance documentation
7. **Migration Plan** - Proposed migration approach and timeline
8. **Support Plan** - Support levels and response times
9. **References** - At least 2 client references
10. **Terms & Conditions** - Standard service terms

---

## 13. SUBMISSION DEADLINE

**Quotations must be submitted by: May 20, 2026, 5:00 PM EAT**

**Submit to:**  
Email: tech@pryro.com  
Subject Line: "RFQ Response - Cloud Infrastructure - [Your Company Name]"

---

## 14. ADDITIONAL INFORMATION

### 14.1 Preferred Providers

We are open to quotations from:
- Amazon Web Services (AWS)
- Microsoft Azure
- Google Cloud Platform (GCP)
- Other enterprise cloud providers with African presence

### 14.2 Questions & Clarifications

For technical questions, please contact:

**Umubyeyi Alice**  
Chief Technology Officer  
Email: tech@pryro.com  
Phone: +250 XXX XXX XXX

**Questions Deadline:** May 13, 2026

### 14.3 Site Visit

Virtual infrastructure review meeting available upon request.

---

## 15. TERMS & CONDITIONS

1. Pryro Ltd. reserves the right to accept or reject any or all quotations
2. This RFQ does not constitute a commitment to purchase
3. Selected vendor will be required to sign a Master Service Agreement
4. Pricing must be valid for 90 days from submission
5. Payment terms: Net 30 days from invoice date

---

We look forward to receiving your comprehensive quotation.

Best regards,

**Umubyeyi Alice**  
Chief Technology Officer  
Pryro Ltd.

---

**APPENDIX: Current Infrastructure Diagram**

*[Attach current architecture diagram if available]*

# QUOTATION

---

**Amazon Web Services, Inc.**  
410 Terry Avenue North  
Seattle, WA 98109, USA  
Tel: +1 (877) 850-2210  
Email: aws-sales@amazon.com  
Website: aws.amazon.com

---

**QUOTATION NO:** AWS-EMEA-2026-RW-0847  
**DATE:** April 22, 2026  
**VALID UNTIL:** June 22, 2026

**TO:**  
Pryro Ltd.  
Kigali, Rwanda  
Attention: Umubyeyi Alice, Chief Technology Officer  
Email: tech@pryro.com

---

## QUOTATION FOR: Multi-Region Cloud Infrastructure - 12 Month Estimate

Dear Pryro Technology Team,

Thank you for your interest in Amazon Web Services. We are pleased to provide you with the following quotation for your multi-region cloud infrastructure requirements to support your growth from 98 to 2,000+ customers.

---

## EXECUTIVE SUMMARY

**Deployment Regions:**
- Africa (Cape Town) - Primary
- US East (N. Virginia) - Secondary
- Middle East (Bahrain) - Secondary

**Estimated Monthly Cost (Month 1-3):** $580/month  
**Estimated Monthly Cost (Month 4-6):** $1,200/month  
**Estimated Monthly Cost (Month 7-12):** $1,800/month  
**Total 12-Month Estimate:** $14,760

---

## DETAILED PRICING BREAKDOWN

### PHASE 1: MONTHS 1-3 (Current Scale - 98 Customers)

#### Compute Services (EC2)

| Instance Type | Quantity | Region | vCPU | RAM | Monthly Cost |
|---------------|----------|--------|------|-----|--------------|
| t3.xlarge (App Server) | 2 | Cape Town | 4 | 16 GB | $120 |
| t3.xlarge (App Server) | 1 | US East | 4 | 16 GB | $60 |
| t3.xlarge (App Server) | 1 | Bahrain | 4 | 16 GB | $65 |
| t3.medium (Worker) | 2 | Cape Town | 2 | 4 GB | $40 |
| **Compute Subtotal** | | | | | **$285** |

#### Database Services (RDS)

| Service | Instance Type | Storage | Region | Monthly Cost |
|---------|---------------|---------|--------|--------------|
| RDS PostgreSQL | db.t3.large | 500 GB | Cape Town | $180 |
| RDS Read Replica | db.t3.medium | - | US East | $90 |
| **Database Subtotal** | | | | **$270** |

#### Storage Services

| Service | Capacity | Region | Monthly Cost |
|---------|----------|--------|--------------|
| S3 Standard Storage | 500 GB | Multi-region | $12 |
| S3 Glacier (Backups) | 300 GB | Cape Town | $3 |
| EBS Volumes (SSD) | 800 GB | All regions | $80 |
| **Storage Subtotal** | | | **$95** |

#### Network Services

| Service | Usage | Monthly Cost |
|---------|-------|--------------|
| Data Transfer Out | 5 TB | $450 |
| Elastic Load Balancer | 3 instances | $75 |
| Route 53 (DNS) | 3 hosted zones | $2 |
| CloudFront (CDN) | 50 GB | $8 |
| **Network Subtotal** | | **$535** |

**Note:** Data transfer pricing: $0.09/GB for first 10 TB

#### Security & Management

| Service | Monthly Cost |
|---------|--------------|
| AWS WAF | $15 |
| AWS Shield Standard | Included |
| CloudWatch Monitoring | $10 |
| AWS Backup | $5 |
| **Security Subtotal** | **$30** |

**PHASE 1 TOTAL (Months 1-3): $580/month**

---

### PHASE 2: MONTHS 4-6 (500 Customers)

#### Scaling Adjustments

| Component | Change | New Monthly Cost |
|-----------|--------|------------------|
| Compute (EC2) | +4 instances | $570 |
| Database (RDS) | Upgrade to db.r5.xlarge | $450 |
| Storage | +2 TB | $140 |
| Data Transfer | 15 TB/month | $1,350 |
| Network & Other | Increased capacity | $120 |
| Security & Management | Enhanced monitoring | $45 |

**PHASE 2 TOTAL (Months 4-6): $1,200/month**

---

### PHASE 3: MONTHS 7-12 (1,000-2,000 Customers)

#### Full Scale Deployment

| Component | Configuration | Monthly Cost |
|-----------|---------------|--------------|
| Compute (EC2) | 12 instances across regions | $960 |
| Database (RDS) | Multi-AZ, read replicas | $720 |
| Storage | 5 TB total | $280 |
| Data Transfer | 50 TB/month | $4,500 |
| Network Services | Full CDN, load balancing | $180 |
| Security & Management | Enterprise monitoring | $60 |

**PHASE 3 TOTAL (Months 7-12): $1,800/month**

---

## 12-MONTH COST SUMMARY

| Period | Monthly Cost | Duration | Total |
|--------|--------------|----------|-------|
| Months 1-3 | $580 | 3 months | $1,740 |
| Months 4-6 | $1,200 | 3 months | $3,600 |
| Months 7-12 | $1,800 | 6 months | $10,800 |
| **TOTAL 12 MONTHS** | | | **$16,140** |

**Average Monthly Cost:** $1,345

---

## COST OPTIMIZATION OPPORTUNITIES

### Reserved Instances (1-Year Commitment)

| Savings Option | Discount | Estimated Savings |
|----------------|----------|-------------------|
| Compute Reserved Instances | 30-40% | $2,500/year |
| Database Reserved Instances | 35-45% | $1,800/year |
| **Total Potential Savings** | | **$4,300/year** |

**Optimized 12-Month Total with Reservations: $11,840**

### AWS Activate for Startups

Pryro may qualify for AWS Activate program benefits:
- Up to $5,000 in AWS credits
- Technical support credits
- Training and resources
- Architecture review

**Application:** aws.amazon.com/activate

---

## INCLUDED SERVICES & FEATURES

✓ **High Availability:** Multi-AZ deployments for critical services  
✓ **Auto Scaling:** Automatic capacity adjustment based on demand  
✓ **Backup & Recovery:** Automated daily backups with 30-day retention  
✓ **Security:** DDoS protection, WAF, encryption at rest and in transit  
✓ **Monitoring:** CloudWatch metrics, alarms, and dashboards  
✓ **Support:** AWS Basic Support included (24/7 access to documentation)  
✓ **Compliance:** ISO 27001, SOC 2, PCI DSS certified infrastructure  
✓ **Global Network:** Low-latency connections via AWS backbone  

---

## OPTIONAL ADD-ONS

| Service | Description | Monthly Cost |
|---------|-------------|--------------|
| AWS Business Support | 24/7 phone/chat support, <1hr response | $100 minimum |
| AWS Enterprise Support | Dedicated TAM, <15min response | $15,000 minimum |
| AWS Professional Services | Architecture consultation | $200/hour |
| AWS Training | Technical training for team | $600/person |
| Additional Regions | Asia Pacific, Europe | Variable |

---

## MIGRATION SUPPORT

**AWS Migration Services (Included):**
- AWS Application Migration Service (Free)
- AWS Database Migration Service (Free service, pay for resources)
- AWS DataSync for data transfer
- Migration planning documentation
- Best practices guidance

**Estimated Migration Timeline:** 2-4 weeks  
**Estimated Migration Cost:** $500-$1,000 (data transfer and temporary resources)

---

## SERVICE LEVEL AGREEMENT (SLA)

| Service | SLA | Credit if Breached |
|---------|-----|-------------------|
| EC2 | 99.99% uptime | 10-100% credit |
| RDS | 99.95% uptime | 10-100% credit |
| S3 | 99.9% uptime | 10-100% credit |
| CloudFront | 99.9% uptime | 10-100% credit |

---

## PAYMENT TERMS

- **Billing Cycle:** Monthly, in arrears
- **Payment Methods:** Credit card, wire transfer, ACH
- **Currency:** USD
- **Invoicing:** Electronic invoices via AWS Billing Console
- **Payment Terms:** Due upon receipt
- **Auto-pay:** Available for credit card payments

---

## IMPLEMENTATION TIMELINE

| Week | Activities |
|------|------------|
| Week 1 | Account setup, IAM configuration, network design |
| Week 2 | Infrastructure provisioning, security setup |
| Week 3 | Application deployment, database migration |
| Week 4 | Testing, optimization, go-live |

**Total Implementation:** 4 weeks

---

## TECHNICAL SUPPORT

**Included Support (AWS Basic):**
- 24/7 access to documentation and whitepapers
- AWS Trusted Advisor (limited checks)
- AWS Personal Health Dashboard
- Community forums

**Recommended Upgrade (AWS Business Support - $100/month):**
- 24/7 phone, email, and chat support
- <1 hour response time for urgent issues
- Full Trusted Advisor checks
- Infrastructure event management
- Third-party software support

---

## NEXT STEPS

To proceed with this quotation:

1. **Create AWS Account:** aws.amazon.com/free
2. **Apply for AWS Activate:** aws.amazon.com/activate (if eligible)
3. **Schedule Architecture Review:** Contact your AWS account manager
4. **Review Well-Architected Framework:** Best practices documentation
5. **Begin Migration Planning:** Use AWS Migration Hub

---

## TERMS & CONDITIONS

1. Pricing based on AWS standard rates as of April 2026
2. Actual costs may vary based on usage patterns
3. Prices subject to change with 30-day notice
4. No minimum commitment required (pay-as-you-go)
5. Reserved Instance pricing requires 1-year or 3-year commitment
6. Data transfer costs vary by region and volume
7. Free tier benefits available for first 12 months (new accounts)

---

## CONTACT INFORMATION

**Account Manager:** Sarah Omondi  
Email: sarah.omondi@amazon.com  
Phone: +254 20 XXX XXXX (Kenya office)  
Direct: +1 (206) 555-0187  

**Technical Support:** aws-support@amazon.com  
**Sales Inquiries:** aws-sales@amazon.com  
**Emergency Support:** +1 (877) 850-2210

---

## ADDITIONAL RESOURCES

- AWS Pricing Calculator: calculator.aws
- AWS Architecture Center: aws.amazon.com/architecture
- AWS Training: aws.amazon.com/training
- AWS Documentation: docs.aws.amazon.com
- AWS Case Studies: aws.amazon.com/solutions/case-studies

---

We look forward to supporting Pryro's growth with AWS cloud infrastructure!

Best regards,

**Sarah Omondi**  
Account Manager - East Africa  
Amazon Web Services, Inc.

---

**IMPORTANT NOTES:**

1. This quotation is an estimate based on projected usage
2. AWS operates on a pay-as-you-go model - you only pay for what you use
3. Costs can be optimized through Reserved Instances, Savings Plans, and right-sizing
4. AWS Free Tier provides 12 months of free usage for eligible services (new accounts)
5. Consider applying for AWS Activate program for startup credits

---

*This is a sample quotation for grant application purposes. Actual AWS pricing may vary. Use AWS Pricing Calculator for precise estimates: calculator.aws*

# CYBERSECURITY INCIDENT RESPONSE STANDARD OPERATING PROCEDURE (SOP)

## PRIME APPAREL EXPORTS — CORPORATE SECURITY DIVISION

### Document ID: PA-SOP-SEC-001
### Version: 1.0 (Effective 1 June 2026)
### Classification: STRICTLY INTERNAL

---

## 1. PURPOSE & SCOPE
This Standard Operating Procedure (SOP) outlines the mandatory operational workflows for identifying, logging, reporting, containing, and recovering from cybersecurity incidents and data breach events affecting the systems, databases, cloud instances, and digital workspaces of Prime Apparel Exports. 

This SOP applies to:
* All ERP platforms, buyer portals, database tables, and codebases.
* All employee credentials, admin systems, and WhatsApp Sandbox pipelines.
* All partner API integrations (Neon, Cloudinary, Shiprocket).
* Compliance with Indian regulatory standards, specifically the **Digital Personal Data Protection (DPDP) Act, 2023** and **CERT-In cyber incident reporting rules**.

---

## 2. INCIDENT LEVEL CLASSIFICATION

Incidents must be triaged immediately upon discovery using the following severity framework:

| Severity Level | Description & Trigger Indicators | Maximum Action Triage Window | CERT-In Reporting |
| :--- | :--- | :--- | :--- |
| **Level 1 (CRITICAL)** | Unauthorized access to production databases; massive personal data leak; ransomware encryption; payment gateway API compromise; admin session hijack. | **1 Hour** | Mandatory within 6 hours of discovery. |
| **Level 2 (HIGH)** | Multiple staff credentials compromised; single service outage (e.g. WhatsApp Bot offline); abnormal transaction patterns (suspected billing fraud). | **4 Hours** | Discretionary based on data risk. |
| **Level 3 (MEDIUM)** | Unsuccessful brute-force attacks; minor database sync errors; unauthorized scraping attempts; low-priority phishing emails received by staff. | **24 Hours** | Not required unless escalation occurs. |

---

## 3. INCIDENT RESPONSE WORKFLOW

### Phase 3.1: Identification & Logging
1. Any staff member discovering anomalous system behavior, data leakage, or credential hijacking must log an incident via the **Cybersecurity Incident Log Panel** at `/admin/security/incidents`.
2. Securely record:
   * Time of anomaly discovery.
   * Compromised component (Database, API, User Sessions).
   * Apparent scope (number of affected Buyers or orders).
   * IP and user-agent characteristics of suspected malicious traffic.

### Phase 3.2: Containment & Isolation
*   **For Credential Compromise:**
    1. Immediately invalidate all active sessions for the compromised user in the `UserSession` table (set `is_active = false` and `expires_at = now()`).
    2. Force database password reset for the staff ID in `Staff` and `User` tables.
*   **For Database or Code Injection:**
    1. Suspend the specific API routes locally via environment switches or IP rate limits.
    2. Rotate active tokens for the PostgreSQL database connection strings (`DATABASE_URL`).
*   **For AI Chatbot Misbehavior or Spamming:**
    1. Activate the human-override flag in `WhatsAppLog` to suspend AI bot responses.
    2. Halt webhook processing routes.

### Phase 3.3: Eradication & Remediation
1. Audit server-side logs and Neon DB query logs to trace the entry vector.
2. Deploy code patches, fix authorization gaps, and clean anomalous payloads.
3. Validate database integrity against local backups before resuming standard transactions.

### Phase 3.4: Recovery & Restoration
1. Restore verified clean database snapshots if transaction records were altered or lost.
2. Verify all API auth validation checks return proper HTTP `401 Unauthorized` for expired sessions.
3. Re-enable network routes in increments, monitoring server CPU, network egress, and audit trails closely.

---

## 4. REGULATORY NOTIFICATION & COMPLIANCE

### 4.1 Digital Personal Data Protection (DPDP) Act Compliance
Under the DPDP Act 2023, the Company functions as a **Data Fiduciary**. In the event of a personal data breach:
1. **Notification to Data Protection Board (DPB):** The Data Protection Officer (DPO) must notify the Board immediately using the prescribed form, specifying breach details, mitigation measures, and contact references.
2. **Notification to Affected Data Principals (Buyers):** Inform affected buyers via their registered WhatsApp numbers and email addresses of the breach, the potential impact, and corrective steps they should take.

### 4.2 CERT-In Compliance
Under the Ministry of Electronics and Information Technology (MeitY) guidelines, critical cybersecurity incidents must be reported to CERT-In (Indian Computer Emergency Response Team) within **6 hours** of detection.
*   Email report to: `incident@cert-in.org.in`
*   Hotline support: `1800-11-4949`

---

## 5. BACKUP & BUSINESS CONTINUITY POLICY

1. **Snapshots Frequency:** Hourly automated Neon PostgreSQL server snapshots must be active with a retention policy of 30 days.
2. **Offline Backups:** Secure JSON database snapshots must be exported weekly using the `scripts/export-sqlite.js` standard script and stored in an encrypted offline storage pool.
3. **Disaster Recovery Drills:** The technical lead must run a recovery drill every 6 months, simulating complete database destruction and restoring data state in under 60 minutes.

# Security Specification & "Dirty Dozen" Threat Vectors

This document outlines the security architecture and validation tests for the **Task Management Application** built on Cloud Firestore.

## 1. Data Invariants

- **Signed In Mandate**: Only authenticated users with a verified email can read or write data.
- **Creator Ownership**: A user cannot create a task in which the `ownerId` does not match their own Authenticated UID.
- **Immutability of ownerId & createdAt**: Once a task is created, its `ownerId` and `createdAt` cannot be altered by anyone.
- **Action-based Field Constraints**: Users without permissions cannot perform arbitrary updates. Any update to a task must strictly modify whitelisted fields.
- **Strict Size and Shape Validation**: No string, array, or object can exceed safe sizes, preventing Resource Poisoning / "Denial of Wallet" attacks.
- **Isolated PII Access**: Private user information (like emails) is stored in a subcollection under a single-owner path and is absolutely unreadable by other users.
- **Valid Values**: String enums for `status` (todo, in_progress, review, done) and `priority` (low, medium, high) must be strictly enforced.

---

## 2. The "Dirty Dozen" Threat Payloads

Here are 12 precise attack payloads designed to break identity, integrity, and state transition laws. Each MUST fail with `PERMISSION_DENIED` during security integration testing.

### Threat Group A: Identity & Ownership Spoofing
1. **Payload #1: Ghost Creation**
   - *Attack*: User `attacker-uid` tries to create a task with `ownerId: "victim-uid"`.
   - *Target*: `create` on `/tasks/some-task-id`
   - *Code*:
     ```json
     {
       "title": "Malicious Task",
       "description": "Stealing ownership of task creation",
       "status": "todo",
       "priority": "medium",
       "dueDate": "2026-12-31T23:59:59.000Z",
       "category": "work",
       "ownerId": "victim-uid",
       "ownerName": "Victim User",
       "assigneeId": "",
       "assigneeName": "",
       "createdAt": "SERVER_TIMESTAMP",
       "updatedAt": "SERVER_TIMESTAMP"
     }
     ```

2. **Payload #2: Hijack Ownership on Update**
   - *Attack*: Changing the `ownerId` of an existing task to an attacker's UID to claim it as theirs.
   - *Target*: `update` on `/tasks/task-123`
   - *Code*:
     ```json
     {
       "ownerId": "attacker-uid"
     }
     ```

### Threat Group B: Field Injection & Shadow Fields
3. **Payload #3: Shadow Field Injection (Ghost Field)**
   - *Attack*: Inserting an unapproved configuration field (e.g., `isAdmin: true` or `isSystemVerified: true`) to bypass UI settings.
   - *Target*: `create` on `/tasks/task-123`
   - *Code*:
     ```json
     {
       "title": "Bribed Task",
       "description": "Task contains shadow fields",
       "status": "todo",
       "priority": "medium",
       "dueDate": "2026-12-31T23:59:59.000Z",
       "category": "work",
       "ownerId": "attacker-uid",
       "ownerName": "Attacker",
       "assigneeId": "",
       "assigneeName": "",
       "createdAt": "SERVER_TIMESTAMP",
       "updatedAt": "SERVER_TIMESTAMP",
       "shadowFieldApprovedForVip": true
     }
     ```

4. **Payload #4: Bulk Status Shift without Schema Validation**
   - *Attack*: Bypassing validation on status by passing an invalid value (e.g., `status: "super-done"`).
   - *Target*: `update` on `/tasks/task-123`
   - *Code*:
     ```json
     {
       "status": "super-done",
       "updatedAt": "SERVER_TIMESTAMP"
     }
     ```

### Threat Group C: Timestamp & Temporal Spoofing
5. **Payload #5: Retroactive Creation (Forced Backdate)**
   - *Attack*: Attacker provides a manual `createdAt` value (e.g., years in the past) instead of the server's transactional clock (`request.time`).
   - *Target*: `create` on `/tasks/task-123`
   - *Code*:
     ```json
     {
       "title": "Backdated Task",
       "createdAt": "2020-01-01T00:00:00.000Z"
     }
     ```

6. **Payload #6: Frozen Term Update clock**
   - *Attack*: Sending an update payload without setting `updatedAt` to `request.time` or bypassing timestamp sync.
   - *Target*: `update` on `/tasks/task-123`
   - *Code*:
     ```json
     {
       "status": "in_progress",
       "updatedAt": "2020-01-01T00:00:00.000Z"
     }
     ```

### Threat Group D: Resource Poisoning & Denial of Wallet
7. **Payload #7: Multi-Megabyte Task Title**
   - *Attack*: Injecting an extremely large, 1MB string to exploit Firestore transaction costs.
   - *Target*: `create` on `/tasks/task-123`
   - *Code*:
     ```json
     {
       "title": "A".repeat(1000000),
       "description": "Resource Poisoning attack"
     }
     ```

8. **Payload #8: ID Poisoning (Malicious Path Character)**
   - *Attack*: Attempting to create a document with a malicious index string containing SQL-injection-like characters or path escape attempts.
   - *Target*: `create` on `/tasks/invalid#path?query` or an injection string.

### Threat Group E: PII Access & Isolation Breach
9. **Payload #9: Blanket Scraping of Other Users' Private Files**
   - *Attack*: Attacker requests list queries or GET reads against `/users/victim-uid/private/info` to scrape their registered email and PII.
   - *Target*: `get` or `list` on `/users/victim-uid/private` or `/users/victim-uid/private/info`

10. **Payload #10: Hijack Public Profile Owner**
    - *Attack*: Creating or updating another user's public profile `/users/victim-uid/public/profile` to impersonate or deface them.
    - *Target*: `write` on `/users/victim-uid/public/profile`
    - *Code*:
      ```json
      {
        "userId": "victim-uid",
        "displayName": "Hacked Profile",
        "photoURL": "https://attacker.link/phish.png",
        "updatedAt": "SERVER_TIMESTAMP"
      }
      ```

### Threat Group F: State Shortcut and Privilege Escalation
11. **Payload #11: Self-Elevation to System Admin**
    - *Attack*: Directly writing or modifying admin collections `/admins/attacker-uid` from the client SDK.
    - *Target*: `create` or `write` on `/admins/attacker-uid`
    - *Code*:
      ```json
      {
        "role": "admin",
        "email": "attacker@gmail.com"
      }
      ```

12. **Payload #12: Impersonate Task Assignee without Permissions**
    - *Attack*: Changing the title or assignee details of a task created by another owner.
    - *Target*: `update` on `/tasks/task-by-victim` where `attacker-uid` is neither owner nor assignee.

---

## 3. Test Cases for Security Verification

A complete set of test assertions verifies that performing any of these CRUD actions against the Firebase Emulator or live Firebase Security Rules triggers an immediate `PERMISSION_DENIED` rejection. Complete security rules (`firestore.rules`) must encapsulate these guards.

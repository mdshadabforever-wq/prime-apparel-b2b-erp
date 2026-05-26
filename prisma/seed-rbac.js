const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("RBAC Seeding started...");

  // 1. Seed Departments
  const departments = [
    { name: "Purchase Team", code: "PURCHASE", description: "Surat sourcing and supplier coordination" },
    { name: "QC / Inventory Team", code: "INVENTORY", description: "Stock receiving, QC and warehouse control" },
    { name: "Pricing Team", code: "PRICING", description: "Landed cost, margins and wholesale pricing" },
    { name: "Content Team", code: "CONTENT", description: "Photography, catalogues and WhatsApp creatives" },
    { name: "Marketing Team", code: "MARKETING", description: "Social media and inbound campaigns" },
    { name: "Buyer Hunting Team", code: "BUYER_HUNTING", description: "Finding wholesalers, boutiques and resellers" },
    { name: "Sales / Follow-up Team", code: "SALES", description: "Order conversion, warm follow-ups and retention" },
    { name: "Logistics Team", code: "LOGISTICS", description: "Packing, shipping and courier coordination" },
    { name: "Accounts Team", code: "ACCOUNTS", description: "Invoices, GST, receivables and ledger" },
    { name: "Technical Team", code: "TECHNICAL", description: "ERP, CRM, automations and AI systems" },
    { name: "Field Boy Team", code: "FIELD_BOY", description: "Local buyer support and collection visits" },
    { name: "Founder / Admin", code: "ADMIN", description: "Full enterprise access and administration" }
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, description: dept.description },
      create: dept
    });
  }
  console.log("Departments seeded.");

  // 2. Seed Permissions
  const permissions = [
    { name: "Access Overview Dashboard", code: "view_overview", description: "Access overview metrics and segmented analytics" },
    { name: "Access Buyers", code: "view_buyers", description: "View B2B buyers list and memory brain profiles" },
    { name: "Manage Buyers", code: "manage_buyers", description: "Create, edit and configure buyer accounts" },
    { name: "Access Leads Board", code: "view_leads", description: "Access pipeline leads acquisition board" },
    { name: "Manage Leads", code: "manage_leads", description: "Manage leads, cold to warm conversion" },
    { name: "Access Stock & SKU", code: "view_stock", description: "View fabric inventory and B2B pricing" },
    { name: "Manage Stock & SKU", code: "manage_stock", description: "Perform stock entries, QC and procure fabrics" },
    { name: "Access Sales Orders", code: "view_orders", description: "View sales orders list and shipment dispatches" },
    { name: "Manage Sales Orders", code: "manage_orders", description: "Log manual orders, confirm orders and triggers" },
    { name: "Access Cash Ledger", code: "view_cashflow", description: "View operational income and payments ledger" },
    { name: "Manage Cash Ledger", code: "manage_cashflow", description: "Log operational cash, supplier payouts and receivables" },
    { name: "Access WhatsApp Sandbox", code: "view_whatsapp", description: "View Cloud API automation chat simulator" },
    { name: "Manage WhatsApp Sandbox", code: "manage_whatsapp", description: "Broadcast templates and chat automations" },
    { name: "Access Technical Settings", code: "view_technical", description: "Access backend configurations, API logs and AI rules" },
    { name: "Manage User Accounts", code: "manage_users", description: "Create and configure employee credentials and permissions" }
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, description: perm.description },
      create: perm
    });
  }
  console.log("Permissions seeded.");

  // 3. Seed Roles & link permissions
  const roles = [
    {
      name: "Founder",
      code: "FOUNDER",
      description: "Company owner with absolute system clearance",
      perms: permissions.map(p => p.code)
    },
    {
      name: "Admin",
      code: "ADMIN",
      description: "System administrator with full operations clearance",
      perms: permissions.map(p => p.code)
    },
    {
      name: "Sales Agent",
      code: "SALES_ROLE",
      description: "Department role for warm follow-ups and order conversion",
      perms: ["view_orders", "manage_orders", "view_buyers", "manage_buyers", "view_leads", "manage_leads", "view_whatsapp", "manage_whatsapp"]
    },
    {
      name: "Accounts Manager",
      code: "ACCOUNTS_ROLE",
      description: "Department role for finance, GST and invoices",
      perms: ["view_cashflow", "manage_cashflow", "view_orders"]
    },
    {
      name: "QC Specialist",
      code: "INVENTORY_ROLE",
      description: "Department role for warehouse control and counts",
      perms: ["view_stock", "manage_stock", "view_orders"]
    },
    {
      name: "Technical Engineer",
      code: "TECHNICAL_ROLE",
      description: "Department role for APIs, AI workflows and debug logs",
      perms: ["view_whatsapp", "manage_whatsapp", "view_stock", "view_technical"]
    }
  ];

  for (const r of roles) {
    const roleRecord = await prisma.role.upsert({
      where: { code: r.code },
      update: { name: r.name, description: r.description },
      create: { name: r.name, code: r.code, description: r.description }
    });

    // Link RolePermission
    for (const pCode of r.perms) {
      const permRecord = await prisma.permission.findUnique({ where: { code: pCode } });
      if (permRecord) {
        await prisma.rolePermission.upsert({
          where: {
            role_id_permission_id: {
              role_id: roleRecord.id,
              permission_id: permRecord.id
            }
          },
          update: {},
          create: {
            role_id: roleRecord.id,
            permission_id: permRecord.id
          }
        });
      }
    }
  }
  console.log("Roles and Role-Permissions seeded.");

  // 4. Map existing staff members to their departments and roles
  const staffMembers = await prisma.staff.findMany();
  for (const s of staffMembers) {
    let deptCode = "ADMIN";
    let roleCode = "ADMIN";
    
    if (s.role === "FOUNDER") {
      deptCode = "ADMIN";
      roleCode = "FOUNDER";
    } else if (s.role === "ADMIN") {
      deptCode = "ADMIN";
      roleCode = "ADMIN";
    } else if (s.role === "SALES") {
      deptCode = "SALES";
      roleCode = "SALES_ROLE";
    } else if (s.role === "ACCOUNTS") {
      deptCode = "ACCOUNTS";
      roleCode = "ACCOUNTS_ROLE";
    } else if (s.role === "INVENTORY") {
      deptCode = "INVENTORY";
      roleCode = "INVENTORY_ROLE";
    } else if (s.role === "TECHNICAL") {
      deptCode = "TECHNICAL";
      roleCode = "TECHNICAL_ROLE";
    }

    const dept = await prisma.department.findUnique({ where: { code: deptCode } });
    const r = await prisma.role.findUnique({ where: { code: roleCode } });

    await prisma.staff.update({
      where: { staff_id: s.staff_id },
      data: {
        department_id: dept ? dept.id : null
      }
    });

    if (r) {
      await prisma.staffRole.upsert({
        where: {
          staff_id_role_id: {
            staff_id: s.staff_id,
            role_id: r.id
          }
        },
        update: {},
        create: {
          staff_id: s.staff_id,
          role_id: r.id
        }
      });
    }

    // Upsert a matching User credentials record for that staff
    await prisma.user.upsert({
      where: { email: s.email },
      update: {
        name: s.name,
        password_hash: s.password_hash,
        role: s.role,
        status: s.status,
        staff_id: s.staff_id
      },
      create: {
        name: s.name,
        email: s.email,
        password_hash: s.password_hash,
        role: s.role,
        status: s.status,
        staff_id: s.staff_id
      }
    });
  }
  console.log("Existing staff records mapped to Departments, Roles, and Users.");
  console.log("RBAC Seeding complete!");
}

main()
  .catch(e => {
    console.error("RBAC Seeding failed: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

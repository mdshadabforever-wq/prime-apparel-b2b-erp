import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthTokenFromHeader, verifyToken, hashPassword } from "@/lib/auth";

// GET: List all users/staff with search & filters
export async function GET(request: Request) {
  try {
    const token = getAuthTokenFromHeader(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access. No session token." }, { status: 401 });
    }
    const caller = verifyToken(token);
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "FOUNDER")) {
      return NextResponse.json({ error: "Access denied. Founder or Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    // Build Prisma query filters
    const where: any = {};
    
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { mobile: { contains: q } },
        { email: { contains: q } }
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const staffList = await db.staff.findMany({
      where,
      include: {
        department: true,
        roles: {
          include: {
            role: true
          }
        }
      },
      orderBy: { staff_id: "asc" }
    });

    return NextResponse.json({ success: true, users: staffList });
  } catch (error: any) {
    console.error("GET users failed: ", error);
    return NextResponse.json({ error: "Users list could not be loaded." }, { status: 500 });
  }
}

// POST: Create a new employee login
export async function POST(request: Request) {
  try {
    const token = getAuthTokenFromHeader(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access. No session token." }, { status: 401 });
    }
    const caller = verifyToken(token);
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "FOUNDER")) {
      return NextResponse.json({ error: "Access denied. Founder or Admin privileges required." }, { status: 403 });
    }

    const body = await request.json();
    const { name, mobile, email, password, role, departmentCode, permissions } = body;

    if (!name || !mobile || !email || !password || !role || !departmentCode) {
      return NextResponse.json({ error: "Zaroori fields (Name, Mobile, Email, Password, Role, Department) miss hain." }, { status: 400 });
    }

    const cleanMobile = mobile.replace(/\D/g, "");

    // Check if mobile already exists in Staff
    const existingStaffMobile = await db.staff.findUnique({ where: { mobile: cleanMobile } });
    if (existingStaffMobile) {
      return NextResponse.json({ error: "Yeh mobile number pehle se staff account ke liye registered hai." }, { status: 400 });
    }

    // Check if email already exists in Staff
    const existingStaffEmail = await db.staff.findUnique({ where: { email } });
    if (existingStaffEmail) {
      return NextResponse.json({ error: "Yeh email address pehle se staff account ke liye registered hai." }, { status: 400 });
    }

    // Find department
    const dept = await db.department.findUnique({ where: { code: departmentCode } });
    if (!dept) {
      return NextResponse.json({ error: "Invalid Department. Seed database defaults." }, { status: 400 });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create Staff
    const newStaff = await db.staff.create({
      data: {
        name,
        mobile: cleanMobile,
        email,
        password_hash: passwordHash,
        role,
        permissions: permissions || "",
        status: "active",
        department_id: dept.id
      }
    });

    // Create User record linked to Staff
    await db.user.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role,
        status: "active",
        staff_id: newStaff.staff_id
      }
    });

    // Map role
    const roleRecord = await db.role.findFirst({
      where: {
        code: {
          in: [role + "_ROLE", role]
        }
      }
    });

    if (roleRecord) {
      await db.staffRole.create({
        data: {
          staff_id: newStaff.staff_id,
          role_id: roleRecord.id
        }
      });
    }

    // Write to AuditLog
    await db.auditLog.create({
      data: {
        user_name: caller.name,
        action: "CREATE_USER",
        description: `Created new staff login for ${name} (${role}) in ${dept.name}`,
        linked_id: String(newStaff.staff_id)
      }
    });

    return NextResponse.json({
      success: true,
      message: "Employee login created successfully.",
      user: {
        id: newStaff.staff_id,
        name: newStaff.name,
        mobile: newStaff.mobile,
        email: newStaff.email,
        role: newStaff.role
      }
    });
  } catch (error: any) {
    console.error("POST user failed: ", error);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }
}

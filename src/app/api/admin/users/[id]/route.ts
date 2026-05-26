import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthTokenFromHeader, verifyToken, hashPassword } from "@/lib/auth";

// PUT: Update employee details (block/unblock, password reset, update role/dept)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = getAuthTokenFromHeader(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access. No session token." }, { status: 401 });
    }
    const caller = verifyToken(token);
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "FOUNDER")) {
      return NextResponse.json({ error: "Access denied. Founder or Admin privileges required." }, { status: 403 });
    }

    const staffId = parseInt(params.id);
    if (isNaN(staffId)) {
      return NextResponse.json({ error: "Invalid Staff ID." }, { status: 400 });
    }

    const staff = await db.staff.findUnique({ where: { staff_id: staffId } });
    if (!staff) {
      return NextResponse.json({ error: "Employee account not found." }, { status: 404 });
    }

    const body = await request.json();
    const { name, mobile, email, password, role, departmentCode, status, permissions } = body;

    const updateData: any = {};
    const userUpdateData: any = {};

    if (name) {
      updateData.name = name;
      userUpdateData.name = name;
    }
    if (mobile) {
      updateData.mobile = mobile.replace(/\D/g, "");
    }
    if (email) {
      updateData.email = email;
      userUpdateData.email = email;
    }
    if (password) {
      const passwordHash = await hashPassword(password);
      updateData.password_hash = passwordHash;
      userUpdateData.password_hash = passwordHash;
    }
    if (role) {
      updateData.role = role;
      userUpdateData.role = role;
    }
    if (permissions !== undefined) {
      updateData.permissions = permissions;
    }
    if (status) {
      updateData.status = status;
      userUpdateData.status = status;

      // If we are blocking/deactivating the user, let's deactivate all their active sessions
      if (status === "inactive") {
        await db.userSession.updateMany({
          where: { staff_id: staffId },
          data: { is_active: false }
        });
      }
    }

    if (departmentCode) {
      const dept = await db.department.findUnique({ where: { code: departmentCode } });
      if (dept) {
        updateData.department_id = dept.id;
      }
    }

    // Perform database updates
    const updatedStaff = await db.staff.update({
      where: { staff_id: staffId },
      data: updateData
    });

    // Update matching User table if exists
    const matchingUser = await db.user.findUnique({ where: { staff_id: staffId } });
    if (matchingUser) {
      await db.user.update({
        where: { staff_id: staffId },
        data: userUpdateData
      });
    }

    // If role changed, update StaffRole mapping
    if (role) {
      const roleRecord = await db.role.findFirst({
        where: {
          code: {
            in: [role + "_ROLE", role]
          }
        }
      });
      if (roleRecord) {
        // Delete old role mapping
        await db.staffRole.deleteMany({ where: { staff_id: staffId } });
        // Create new role mapping
        await db.staffRole.create({
          data: {
            staff_id: staffId,
            role_id: roleRecord.id
          }
        });
      }
    }

    // Write to AuditLog
    let changeDesc = `Updated employee profile ${staff.name}`;
    if (status && status !== staff.status) {
      changeDesc = `${status === "inactive" ? "Blocked/Disabled" : "Activated/Enabled"} employee account for ${staff.name}`;
    } else if (password) {
      changeDesc = `Reset password for employee ${staff.name}`;
    }

    await db.auditLog.create({
      data: {
        user_name: caller.name,
        action: "UPDATE_USER",
        description: changeDesc,
        linked_id: String(staffId)
      }
    });

    return NextResponse.json({
      success: true,
      message: "Employee profile updated successfully.",
      user: updatedStaff
    });
  } catch (error: any) {
    console.error("PUT user failed: ", error);
    return NextResponse.json({ error: "Failed to update employee details." }, { status: 500 });
  }
}

// DELETE: Safely remove a staff account
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = getAuthTokenFromHeader(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized access. No session token." }, { status: 401 });
    }
    const caller = verifyToken(token);
    if (!caller || (caller.role !== "ADMIN" && caller.role !== "FOUNDER")) {
      return NextResponse.json({ error: "Access denied. Founder or Admin privileges required." }, { status: 403 });
    }

    const staffId = parseInt(params.id);
    if (isNaN(staffId)) {
      return NextResponse.json({ error: "Invalid Staff ID." }, { status: 400 });
    }

    const staff = await db.staff.findUnique({ where: { staff_id: staffId } });
    if (!staff) {
      return NextResponse.json({ error: "Employee account not found." }, { status: 404 });
    }

    // Restrict Admin/Founder from deleting themselves!
    if (staffId === caller.userId) {
      return NextResponse.json({ error: "Aap khud ka login account delete nahi kar sakte." }, { status: 400 });
    }

    // Delete related records
    await db.user.deleteMany({ where: { staff_id: staffId } });
    await db.staffRole.deleteMany({ where: { staff_id: staffId } });
    await db.userSession.deleteMany({ where: { staff_id: staffId } });
    await db.loginActivity.deleteMany({ where: { staff_id: staffId } });

    // Delete staff
    await db.staff.delete({ where: { staff_id: staffId } });

    // Write to AuditLog
    await db.auditLog.create({
      data: {
        user_name: caller.name,
        action: "DELETE_USER",
        description: `Deleted employee login account for ${staff.name} (${staff.email})`,
        linked_id: String(staffId)
      }
    });

    return NextResponse.json({
      success: true,
      message: "Employee account deleted successfully."
    });
  } catch (error: any) {
    console.error("DELETE user failed: ", error);
    return NextResponse.json({ error: "Failed to delete employee account." }, { status: 500 });
  }
}

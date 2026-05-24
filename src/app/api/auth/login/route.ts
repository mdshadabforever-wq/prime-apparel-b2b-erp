import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { mobile, password } = await request.json();

    if (!mobile || !password) {
      return NextResponse.json(
        { error: "Mobile number aur password zaroori hain." },
        { status: 400 }
      );
    }

    // Standardize mobile formatting (remove leading +, spaces, etc. or match exactly)
    const cleanMobile = mobile.replace(/\D/g, "");

    // 1. Check in Staff table first
    const staff = await db.staff.findUnique({
      where: { mobile: cleanMobile }
    });

    if (staff) {
      if (staff.status !== "active") {
        return NextResponse.json(
          { error: "Aapka staff account inactive hai. Admin se baat karein." },
          { status: 403 }
        );
      }

      const isValidPassword = await comparePassword(password, staff.password_hash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Mobile number ya password galat hai." },
          { status: 401 }
        );
      }

      // Generate JWT Token
      const token = signToken({
        userId: staff.staff_id,
        mobile: staff.mobile,
        name: staff.name,
        role: staff.role,
        permissions: staff.permissions.split(",")
      });

      // Set cookie and return success
      const response = NextResponse.json({
        success: true,
        user: {
          id: staff.staff_id,
          name: staff.name,
          mobile: staff.mobile,
          role: staff.role,
          isStaff: true
        }
      });

      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        path: "/"
      });

      return response;
    }

    // 2. Check in Buyer table
    const buyer = await db.buyer.findUnique({
      where: { mobile: cleanMobile }
    });

    if (buyer) {
      if (buyer.account_status === "PENDING") {
        return NextResponse.json(
          { error: "Aapka account verify ho raha hai. Details review karke hum 24 hours mein WhatsApp pe approve karenge! ⏳" },
          { status: 403 }
        );
      }

      if (buyer.account_status === "REJECTED" || buyer.account_status === "BLOCKED") {
        return NextResponse.json(
          { error: `Aapka account is waqt ${buyer.account_status.toLowerCase()} hai. Help ke liye WhatsApp pe support maangein.` },
          { status: 403 }
        );
      }

      const isValidPassword = await comparePassword(password, buyer.password_hash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Mobile number ya password galat hai." },
          { status: 401 }
        );
      }

      // Generate JWT Token
      const token = signToken({
        userId: buyer.buyer_id,
        mobile: buyer.mobile,
        name: buyer.full_name,
        role: "BUYER",
        permissions: ["buyer"]
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: buyer.buyer_id,
          name: buyer.full_name,
          mobile: buyer.mobile,
          role: "BUYER",
          isStaff: false
        }
      });

      response.cookies.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60,
        path: "/"
      });

      return response;
    }

    // If both checked and not found
    return NextResponse.json(
      { error: "Yeh mobile number system mein nahi mila. Pehle Register karein." },
      { status: 404 }
    );
  } catch (error) {
    console.error("Login Error: ", error);
    return NextResponse.json(
      { error: "Server error occurred during login. Baad mein check karein." },
      { status: 500 }
    );
  }
}

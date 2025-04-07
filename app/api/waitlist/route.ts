/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Zod schema for email validation
const EmailSchema = z
  .string()
  .email({ message: "Invalid email address provided." });

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate email using Zod
    const validationResult = EmailSchema.safeParse(body.email);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const email = validationResult.data;

    // Check if email already exists
    const existingEntry = await prisma.waitlistEntry.findUnique({
      where: { email },
    });

    if (existingEntry) {
      return NextResponse.json(
        { message: "This email is already on the waitlist." },
        { status: 409 }
      ); // 409 Conflict
    }

    // Save the email to the database
    await prisma.waitlistEntry.create({
      data: {
        email: email,
      },
    });

    console.log(`Waitlist signup successful: ${email}`);

    return NextResponse.json(
      { message: "Successfully joined the waitlist!" },
      { status: 201 }
    ); // 201 Created
  } catch (error) {
    console.error("Waitlist API Error:", error);
    // Handle potential Prisma unique constraint errors more gracefully if needed
    if (
      error instanceof Error &&
      "code" in error &&
      (error as any).code === "P2002"
    ) {
      return NextResponse.json(
        { message: "This email is already on the waitlist." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  } finally {
    // Ensure Prisma Client disconnects after the request (important for serverless environments)
    await prisma.$disconnect();
  }
}

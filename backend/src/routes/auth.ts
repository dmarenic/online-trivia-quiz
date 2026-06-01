import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } =
      req.body;

    if (
      !username ||
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({
          message:
            "Sva polja su obavezna.",
        });
    }

    const existingUser =
      await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username },
          ],
        },
      });

    if (existingUser) {
      return res
        .status(409)
        .json({
          message:
            "Korisnik već postoji.",
        });
    }

    const hashedPassword =
      await bcrypt.hash(password, 10);

    const user =
      await prisma.user.create({
        data: {
          username,
          email,
          password:
            hashedPassword,
        },

        select: {
          id: true,
          username: true,
          email: true,

          role: true,
          avatar: true,

          createdAt: true,
        },
      });

    return res
      .status(201)
      .json(user);

  } catch (error) {
    return res
      .status(500)
      .json({
        message:
          "Greška na serveru.",
      });
  }
});

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({
          message:
            "Email i password su obavezni.",
        });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email,
        },
      });

    if (!user) {
      return res
        .status(401)
        .json({
          message:
            "Pogrešan email ili password.",
        });
    }

    const valid =
      await bcrypt.compare(
        password,
        user.password,
      );

    if (!valid) {
      return res
        .status(401)
        .json({
          message:
            "Pogrešan email ili password.",
        });
    }

    return res
      .status(200)
      .json({
        id: user.id,

        username:
          user.username,

        email:
          user.email,

        role:
          user.role,

        avatar:
          user.avatar,

      });

  } catch (error) {
    return res
      .status(500)
      .json({
        message:
          "Greška na serveru.",
      });
  }
});

export default router;
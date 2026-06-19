import { suratSchema } from "./schema";
import { uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const pengguna = suratSchema.table("pengguna", {
  id: uuid("id").primaryKey(),
  nama: text("nama").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

import { pgTable, text, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";

// ── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  hashedPassword: text("hashed_password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Folders ──────────────────────────────────────────────────────────────────

export const folders = pgTable("folders", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Papers ───────────────────────────────────────────────────────────────────

export const papers = pgTable("papers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  folderId: text("folder_id").references(() => folders.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  author: text("author").notNull(),
  school: text("school"),
  year: integer("year").notNull(),
  venue: text("venue").notNull(),
  starred: boolean("starred").default(false).notNull(),
  references: jsonb("references"),
  filePath: text("file_path").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Highlights ───────────────────────────────────────────────────────────────

export const highlights = pgTable("highlights", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  paperId: text("paper_id").notNull().references(() => papers.id, { onDelete: "cascade" }),
  content: jsonb("content").notNull(),       // { text, image, ... }
  position: jsonb("position").notNull(),     // ScaledPosition
  color: text("color").notNull().default("yellow"),
  comment: jsonb("comment"),                // { text, emoji }
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Notes ────────────────────────────────────────────────────────────────────

export const notes = pgTable("notes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  paperId: text("paper_id").notNull().references(() => papers.id, { onDelete: "cascade" }),
  highlightId: text("highlight_id"),        // optional linkage
  blocks: jsonb("blocks").notNull(),        // NoteBlock[]
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Type exports ─────────────────────────────────────────────────────────────

export type User    = typeof users.$inferSelect;
export type Folder  = typeof folders.$inferSelect;
export type Paper   = typeof papers.$inferSelect;
export type Highlight = typeof highlights.$inferSelect;
export type Note    = typeof notes.$inferSelect;

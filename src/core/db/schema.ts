import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, uuid, pgEnum } from "drizzle-orm/pg-core";

// Enums for profile
export const subscriptionTierEnum = pgEnum("subscription_tier", ["free", "solo", "famille", "collectif"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["trial", "active", "cancelled", "expired"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

// userRelations moved below profile table definition

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// Profile table
export const profile = pgTable(
  "profile",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    displayName: text("display_name"),
    avatarBlobKey: text("avatar_blob_key"),
    currency: text("currency").default("XOF").notNull(),
    locale: text("locale").default("fr").notNull(),
    subscriptionTier: subscriptionTierEnum("subscription_tier").default("free").notNull(),
    subscriptionStatus: subscriptionStatusEnum("subscription_status").default("trial").notNull(),
    trialEndsAt: timestamp("trial_ends_at"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("profile_userId_idx").on(table.userId)],
);

// Add profile relation to user
export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  profile: one(profile, {
    fields: [user.id],
    references: [profile.userId],
  }),
}));

// Tontine enums
export const tontineFrequencyEnum = pgEnum("tontine_frequency", ["weekly", "biweekly", "monthly"]);
export const tontineStatusEnum = pgEnum("tontine_status", ["active", "paused", "completed", "cancelled"]);
export const cycleStatusEnum = pgEnum("cycle_status", ["pending", "in_progress", "completed", "skipped"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "late", "waived"]);

// Tontines table
export const tontine = pgTable(
  "tontine",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    amount: text("amount").notNull(), // stored as text for precision (decimal)
    frequency: tontineFrequencyEnum("frequency").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date"),
    status: tontineStatusEnum("status").default("active").notNull(),
    creatorId: text("creator_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("tontine_creatorId_idx").on(table.creatorId),
    index("tontine_status_idx").on(table.status),
  ],
);

// Tontine members table
export const tontineMember = pgTable(
  "tontine_member",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tontineId: uuid("tontine_id")
      .notNull()
      .references(() => tontine.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    turnOrder: text("turn_order").notNull(), // position in rotation
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => [
    index("tontineMember_tontineId_idx").on(table.tontineId),
    index("tontineMember_userId_idx").on(table.userId),
  ],
);

// Tontine cycles table
export const tontineCycle = pgTable(
  "tontine_cycle",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tontineId: uuid("tontine_id")
      .notNull()
      .references(() => tontine.id, { onDelete: "cascade" }),
    recipientMemberId: uuid("recipient_member_id")
      .notNull()
      .references(() => tontineMember.id, { onDelete: "cascade" }),
    cycleNumber: text("cycle_number").notNull(),
    dueDate: timestamp("due_date").notNull(),
    status: cycleStatusEnum("status").default("pending").notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("tontineCycle_tontineId_idx").on(table.tontineId),
    index("tontineCycle_recipientMemberId_idx").on(table.recipientMemberId),
  ],
);

// Tontine payments table
export const tontinePayment = pgTable(
  "tontine_payment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cycleId: uuid("cycle_id")
      .notNull()
      .references(() => tontineCycle.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => tontineMember.id, { onDelete: "cascade" }),
    amount: text("amount").notNull(),
    status: paymentStatusEnum("status").default("pending").notNull(),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("tontinePayment_cycleId_idx").on(table.cycleId),
    index("tontinePayment_memberId_idx").on(table.memberId),
  ],
);

// Tontine relations
export const tontineRelations = relations(tontine, ({ one, many }) => ({
  creator: one(user, {
    fields: [tontine.creatorId],
    references: [user.id],
  }),
  members: many(tontineMember),
  cycles: many(tontineCycle),
}));

export const tontineMemberRelations = relations(tontineMember, ({ one, many }) => ({
  tontine: one(tontine, {
    fields: [tontineMember.tontineId],
    references: [tontine.id],
  }),
  user: one(user, {
    fields: [tontineMember.userId],
    references: [user.id],
  }),
  payments: many(tontinePayment),
}));

export const tontineCycleRelations = relations(tontineCycle, ({ one, many }) => ({
  tontine: one(tontine, {
    fields: [tontineCycle.tontineId],
    references: [tontine.id],
  }),
  recipient: one(tontineMember, {
    fields: [tontineCycle.recipientMemberId],
    references: [tontineMember.id],
  }),
  payments: many(tontinePayment),
}));

export const tontinePaymentRelations = relations(tontinePayment, ({ one }) => ({
  cycle: one(tontineCycle, {
    fields: [tontinePayment.cycleId],
    references: [tontineCycle.id],
  }),
  member: one(tontineMember, {
    fields: [tontinePayment.memberId],
    references: [tontineMember.id],
  }),
}));

// Notification enums
export const notificationTypeEnum = pgEnum("notification_type", [
  "payment_due",
  "payment_received",
  "cycle_complete",
  "member_joined",
  "tontine_update",
]);

// Notifications table
export const notification = pgTable(
  "notification",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: boolean("read").default(false).notNull(),
    tontineId: uuid("tontine_id").references(() => tontine.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_userId_idx").on(table.userId),
    index("notification_read_idx").on(table.read),
  ],
);

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
  tontine: one(tontine, {
    fields: [notification.tontineId],
    references: [tontine.id],
  }),
}));

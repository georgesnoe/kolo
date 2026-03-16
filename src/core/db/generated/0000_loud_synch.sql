CREATE TYPE "public"."cycle_status" AS ENUM('pending', 'in_progress', 'completed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'late', 'waived');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trial', 'active', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'solo', 'famille', 'collectif');--> statement-breakpoint
CREATE TYPE "public"."tontine_frequency" AS ENUM('weekly', 'biweekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."tontine_status" AS ENUM('active', 'paused', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text,
	"avatar_blob_key" text,
	"currency" text DEFAULT 'XOF' NOT NULL,
	"locale" text DEFAULT 'fr' NOT NULL,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"subscription_status" "subscription_status" DEFAULT 'trial' NOT NULL,
	"trial_ends_at" timestamp,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tontine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"amount" text NOT NULL,
	"frequency" "tontine_frequency" NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"status" "tontine_status" DEFAULT 'active' NOT NULL,
	"creator_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tontine_cycle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tontine_id" uuid NOT NULL,
	"recipient_member_id" uuid NOT NULL,
	"cycle_number" text NOT NULL,
	"due_date" timestamp NOT NULL,
	"status" "cycle_status" DEFAULT 'pending' NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tontine_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tontine_id" uuid NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"turn_order" text NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tontine_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cycle_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"amount" text NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tontine" ADD CONSTRAINT "tontine_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tontine_cycle" ADD CONSTRAINT "tontine_cycle_tontine_id_tontine_id_fk" FOREIGN KEY ("tontine_id") REFERENCES "public"."tontine"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tontine_cycle" ADD CONSTRAINT "tontine_cycle_recipient_member_id_tontine_member_id_fk" FOREIGN KEY ("recipient_member_id") REFERENCES "public"."tontine_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tontine_member" ADD CONSTRAINT "tontine_member_tontine_id_tontine_id_fk" FOREIGN KEY ("tontine_id") REFERENCES "public"."tontine"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tontine_member" ADD CONSTRAINT "tontine_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tontine_payment" ADD CONSTRAINT "tontine_payment_cycle_id_tontine_cycle_id_fk" FOREIGN KEY ("cycle_id") REFERENCES "public"."tontine_cycle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tontine_payment" ADD CONSTRAINT "tontine_payment_member_id_tontine_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."tontine_member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profile_userId_idx" ON "profile" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tontine_creatorId_idx" ON "tontine" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "tontine_status_idx" ON "tontine" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tontineCycle_tontineId_idx" ON "tontine_cycle" USING btree ("tontine_id");--> statement-breakpoint
CREATE INDEX "tontineCycle_recipientMemberId_idx" ON "tontine_cycle" USING btree ("recipient_member_id");--> statement-breakpoint
CREATE INDEX "tontineMember_tontineId_idx" ON "tontine_member" USING btree ("tontine_id");--> statement-breakpoint
CREATE INDEX "tontineMember_userId_idx" ON "tontine_member" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tontinePayment_cycleId_idx" ON "tontine_payment" USING btree ("cycle_id");--> statement-breakpoint
CREATE INDEX "tontinePayment_memberId_idx" ON "tontine_payment" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");
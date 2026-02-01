CREATE TYPE "public"."user_role" AS ENUM('user', 'sponsor', 'admin');--> statement-breakpoint
CREATE TYPE "public"."sponsorship_status" AS ENUM('pending', 'accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "idea_sponsorships" (
	"id" serial PRIMARY KEY NOT NULL,
	"idea_id" integer NOT NULL,
	"sponsor_id" integer NOT NULL,
	"status" "sponsorship_status" DEFAULT 'pending' NOT NULL,
	"message" text,
	"amount" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsor_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"website" varchar(255),
	"industry" varchar(255),
	"funding_focus" text,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sponsor_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "idea_sponsorships" ADD CONSTRAINT "idea_sponsorships_idea_id_ideas_id_fk" FOREIGN KEY ("idea_id") REFERENCES "public"."ideas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idea_sponsorships" ADD CONSTRAINT "idea_sponsorships_sponsor_id_users_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_profiles" ADD CONSTRAINT "sponsor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idea_sponsorships_idea_id_idx" ON "idea_sponsorships" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "idea_sponsorships_sponsor_id_idx" ON "idea_sponsorships" USING btree ("sponsor_id");
CREATE INDEX "idea_addressed_idea_id_idx" ON "idea_addressed_to" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "idea_likes_idea_id_idx" ON "idea_likes" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "idea_topics_idea_id_idx" ON "idea_topics" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "idea_topics_name_idx" ON "idea_topics" USING btree ("topic_name");--> statement-breakpoint
CREATE INDEX "ideas_creator_id_idx" ON "ideas" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "ideas_created_at_idx" ON "ideas" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "profile_views_viewed_id_idx" ON "profile_views" USING btree ("viewed_id");--> statement-breakpoint
CREATE INDEX "user_topics_user_id_idx" ON "user_topics" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "message_threads_idea_id_idx" ON "message_threads" USING btree ("idea_id");--> statement-breakpoint
CREATE INDEX "messages_thread_id_idx" ON "messages" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "messages_user_id_idx" ON "messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "thread_participants_thread_id_idx" ON "thread_participants" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "thread_participants_user_id_idx" ON "thread_participants" USING btree ("user_id");
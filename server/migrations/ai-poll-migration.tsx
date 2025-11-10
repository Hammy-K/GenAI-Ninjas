import { db } from "../db";
import { sql } from "drizzle-orm";

export async function runAIPollMigration() {
  try {
    console.log("🔍 Checking AI Poll tables...");

    // Check if ai_poll_sessions table exists
    const sessionsCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ai_poll_sessions'
      );
    `);

    const sessionsExists = sessionsCheck.rows[0]?.exists;

    if (!sessionsExists) {
      console.log("📝 Creating ai_poll_sessions table...");
      await db.execute(sql`
        CREATE TABLE ai_poll_sessions (
          id SERIAL PRIMARY KEY,
          code VARCHAR(6) UNIQUE NOT NULL,
          title VARCHAR(255) NOT NULL,
          video_embed TEXT NOT NULL,
          correct_answer VARCHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B')),
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed')),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await db.execute(sql`
        CREATE INDEX idx_session_status ON ai_poll_sessions(status);
      `);

      console.log("✅ ai_poll_sessions table created successfully");
    } else {
      console.log("✅ ai_poll_sessions table already exists");
    }

    // Check if ai_poll_votes table exists
    const votesCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'ai_poll_votes'
      );
    `);

    const votesExists = votesCheck.rows[0]?.exists;

    if (!votesExists) {
      console.log("📝 Creating ai_poll_votes table...");
      await db.execute(sql`
        CREATE TABLE ai_poll_votes (
          id SERIAL PRIMARY KEY,
          session_id INTEGER REFERENCES ai_poll_sessions(id) ON DELETE CASCADE,
          student_name VARCHAR(255) NOT NULL,
          teacher_name VARCHAR(255) NOT NULL,
          gender VARCHAR(10) NOT NULL CHECK (gender IN ('male', 'female')),
          selected_answer VARCHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B')),
          is_correct BOOLEAN NOT NULL,
          voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(session_id, student_name, teacher_name)
        );
      `);

      await db.execute(sql`
        CREATE INDEX idx_session_votes ON ai_poll_votes(session_id);
      `);

      console.log("✅ ai_poll_votes table created successfully");
    } else {
      console.log("✅ ai_poll_votes table already exists");
    }

    console.log("🎉 AI Poll migration completed successfully!");
    return true;
  } catch (error) {
    console.error("❌ Error running AI Poll migration:", error);
    throw error;
  }
}

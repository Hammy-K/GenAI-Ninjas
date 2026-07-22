-- Video jobs polling (worker polls these every 2s)
CREATE INDEX idx_video_jobs_status_next_check ON video_jobs(status, next_check_at);

-- Firebase UID lookups (hot paths in multiple places)
CREATE INDEX idx_app_builder_progress_firebase_uid ON app_builder_progress(firebase_uid);
CREATE INDEX idx_lovable_mission_progress_firebase_uid ON lovable_mission_progress(firebase_uid);
CREATE INDEX idx_assistant_logs_firebase_uid ON assistant_logs(firebase_uid);

-- Gallery likes (every like/unlike does a lookup + toggle)
CREATE INDEX idx_gallery_likes_image_id_session_id ON gallery_likes(image_id, session_id);

-- Leaderboard/supervisor queries
CREATE INDEX idx_tracks_students_student_email ON tracks_students(student_email);
CREATE INDEX idx_tracks_students_supervisor ON tracks_students(supervisor);

-- Project submissions voting/filtering
CREATE INDEX idx_project_submission_votes_submission_id_user_id ON project_submission_votes(submission_id, user_id);
CREATE INDEX idx_project_submissions_user_id ON project_submissions(user_id);
CREATE INDEX idx_project_submissions_mission_id ON project_submissions(mission_id);

-- HTML projects filtering
CREATE INDEX idx_html_projects_firebase_uid ON html_projects(firebase_uid);
CREATE INDEX idx_html_projects_is_featured ON html_projects(is_featured);

-- Student deduplication
CREATE INDEX idx_students_email ON students(email);

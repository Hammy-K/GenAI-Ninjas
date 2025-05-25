import os
import datetime
import psycopg2
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv
from gspread.exceptions import WorksheetNotFound

load_dotenv()  # loads PGHOST, PGDATABASE, PGUSER, PGPASSWORD

# 1) Connect & fetch both queries
conn = psycopg2.connect(host=os.getenv("PGHOST"),
                        dbname=os.getenv("PGDATABASE"),
                        user=os.getenv("PGUSER"),
                        password=os.getenv("PGPASSWORD"),
                        sslmode="require")
cur = conn.cursor()

# First query: html_projects
cur.execute("""
 WITH student_info AS (
  SELECT
    id   AS user_id,
    phone_number,
    full_name,
    school_name
  FROM students
),

html_messages AS (
  -- count HTML messages per phone number
  SELECT
    s.phone_number,
    COUNT(m.message) AS html_message_count
  FROM student_html_messages m
  JOIN student_info s
    ON cast(s.user_id as int) = cast(m.student_id as int)
  GROUP BY s.phone_number
),

all_projects AS (
  -- attach phone_number, then rank per phone_number by created_at
  SELECT
    p.project_id,
    p.created_at,
    CAST(p.created_at AS DATE)         AS project_date,
    s.phone_number,
    ROW_NUMBER() OVER (
      PARTITION BY s.phone_number
      ORDER BY p.created_at DESC
    )                                  AS rn
  FROM html_projects p
  JOIN student_info s
    ON cast(s.user_id as int) = cast(p.user_id as int)
),

last_project AS (
  -- pick the most recent (rn = 1) per phone_number
  SELECT
    phone_number,
    project_id,
    created_at,
    project_date,
    CONCAT('https://noongenai.replit.app/project/', project_id) AS project_url
  FROM all_projects
  WHERE rn = 1
),

total_projects AS (
  -- count DISTINCT projects per phone_number
  SELECT
    s.phone_number,
    COUNT(DISTINCT p.project_id) AS total_projects
  FROM html_projects p
  JOIN student_info s
    ON cast(s.user_id as int) = cast(p.user_id as int)
  GROUP BY s.phone_number
)

SELECT
  lp.phone_number,
  si.user_id,
  si.full_name,
  si.school_name,
  lp.project_id,
  lp.project_url,
  lp.project_date,
  lp.created_at,
  tp.total_projects,
  hm.html_message_count
FROM last_project lp
JOIN student_info si
  ON si.phone_number = lp.phone_number
LEFT JOIN total_projects tp
  ON tp.phone_number = lp.phone_number
LEFT JOIN html_messages hm
  ON hm.phone_number = lp.phone_number
;
""")
proj_rows = cur.fetchall()
proj_cols = [d[0] for d in cur.description]

# Second query: messages summary
cur.execute("""
 with html_messages as (
  SELECT student_id, COUNT(message) html_message_count
  FROM student_html_messages
  group by student_id
)
, all_projects as (
  SELECT distinct user_id, project_id, created_at, cast(created_at as date) project_date, 
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
  from html_projects
)
, total_projects as (
  SELECT user_id, count(distinct project_id) total_projects
  FROM all_projects
  group by user_id
)
, last_project as (
  SELECT distinct
  user_id,
  project_id,
  created_at,
  project_date,
  (case when project_id is not null then 
  concat('https://noongenai.replit.app/project/',project_id)
  end) project_url
FROM all_projects
WHERE rn = 1
)
, student_info as (
  SELECT distinct s.id user_id, s.phone_number, s.full_name,  s.school_name
  FROM students s
)

SELECT 
  l.user_id, 
  l.project_id,
  l.project_url,
  l.project_date,
  l.created_at,
  s.phone_number, 
  s.full_name,  
  s.school_name,
  t.total_projects,
  h.html_message_count
  
from last_project l
left join total_projects t on cast(t.user_id as int) = cast(l.user_id as int)
left join html_messages h on cast(h.student_id as int) = cast(l.user_id as int)
left join student_info s on cast(s.user_id as int) = cast(l.user_id as int)
;
""")
msg_rows = cur.fetchall()
msg_cols = [d[0] for d in cur.description]

cur.close()
conn.close()

# 2) Authorize Google Sheets
scope = [
    "https://spreadsheets.google.com/feeds",
    "https://www.googleapis.com/auth/drive"
]
creds = ServiceAccountCredentials.from_json_keyfile_name(
    "service_account.json", scope)
gc = gspread.authorize(creds)

sh = gc.open_by_key("1Cui66gvCpkXo4ZzyW8pxRoht-EvZip5duRxsqD9LpMk")

# 3) Push html_projects to the first sheet (sheet1)
ws1 = sh.sheet1
ws1.clear()
# Convert datetimes to ISO strings
safe_proj = [[
    cell.isoformat() if isinstance(cell, (datetime.date,
                                          datetime.datetime)) else cell
    for cell in row
] for row in proj_rows]
# Batch update: header + all rows in one request
ws1.update([proj_cols] + safe_proj, value_input_option='RAW')

# 4) Push messages summary to (or create) "Messages" tab
try:
    ws2 = sh.worksheet("Student_projects")
except WorksheetNotFound:
    ws2 = sh.add_worksheet(title="Student_projects",
                           rows=str(len(msg_rows) + 5),
                           cols=str(len(msg_cols) + 5))

ws2.clear()
safe_msgs = [[
    cell.isoformat() if isinstance(cell, (datetime.date,
                                          datetime.datetime)) else cell
    for cell in row
] for row in msg_rows]
ws2.update([msg_cols] + safe_msgs, value_input_option='RAW')

print(
    f"Pushed {len(proj_rows)} project rows and {len(msg_rows)} message rows.")

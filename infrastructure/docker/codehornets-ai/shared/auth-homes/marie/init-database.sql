-- Marie's Dance Studio Student Management Database
-- Schema Version: 1.0
-- Created: 2025-11-18

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- ============================================================================
-- STUDENTS TABLE
-- Core student information
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  birth_date DATE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_level TEXT CHECK(current_level IN (
    'beginner', 'beginner-intermediate', 'intermediate',
    'intermediate-advanced', 'advanced', 'pre-professional'
  )),
  primary_style TEXT CHECK(primary_style IN (
    'ballet', 'jazz', 'contemporary', 'tap', 'hip-hop', 'lyrical', 'modern'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'graduated')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_students_level ON students(current_level);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_style ON students(primary_style);

-- ============================================================================
-- PARENT/GUARDIAN CONTACT TABLE
-- Contact information for parents and guardians
-- ============================================================================
CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  contact_type TEXT CHECK(contact_type IN ('parent', 'guardian', 'emergency')),
  name TEXT NOT NULL,
  relationship TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT 0,
  notes TEXT,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contacts_student ON contacts(student_id);

-- ============================================================================
-- CLASSES TABLE
-- Dance class definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  style TEXT CHECK(style IN (
    'ballet', 'jazz', 'contemporary', 'tap', 'hip-hop', 'lyrical', 'modern'
  )),
  level TEXT CHECK(level IN (
    'beginner', 'beginner-intermediate', 'intermediate',
    'intermediate-advanced', 'advanced', 'pre-professional'
  )),
  day_of_week TEXT CHECK(day_of_week IN (
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  )),
  time_start TEXT, -- Format: HH:MM
  time_end TEXT,   -- Format: HH:MM
  instructor TEXT,
  studio_room TEXT,
  max_capacity INTEGER,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_classes_day ON classes(day_of_week);
CREATE INDEX IF NOT EXISTS idx_classes_style ON classes(style);
CREATE INDEX IF NOT EXISTS idx_classes_level ON classes(level);

-- ============================================================================
-- ENROLLMENTS TABLE
-- Many-to-many relationship between students and classes
-- ============================================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'waitlist', 'dropped')),
  drop_date DATE,
  notes TEXT,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE(student_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- ============================================================================
-- EVALUATIONS TABLE
-- Student skill assessments and progress evaluations
-- ============================================================================
CREATE TABLE IF NOT EXISTS evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  evaluator TEXT NOT NULL,
  evaluation_type TEXT CHECK(evaluation_type IN (
    'semester', 'recital', 'competition', 'placement', 'progress'
  )),

  -- Skill scores (1-10 scale)
  technique_score INTEGER CHECK(technique_score BETWEEN 1 AND 10),
  musicality_score INTEGER CHECK(musicality_score BETWEEN 1 AND 10),
  performance_score INTEGER CHECK(performance_score BETWEEN 1 AND 10),
  creativity_score INTEGER CHECK(creativity_score BETWEEN 1 AND 10),
  improvement_score INTEGER CHECK(improvement_score BETWEEN 1 AND 10),

  -- Overall assessment
  overall_score INTEGER CHECK(overall_score BETWEEN 1 AND 10),
  strengths TEXT,
  growth_areas TEXT,
  recommendations TEXT,

  -- Detailed notes (can store JSON)
  notes TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_evaluations_student ON evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_date ON evaluations(date);

-- ============================================================================
-- ATTENDANCE TABLE
-- Track student attendance for each class session
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  class_id INTEGER NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('present', 'absent', 'excused', 'late')),
  minutes_late INTEGER,
  notes TEXT,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE(student_id, class_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- ============================================================================
-- CHOREOGRAPHY TABLE
-- Recital and competition choreography pieces
-- ============================================================================
CREATE TABLE IF NOT EXISTS choreography (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  piece_name TEXT NOT NULL,
  style TEXT,
  music_title TEXT,
  music_artist TEXT,
  music_file_path TEXT,
  duration_seconds INTEGER,
  difficulty_level TEXT,
  performance_date DATE,
  event_type TEXT CHECK(event_type IN ('recital', 'competition', 'showcase', 'workshop')),
  choreographer TEXT,
  costume_description TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_choreography_date ON choreography(performance_date);
CREATE INDEX IF NOT EXISTS idx_choreography_event ON choreography(event_type);

-- ============================================================================
-- CHOREOGRAPHY ASSIGNMENTS TABLE
-- Assign students to choreography pieces
-- ============================================================================
CREATE TABLE IF NOT EXISTS choreography_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  choreography_id INTEGER NOT NULL,
  role TEXT, -- 'soloist', 'lead', 'ensemble', etc.
  position TEXT,
  costume_size TEXT,
  costume_received BOOLEAN DEFAULT 0,
  rehearsal_start_date DATE,
  status TEXT DEFAULT 'assigned' CHECK(status IN ('assigned', 'learning', 'ready', 'performed')),
  notes TEXT,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY(choreography_id) REFERENCES choreography(id) ON DELETE CASCADE,
  UNIQUE(student_id, choreography_id)
);

CREATE INDEX IF NOT EXISTS idx_choreo_assign_student ON choreography_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_choreo_assign_choreo ON choreography_assignments(choreography_id);

-- ============================================================================
-- SKILL ASSESSMENTS TABLE
-- Detailed skill tracking for specific dance techniques
-- ============================================================================
CREATE TABLE IF NOT EXISTS skill_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  evaluation_id INTEGER,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  skill_category TEXT NOT NULL, -- 'technique', 'jumps', 'turns', 'flexibility', etc.
  skill_name TEXT NOT NULL,     -- 'pirouette', 'grand jete', 'split', etc.
  proficiency_level TEXT CHECK(proficiency_level IN (
    'learning', 'developing', 'proficient', 'mastered', 'exceptional'
  )),
  score INTEGER CHECK(score BETWEEN 1 AND 10),
  notes TEXT,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY(evaluation_id) REFERENCES evaluations(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_skill_student ON skill_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_category ON skill_assessments(skill_category);

-- ============================================================================
-- GOALS TABLE
-- Student learning goals and milestones
-- ============================================================================
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  goal_text TEXT NOT NULL,
  goal_type TEXT CHECK(goal_type IN ('short-term', 'semester', 'annual', 'milestone')),
  target_date DATE,
  status TEXT DEFAULT 'in-progress' CHECK(status IN (
    'in-progress', 'achieved', 'deferred', 'cancelled'
  )),
  achievement_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_goals_student ON goals(student_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- ============================================================================
-- COMMUNICATIONS LOG TABLE
-- Track parent communications
-- ============================================================================
CREATE TABLE IF NOT EXISTS communications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  communication_type TEXT CHECK(communication_type IN (
    'email', 'phone', 'in-person', 'text', 'parent-conference'
  )),
  subject TEXT,
  content TEXT,
  sent_by TEXT,
  sent_to TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  follow_up_required BOOLEAN DEFAULT 0,
  follow_up_date DATE,
  notes TEXT,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_comm_student ON communications(student_id);
CREATE INDEX IF NOT EXISTS idx_comm_date ON communications(date);

-- ============================================================================
-- VIDEOS TABLE
-- Track performance videos for analysis
-- ============================================================================
CREATE TABLE IF NOT EXISTS videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER,
  choreography_id INTEGER,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  recording_date DATE,
  video_type TEXT CHECK(video_type IN (
    'technique', 'performance', 'rehearsal', 'competition', 'audition'
  )),
  skill_focus TEXT, -- What skill/move is being recorded
  duration_seconds INTEGER,
  analyzed BOOLEAN DEFAULT 0,
  analysis_results TEXT, -- JSON field for video analysis results
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY(choreography_id) REFERENCES choreography(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_videos_student ON videos(student_id);
CREATE INDEX IF NOT EXISTS idx_videos_type ON videos(video_type);
CREATE INDEX IF NOT EXISTS idx_videos_analyzed ON videos(analyzed);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Student roster with current classes
CREATE VIEW IF NOT EXISTS v_student_roster AS
SELECT
  s.id,
  s.name,
  s.current_level,
  s.primary_style,
  s.status,
  COUNT(DISTINCT e.class_id) as class_count,
  GROUP_CONCAT(DISTINCT c.name, ', ') as classes
FROM students s
LEFT JOIN enrollments e ON s.id = e.student_id AND e.status = 'active'
LEFT JOIN classes c ON e.class_id = c.id
GROUP BY s.id, s.name, s.current_level, s.primary_style, s.status;

-- Current class enrollment counts
CREATE VIEW IF NOT EXISTS v_class_enrollment AS
SELECT
  c.id,
  c.name,
  c.style,
  c.level,
  c.day_of_week,
  c.time_start,
  COUNT(e.student_id) as enrolled_count,
  c.max_capacity,
  c.max_capacity - COUNT(e.student_id) as spots_available
FROM classes c
LEFT JOIN enrollments e ON c.id = e.class_id AND e.status = 'active'
WHERE c.status = 'active'
GROUP BY c.id, c.name, c.style, c.level, c.day_of_week, c.time_start, c.max_capacity;

-- Student attendance summary
CREATE VIEW IF NOT EXISTS v_student_attendance_summary AS
SELECT
  s.id,
  s.name,
  COUNT(CASE WHEN a.status = 'present' THEN 1 END) as classes_attended,
  COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as classes_missed,
  COUNT(CASE WHEN a.status = 'excused' THEN 1 END) as excused_absences,
  COUNT(*) as total_classes,
  ROUND(COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / COUNT(*), 1) as attendance_rate
FROM students s
JOIN attendance a ON s.id = a.student_id
GROUP BY s.id, s.name;

-- Recent evaluations with scores
CREATE VIEW IF NOT EXISTS v_recent_evaluations AS
SELECT
  s.name as student_name,
  e.date,
  e.evaluator,
  e.evaluation_type,
  e.technique_score,
  e.musicality_score,
  e.performance_score,
  e.overall_score,
  e.strengths,
  e.growth_areas
FROM evaluations e
JOIN students s ON e.student_id = s.id
ORDER BY e.date DESC;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update students.updated_at on modification
CREATE TRIGGER IF NOT EXISTS update_student_timestamp
AFTER UPDATE ON students
BEGIN
  UPDATE students SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample students
INSERT OR IGNORE INTO students (id, name, birth_date, enrollment_date, current_level, primary_style, status)
VALUES
  (1, 'Emma Rodriguez', '2013-05-12', '2023-09-01', 'intermediate', 'ballet', 'active'),
  (2, 'Sophia Chen', '2014-08-23', '2024-01-15', 'beginner-intermediate', 'jazz', 'active'),
  (3, 'Olivia Martinez', '2012-03-15', '2022-09-01', 'advanced', 'contemporary', 'active'),
  (4, 'Ava Thompson', '2015-11-08', '2024-09-01', 'beginner', 'ballet', 'active'),
  (5, 'Mia Johnson', '2013-07-19', '2023-09-01', 'intermediate', 'jazz', 'active');

-- Insert sample classes
INSERT OR IGNORE INTO classes (id, name, style, level, day_of_week, time_start, time_end, instructor, studio_room, max_capacity)
VALUES
  (1, 'Intermediate Ballet', 'ballet', 'intermediate', 'Tuesday', '17:00', '18:00', 'Miss Sarah', 'Studio A', 15),
  (2, 'Intermediate Ballet', 'ballet', 'intermediate', 'Thursday', '17:00', '18:00', 'Miss Sarah', 'Studio A', 15),
  (3, 'Beginning Jazz', 'jazz', 'beginner', 'Monday', '16:00', '17:00', 'Mr. David', 'Studio B', 12),
  (4, 'Intermediate Jazz', 'jazz', 'intermediate', 'Wednesday', '18:00', '19:00', 'Mr. David', 'Studio B', 15),
  (5, 'Advanced Contemporary', 'contemporary', 'advanced', 'Friday', '19:00', '20:30', 'Miss Lisa', 'Studio A', 12);

-- Insert sample enrollments
INSERT OR IGNORE INTO enrollments (student_id, class_id, enrollment_date, status)
VALUES
  (1, 1, '2023-09-01', 'active'),
  (1, 2, '2023-09-01', 'active'),
  (2, 3, '2024-01-15', 'active'),
  (3, 5, '2022-09-01', 'active'),
  (4, 1, '2024-09-01', 'active'),
  (5, 4, '2023-09-01', 'active');

-- Insert sample evaluation
INSERT OR IGNORE INTO evaluations (id, student_id, date, evaluator, evaluation_type, technique_score, musicality_score, performance_score, overall_score, strengths, growth_areas)
VALUES
  (1, 1, '2025-11-01', 'Miss Sarah', 'semester', 8, 9, 8, 8,
   'Excellent posture and turnout. Strong musicality. Beautiful port de bras.',
   'Work on spotting in pirouettes. Strengthen for double turns. Practice jumps with softer landings.');

-- ============================================================================
-- DATABASE INITIALIZATION COMPLETE
-- ============================================================================

-- Verify schema
SELECT 'Database schema initialized successfully' as status;
SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table';

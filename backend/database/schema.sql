-- LectureLog Smart Attendance database schema
-- MySQL 8+

CREATE DATABASE IF NOT EXISTS smart_attendance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_attendance;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('HOD', 'FACULTY', 'STUDENT') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_students_user (user_id),
  CONSTRAINT fk_students_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS faculty (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_faculty_user (user_id),
  CONSTRAINT fk_faculty_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subjects (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_code VARCHAR(30) NOT NULL,
  subject_name VARCHAR(150) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subjects_code (subject_code)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS lectures (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  subject_id INT UNSIGNED NOT NULL,
  faculty_id INT UNSIGNED NOT NULL,
  lecture_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lectures_faculty_date (faculty_id, lecture_date, start_time),
  KEY idx_lectures_subject (subject_id),
  CONSTRAINT fk_lectures_subject
    FOREIGN KEY (subject_id) REFERENCES subjects (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_lectures_faculty
    FOREIGN KEY (faculty_id) REFERENCES faculty (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT chk_lectures_time_order CHECK (end_time > start_time)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS qr_sessions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  lecture_id INT UNSIGNED NOT NULL,
  session_token CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_qr_sessions_token (session_token),
  KEY idx_qr_sessions_lecture_expiry (lecture_id, expires_at),
  CONSTRAINT fk_qr_sessions_lecture
    FOREIGN KEY (lecture_id) REFERENCES lectures (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS attendance (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  lecture_id INT UNSIGNED NOT NULL,
  student_id INT UNSIGNED NOT NULL,
  status ENUM('PRESENT', 'ABSENT') NOT NULL DEFAULT 'PRESENT',
  attendance_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attendance_lecture_student (lecture_id, student_id),
  KEY idx_attendance_student_time (student_id, attendance_time),
  CONSTRAINT fk_attendance_lecture
    FOREIGN KEY (lecture_id) REFERENCES lectures (id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_attendance_student
    FOREIGN KEY (student_id) REFERENCES students (id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- Required reference data for the faculty Create Lecture form.
-- Add more subjects as needed.
INSERT INTO subjects (subject_code, subject_name)
VALUES ('DEMO-101', 'Demo Subject')
ON DUPLICATE KEY UPDATE subject_name = VALUES(subject_name);

-- Example account workflow (do not use these values in production):
-- 1. Register users through POST /register.
-- 2. Link student users: INSERT INTO students (user_id) VALUES (<student_user_id>);
-- 3. Link faculty users: INSERT INTO faculty (user_id) VALUES (<faculty_user_id>);
-- 4. Create lectures through POST /lectures/create or insert them after linking faculty.

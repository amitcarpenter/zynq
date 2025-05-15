CREATE TABLE tbl_admin (
  admin_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  full_name VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  email VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  password VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  mobile_number VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  fcm_token VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  profile_image VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  language VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  jwt_token VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  is_push_notification_on TINYINT(1) NOT NULL DEFAULT 1,
  is_location_on TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_mobile_number (mobile_number)
);

CREATE TABLE tbl_users (
  user_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  password VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  full_name VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  age INT,
  gender VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  mobile_number VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  fcm_token VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  otp VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  profile_image VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  language VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  jwt_token VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 0,
  is_push_notification_on TINYINT(1) NOT NULL DEFAULT 1,
  is_location_on TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY idx_mobile_number (mobile_number)
);

CREATE TABLE tbl_face_scan_results (
  face_scan_result_id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  skin_type VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  skin_concerns VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  face VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  details LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  user_id VARCHAR(36) NOT NULL,
  CONSTRAINT fk_face_scan_user FOREIGN KEY (user_id) REFERENCES tbl_users(user_id)
);


CREATE TABLE tbl_clinics (
  clinic_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  clinic_name VARCHAR(255) COLLATE utf8mb4_0900_ai_ci NOT NULL,
  org_number VARCHAR(50) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  email VARCHAR(255) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  mobile_number VARCHAR(50) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  address TEXT COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  is_invited TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 0,
  onboarding_token VARCHAR(255) COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  profile_completion_percentage INT DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  email_sent_at TIMESTAMP NULL DEFAULT NULL
);



CREATE TABLE tbl_clinic_operation_hours (
  clinic_operation_hours_id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(36) NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday') NOT NULL,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES tbl_clinics(clinic_id) ON DELETE CASCADE
);


CREATE TABLE tb_clinic_locations (
  clinic_location_id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(36) NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zip_code VARCHAR(20) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES tbl_clinics(clinic_id) ON DELETE CASCADE
);


CREATE TABLE tbl_clinic_documents (
  clinic_document_id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(36) NOT NULL,
  document_type ENUM('legal', 'certification') NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES tbl_clinics(clinic_id) ON DELETE CASCADE
);


CREATE TABLE tbl_clinic_services (
  clinic_service_id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(36) NOT NULL,
  service_name VARCHAR(255),
  service_type  VARCHAR(255),
  service_for_skintype VARCHAR(255),
  min_fee DECIMAL(10, 2),
  max_fee DECIMAL(10, 2),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES tbl_clinics(clinic_id) ON DELETE CASCADE
);


CREATE TABLE tbl_treatments (
  treatment_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);


CREATE TABLE tbl_clinic_treatments (
  clinic_treatment_id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(36) NOT NULL,
  treatment_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES tbl_clinics(clinic_id) ON DELETE CASCADE,
  FOREIGN KEY (treatment_id) REFERENCES tbl_treatments(treatment_id) ON DELETE CASCADE
);


CREATE TABLE tbl_equipments (
  equipment_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);


CREATE TABLE tbl_clinic_equipments (
  clinic_equipment_id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(36) NOT NULL,
  equipment_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES tbl_clinics(clinic_id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES tbl_equipments(equipment_id) ON DELETE CASCADE
);


CREATE TABLE tbl_skin_types (
	skin_type_id INT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(100) NOT NULL UNIQUE
);


CREATE TABLE tbl_clinic_skin_types (
  clinic_skin_type_id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(36) NOT NULL,
  skin_type_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES tbl_clinics(clinic_id) ON DELETE CASCADE,
  FOREIGN KEY (skin_type_id) REFERENCES tbl_skin_types(skin_type_id) ON DELETE CASCADE
);

CREATE TABLE tbl_severity_levels (
  severity_level_id INT AUTO_INCREMENT PRIMARY KEY,
  level VARCHAR(100) NOT NULL UNIQUE
);


CREATE TABLE tbl_clinic_severity_levels (
  clinic_severity_level_id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(36) NOT NULL,
  severity_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES tbl_clinics(clinic_id) ON DELETE CASCADE,
  FOREIGN KEY (severity_id) REFERENCES tbl_severity_levels(severity_level_id) ON DELETE CASCADE
);



CREATE TABLE tbl_doctors (
    doctor_id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100),
    specialization VARCHAR(100),
    employee_id VARCHAR(20) UNIQUE,
    experience_years INT,
    rating DECIMAL(2,1),
    fee_per_session DECIMAL(10,2),
    phone VARCHAR(20),
    email VARCHAR(100),
    age INT,
    address TEXT,
	  biography TEXT,
    gender ENUM('Male', 'Female', 'Other'),
    profile_image TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );


CREATE TABLE tbl_doctor_experiences (
    experience_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id VARCHAR(36),
    title VARCHAR(100),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES tbl_doctors(doctor_id) ON DELETE CASCADE
);


CREATE TABLE tbl_doctor_educations (
    education_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id VARCHAR(36),
    degree VARCHAR(100),
    institution VARCHAR(150),
    start_year YEAR,
    end_year YEAR,
    education_type ENUM('UG', 'PG'),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES tbl_doctors(doctor_id) ON DELETE CASCADE
);


CREATE TABLE tbl_products (
  product_id INT AUTO_INCREMENT PRIMARY KEY,
  clinic_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  rating FLOAT DEFAULT 0,
  short_description TEXT,
  full_description TEXT,
  feature_text VARCHAR(255) NOT NULL,
  size_label VARCHAR(50) NOT NULL,
  image_url VARCHAR(255),
  benefit_text VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES tbl_clinics(clinic_id) ON DELETE CASCADE
);


CREATE TABLE tbl_product_usage_instructions (
  instruction_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  step_number INT NOT NULL,
  instruction_text TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES tbl_products(product_id) ON DELETE CASCADE
);


CREATE TABLE tbl_product_reviews (
  review_id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  rating FLOAT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES tbl_products(product_id)
);


CREATE TABLE tbl_appointments (
    appointment_id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id VARCHAR(36),
    patient_id VARCHAR(36) NOT NULL,
    clinic_id VARCHAR(36),
    appointment_date DATE,
    start_time TIME,
    end_time TIME,
    type ENUM('Offline', 'Video Call'),
    status ENUM('Upcoming', 'Completed', 'Rescheduled', 'Cancelled'),
    fee DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES tbl_doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES tbl_users(user_id),
    FOREIGN KEY (clinic_id) REFERENCES tbl_clinics(clinic_id) ON DELETE CASCADE
);


CREATE TABLE tbl_doctor_reviews (
    doctor_review_id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_id INT,
    doctor_id VARCHAR(36),
    clinic_id VARCHAR(36),
    patient_id VARCHAR(36) NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES tbl_appointments(appointment_id),
    FOREIGN KEY (doctor_id) REFERENCES tbl_doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES tbl_users(user_id),
	  FOREIGN KEY (clinic_id) REFERENCES tbl_clinics(clinic_id) ON DELETE CASCADE
);


CREATE TABLE tbl_support_tickets (
    ticket_id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date_raised DATE NOT NULL,
    issue_category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('Pending', 'Resolved') NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE tbl_doctor_clinic_map (
  map_id INT AUTO_INCREMENT PRIMARY KEY,
  doctor_id VARCHAR(36) NOT NULL,
  clinic_id VARCHAR(36) NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES tbl_doctors(doctor_id) ON DELETE CASCADE,
  FOREIGN KEY (clinic_id) REFERENCES tbl_clinics(clinic_id) ON DELETE CASCADE
);

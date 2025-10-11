DROP DATABASE IF EXISTS DBMSproject;
CREATE DATABASE DBMSproject;
USE DBMSproject;

CREATE TABLE user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE,
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  google_id VARCHAR(255)
);

CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    body TEXT NOT NULL,
    issued_by VARCHAR(100) NOT NULL
);

CREATE TABLE question (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question TEXT NOT NULL,
    option1 TEXT NOT NULL,
    option2 TEXT NOT NULL,
    option3 TEXT NOT NULL,
    option4 TEXT NOT NULL,
    answer ENUM('A','B','C','D') NOT NULL
);

CREATE TABLE test (
    id INT AUTO_INCREMENT PRIMARY KEY,
    testName VARCHAR(100) NOT NULL,
    startTime DATETIME NOT NULL,
    duration INT UNSIGNED NOT NULL,
    numberOfQues INT UNSIGNED NOT NULL,
    eachQuesMarks INT UNSIGNED NOT NULL,
    -- totalMarks INT GENERATED ALWAYS AS (numberOfQues * eachQuesMarks) STORED -- derived attribute
    totalMarks INT UNSIGNED NOT NULL
);

CREATE TABLE test_has_ques (
    testid INT NOT NULL,
    questionid INT NOT NULL,
    PRIMARY KEY (testid, questionid),
    FOREIGN KEY (testid) REFERENCES test(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (questionid) REFERENCES question(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE result(
    id INT AUTO_INCREMENT PRIMARY KEY,
    userid INT NOT NULL,
    testid INT NOT NULL,
    score INT UNSIGNED DEFAULT 0,
    FOREIGN KEY (testid) REFERENCES test(id),
    FOREIGN KEY (userid) REFERENCES user(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE(userid,testid)
);

CREATE TABLE submission (
    resultid INT NOT NULL,
    questionid INT NOT NULL,
    selected ENUM('A', 'B', 'C', 'D'),
    status BOOLEAN NOT NULL,
    PRIMARY KEY (resultid, questionid),
    FOREIGN KEY (resultid) REFERENCES result(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (questionid) REFERENCES question(id)
);

CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    adminUserName VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- CREATING TRIGGERS
DELIMITER $$

CREATE TRIGGER update_score_after_submission
AFTER INSERT ON submission
FOR EACH ROW
BEGIN
    DECLARE marks INT;
    DECLARE testId INT;

    -- Only add to score if the submission was correct
    IF NEW.status = TRUE THEN
        -- Get the test id for this result
        SELECT testid INTO testId
        FROM result
        WHERE id = NEW.resultid;

        -- Get the marks for each question from the test
        SELECT eachQuesMarks INTO marks
        FROM test
        WHERE id = testId;

        -- Update the score in result table
        UPDATE result
        SET score = score + marks
        WHERE id = NEW.resultid;
    END IF;
END$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER calculate_totalmarks_before_insert
BEFORE INSERT ON test
FOR EACH ROW
BEGIN
    SET NEW.totalMarks = NEW.numberOfQues * NEW.eachQuesMarks;
END$$

DELIMITER ;



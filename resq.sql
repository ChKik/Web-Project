DROP DATABASE if exists ResQ;
CREATE DATABASE ResQ;
USE ResQ ;
SET NAMES 'utf8';
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '4655';
SELECT 
    CONCAT('ALTER TABLE `', TABLE_NAME, '` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;') AS alterStatement
FROM 
    information_schema.TABLES
WHERE 
    TABLE_SCHEMA = 'ResQ';



CREATE TABLE IF NOT EXISTS base(
    base_username VARCHAR(25) NOT NULL,
    base_region VARCHAR(25) NOT NULL,
    base_announcment VARCHAR(250) NOT NULL,
    PRIMARY KEY (base_username)
);

CREATE TABLE IF NOT EXISTS worker(
	wrk_id INT(9) NOT NULL AUTO_INCREMENT,
	wrk_name VARCHAR(25) NOT NULL  DEFAULT 'not defined',
	wrk_lname VARCHAR(25) NOT NULL DEFAULT 'not defined',
	PRIMARY KEY(wrk_id)
);

CREATE TABLE tasks (
    task_id INT(9) AUTO_INCREMENT , -- Requests and Offers 
    task_description VARCHAR(255),
    task_type ENUM('Request','Offer'),
    PRIMARY KEY(task_id)
);

CREATE TABLE vehicles (
    vehicle_username VARCHAR(50) DEFAULT 'vehicle000' NOT NULL,
    vehicle_available BOOLEAN NOT NULL,
    active_tasks BOOLEAN NOT NULL,
    PRIMARY KEY (vehicle_username) 
);

CREATE TABLE IF NOT EXISTS citizen(
	citizen_id INT(9) AUTO_INCREMENT,
	username_citizen VARCHAR(35) DEFAULT 'user' NOT NULL,
	password_citizen VARCHAR(35) DEFAULT 'password' NOT NULL,
	citizen_name VARCHAR(25) NOT NULL,
	citizen_lname VARCHAR(25) NOT NULL,
	ph_number CHAR(15) NOT NULL,
    citizen_region VARCHAR(25) DEFAULT 'not defined' NOT NULL,
	PRIMARY KEY (citizen_id,username_citizen)
);

CREATE TABLE IF NOT EXISTS rescuer(
	rescuer_id INT(9) NOT NULL ,
	username_res VARCHAR(35) DEFAULT 'user' NOT NULL,
	password_res VARCHAR(35) DEFAULT 'password' NOT NULL,
	task_number INT(9) DEFAULT 0 NOT NULL,
    res_vehicle_username VARCHAR(50) DEFAULT 'vehicle000' NOT NULL,
    destination_base FLOAT(50) DEFAULT 0.0 NOT NULL,
	PRIMARY KEY (rescuer_id,username_res),
	CONSTRAINT RESCUER
	FOREIGN KEY(rescuer_id) REFERENCES worker(wrk_id)
	ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY(res_vehicle_username) REFERENCES vehicles(vehicle_username)
	ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS rescuer_tasks (
    rescuer_id INT(9) NOT NULL,
    task_id INT(9) NOT NULL,
    PRIMARY KEY (rescuer_id, task_id),
    FOREIGN KEY (rescuer_id) REFERENCES rescuer(rescuer_id)
	ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(task_id)
	ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS admin(
	 admin_id INT(9) NOT NULL,
	 username_adm VARCHAR(35) DEFAULT 'user' NOT NULL,
	 password_adm VARCHAR(35) DEFAULT 'password' NOT NULL,
	 PRIMARY KEY (admin_id,username_adm),
	 CONSTRAINT ADMIN
	 FOREIGN KEY(admin_id) REFERENCES worker(wrk_id)
	 ON DELETE CASCADE ON UPDATE CASCADE 
 );
 
CREATE TABLE IF NOT EXISTS requests (
    req_task_id INT(9) NOT NULL,
    req_citizen_id INT(9) NOT NULL,
    req_date_record DATETIME NOT NULL,
    req_date_withdraw DATETIME ,
    req_quantity FLOAT(9) NOT NULL,
    req_vehicle_username VARCHAR(50),
    PRIMARY KEY (req_task_id),
    CONSTRAINT REQUEST
	FOREIGN KEY (req_task_id) REFERENCES tasks(task_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (req_citizen_id) REFERENCES citizen(citizen_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (req_vehicle_username) REFERENCES vehicles(vehicle_username)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS offers (
    offer_task_id INT(9) NOT NULL AUTO_INCREMENT,
    offer_citizen_id INT(9) NOT NULL,
    offer_date_record DATETIME NOT NULL,
    offer_date_withdraw DATETIME,
    offer_quantity FLOAT(9) NOT NULL,
	offer_vehicle_username VARCHAR(50),
    PRIMARY KEY (offer_task_id),
    CONSTRAINT OFFER
    FOREIGN KEY (offer_task_id) REFERENCES tasks(task_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (offer_citizen_id) REFERENCES citizen(citizen_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (offer_vehicle_username) REFERENCES vehicles(vehicle_username)
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS pharmacy (
    pharm_id INT(9) NOT NULL AUTO_INCREMENT ,
    pharm_category VARCHAR(255),
    pharm_item_name VARCHAR(255),
    PRIMARY KEY (pharm_id)
);

CREATE TABLE IF NOT EXISTS consumable (
    cons_id INT(9) NOT NULL AUTO_INCREMENT ,
    cons_category VARCHAR(255),
    cons_item_name VARCHAR(255),
    PRIMARY KEY (cons_id)
);

CREATE TABLE IF NOT EXISTS housing (
    housing_id INT(9) NOT NULL AUTO_INCREMENT ,
    housing_category VARCHAR(255),
	housing_item_name VARCHAR(255),
	PRIMARY KEY (housing_id)
);

CREATE TABLE IF NOT EXISTS products (
    prod_id INT NOT NULL AUTO_INCREMENT ,
    prod_category VARCHAR(255),
    prod_item_name VARCHAR(255),
    PRIMARY KEY (prod_id)
);

INSERT INTO base VALUES 
	('Βάση Α', 'Volos', 'Χρειαζόμαστε X στην περιοχή της Λάρισας.');
    
INSERT INTO worker  VALUES
    (null,'Αναστασία', 'Σουλελέ'),
    (null,'Βασιλική', 'Νασιέλη'),
    (null,'Χαρίτων', 'Κικίδης'),
    (null,'Παναγιώτης', 'Ζάγκος'),
    (null,'Αναστάσης', 'Κιουτσιούκης'),
    (null,'Κωσταντίνος', 'Βασιλακόπουλος'),
    (null,'Πασχάλης', 'Βενετίδης'),
    (null,'Νικολία', 'Φίλια'),
    (null,'Πολυξένη', 'Τσιργιάννη'),
    (null,'Ελευθερία', 'Ευσταθείου');
    

INSERT INTO tasks VALUES 
	(null, 'Ολοκλήρωση ελέγχου αποθεμάτων', 'Request'),
	(null, 'Παράδοση τροφοδοσίας φαγητού στη Βάση Α', 'Offer'),
	(null, 'Βοήθεια πολιτών με αιτήματα στέγασης στην περιοχή του Αλμυρού', 'Request'),
	(null, 'Η περιοχή του Αλμυρού χρειάζεται 500 φάρμακα και 200 κουβέρτες', 'Request'),
	(null, 'Συλλογή ειδών πρώτης ανάγκης για τους πληγέντες', 'Offer'),
	(null, 'Καταγραφή αναγκών πληθυσμού στην περιοχή Αθηνών', 'Request'),
	(null, 'Διανομή νερού και τροφίμων στους πληγέντες', 'Offer'),
	(null, 'Συλλογή ιατρικού υλικού για τα νοσοκομεία', 'Request'),
	(null, 'Ανακούφιση πολιτών από τις πλημμύρες', 'Offer'),
	(null, 'Αποκατάσταση ηλεκτροδοτήσεων στα κατεστραμμένα σπίτια', 'Offer'),
	(null, 'Παροχή ψυχολογικής στήριξης στα πληγέντα παιδιά', 'Request'),
	(null, 'Εκκένωση κινδυνεύοντων περιοχών', 'Request'),
	(null, 'Διάσωση παγιδευμένων ατόμων από τα νερά', 'Offer'),
	(null, 'Καθαρισμός από ερείπια και λάσπη', 'Request'),
	(null, 'Εφοδιασμός με είδη προστασίας', 'Offer'),
	(null, 'Συντήρηση και επισκευή καταστραμμένων δρόμων', 'Offer'),
	(null, 'Επαναφορά ηλεκτροδοτήσεων στην περιοχή Θεσσαλονίκης', 'Request'),
	(null, 'Διάνοιξη εκκένωσης δρόμου προς την περιοχή Κρήτης', 'Request'),
	(null, 'Παροχή ιατρικής βοήθειας στην περιοχή Πειραιά', 'Request'),
	(null, 'Καταγραφή αναγκών πληθυσμού στην περιοχή Πάτρας', 'Request'),
	(null, 'Συγκέντρωση ειδών πρώτης ανάγκης για τους πληγέντες', 'Offer'),
	(null, 'Κατασκευή προσωρινών κατοικιών στην περιοχή Βόλου', 'Request'),
	(null, 'Παροχή ψυχολογικής στήριξης στην περιοχή Καλαμάτας', 'Request'),
    (null,'Ανακούφιση πολιτών από τις πλημμύρες','Request'),
	(null,'Συλλογή και διανομή ρούχων σε περιοχές με ανάγκη','Request');

INSERT INTO vehicles VALUES 
    ('vehicle000', false,false), -- Available , Enable Tasks
	('vehicle001', true,false),
	('vehicle002', true,false),
	('vehicle003', true,false),
    ('vehicle004', true,false),
    ('vehicle005', true,false),
    ('vehicle006', true,false),
    ('vehicle007', true,false),
    ('vehicle008', true,false);
    
INSERT INTO citizen VALUES 
	(null, 'kostaskont', 'Kostas2002@', 'Κωσταντίνος', 'Κονταρίδης', '6949537804','Πάτρα'),
	(null, 'mariapap', 'Maria1998@', 'Μαρία', 'Παπαδάκη', '6949537805','Αθήνα'),
	(null, 'giorgosbour', 'Giorgos1996@', 'Γιώργος', 'Βουρλούμης', '6949537806','Βόλος'),
	(null, 'tatianasoul', 'Tatsoul1996@', 'Τατιάνα', 'Σουλελέ', '6949537807','Θεσσαλονίκη'),
	(null, 'nickmav', 'Nikosmav4@', 'Νικόλας', 'Μαυριάς', '6949537808','Πάτρα'),
	(null, 'billmpar', 'Kenobill1#', 'Βασίλης', 'Μπαρδάκης', '6949537809','Λάρισα'),
	(null, 'theoplat', 'Platonas33#', 'Θεόδωρος', 'Πλάτωνας', '6949537810','Λάρισα'),
	(null, 'andreassoul', 'Souleles123$', 'Ανδρέας', 'Σουλελές', '6949537811','Λάρισα'),
	(null, 'ioaschoina', 'Schoina2002@', 'Ιωάννα', 'Σχοινά', '6949537812','Λαμία'),
	(null, 'staurosmpa', 'Staurosmpa23@', 'Σταύρος', 'Μπαντζής', '6949537813','Αλμυρός'),
	(null, 'mirtokost', 'Mirtokost99@', 'Μυρτώ', 'Κωστούλια', '6949537814', 'Αθήνα'),
	(null, 'minadiam', 'MinaDiam123#', 'Γερασιμίνα', 'Διαμαντάτου', '6949537815','Καρδίτσα'),
	(null, 'ioanalmt', 'Ioanna345@', 'Ιωάννα', 'Λυμιώτη', '6949537816','Πάτρα'),
	(null, 'andrianamix', 'AndrianaMix2', 'Ανδριάνα', 'Μιχαλοπούλου', '6949537817','Αθήνα'),
	(null, 'hliaszagk', 'HliasZagk5#', 'Ηλίας', 'Ζάγκος', '6949537818','Βόλος'),
	(null, 'alexpanag', 'Alexpanag&2', 'Αλεξάνδρα', 'Πανάγου', '6949537819','Πάτρα');
    

INSERT INTO rescuer VALUES
    (1,'anastasiasoulele','Resq1@',4,'vehicle001',5000.0),
    (2,'vasilikinasieli','Resq2@',4,'vehicle002',5000.0),
    (3,'charitonkikidis','Resq3@',4,'vehicle003',5000.0),
    (4,'panagiotiszagkos','Resq4@',4,'vehicle004',5000.0),
    (5,'anastasis_kioutsioukis','Resq5@',3,'vehicle005',5000.0),
    (6,'kostvasilakopoulos','Resq6@',3,'vehicle006',5000.0),
    (7,'pasxalisven', 'Resq7@',3,'vehicle007',5000.0),
    (8,'nikoliafilia','Resq8@',0,'vehicle008',5000.0);
    

INSERT INTO rescuer_tasks VALUES 
   (1,1), -- Rescuer 1 assigned to Task 1
   (1,2),
   (1,3),
   (1,4),
   (2,5),
   (2,6),
   (2,7),
   (2,8),
   (3,9),
   (3,10),
   (3,11),
   (3,12),
   (4,13),
   (4,14),
   (4,15),
   (4,16),
   (5,17),
   (5,18),
   (5,19),
   (6,20),
   (6,21),
   (6,22),
   (7,23),
   (7,24),
   (7,25);
   
   

INSERT INTO admin VALUES 
    (9,'poltsirgiani', 'Admin1@'),
    (10,'eleutheriaeustatheiou', 'Admin2@'),
    (1,'user','password');
    
    
INSERT INTO requests VALUES 
	(1,1,'2023-01-01 08:00:00', '2023-01-02 12:00:00', 10.5,'vehicle001'),
    (3,1,'2023-01-01 09:00:00', '2023-01-02 12:00:00',10.0,'vehicle001'),
	(4,1,'2023-01-01 09:30:00', '2023-01-02 12:00:00',15.5,'vehicle001'),
    (6,1,'2023-01-01 09:40:00', '2023-01-02 12:00:00',20.0,'vehicle001'),
	(8,2,'2023-01-15 10:30:00', '2023-01-16 14:45:00', 8.0,'vehicle002'),
    (11,2,'2023-01-15 11:30:00', '2023-01-16 14:45:00', 10.0,'vehicle002'),
    (12,2,'2023-01-15 12:00:00', '2023-01-16 14:45:00', 15.0,'vehicle002'),
    (14,2,'2023-01-15 12:30:00', '2023-01-16 14:45:00', 23.5,'vehicle002'),
	(17,3,'2023-01-16 14:00:00', '2023-01-16 18:30:00', 12.5,'vehicle003'),
    (18,3,'2023-01-16 14:30:00', '2023-01-16 18:30:00', 10.0,'vehicle003'),
    (19,3,'2023-01-16 14:45:00', '2023-01-16 18:30:00', 1.5,'vehicle003'),
    (20,3,'2023-01-16 15:00:00', '2023-01-16 18:30:00', 2.5,'vehicle003'),
    (22,4,'2023-01-20 14:00:00', '2023-01-21 18:30:00', 11.2,'vehicle004'),
    (23,5,'2023-01-21 14:00:00', '2023-01-22 18:30:00', 1.2,'vehicle005'),
    (24,6,'2023-01-22 12:00:00', '2023-01-23 12:00:00', 2.5,'vehicle005'),
    (25,7,'2023-01-22 12:00:00',  null , 3.5 , default);
    
    
INSERT INTO offers VALUES 
    (2,8,'2023-01-01 08:00:00', '2023-01-02 12:00:00',10.5,'vehicle004'),
	(5,8,'2023-01-01 08:02:40', '2023-01-02 12:30:00',20.0,'vehicle004'),
	(7,8,'2023-01-02 09:00:00', '2023-01-02 15:00:00',9.0,'vehicle004'),
	(9,9,'2023-01-03 11:00:00', '2023-01-03 13:00:00',15.5,'vehicle005'),
	(10,9,'2023-01-04 08:00:00', null , 11.0 , default),
	(13,9,'2023-01-05 10:00:00', '2023-01-06 12:00:00',3.5,'vehicle006'),
    (15,10,'2023-01-01 08:00:00', '2023-01-02 12:00:00',10.5,'vehicle006'),
    (16,11,'2023-01-01 08:00:00', '2023-01-02 12:00:00',10.5,'vehicle007'),
    (21,12,'2023-01-01 08:00:00', '2023-01-02 12:00:00',10.5,'vehicle007');

SELECT * FROM admin ;
select * from tasks;
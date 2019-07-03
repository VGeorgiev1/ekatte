CREATE TABLE IF NOT EXISTS Areas(
    name CHAR(3) PRIMARY KEY NOT NULL,
    ekatte CHAR(5),
    area_name VARCHAR(20),
    region CHAR(4)
);
CREATE TABLE IF NOT EXISTS Municipalities(
    name CHAR(5) PRIMARY KEY NOT NULL,
    ekatte CHAR(5),
    municipality_name VARCHAR(20),
    area CHAR(3),
    FOREIGN KEY(area) references Areas(name)
);
CREATE TABLE IF NOT EXISTS Localities(
    ekatte CHAR(5) PRIMARY KEY NOT NULL,
    name VARCHAR(30),
    municipality CHAR(5),
    type VARCHAR(5),
    FOREIGN KEY(municipality) REFERENCES Municipalities(name)
);
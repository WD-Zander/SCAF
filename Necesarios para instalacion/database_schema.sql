-- SCAF Database Schema & Seed Data
-- Creado por: Antigravity utilizando sqlserver-expert skill

CREATE DATABASE SCAF_DB;
GO

USE SCAF_DB;
GO

-- 1. Roles & Usuarios
CREATE TABLE Roles (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Permissions VARCHAR(MAX) -- JSON array of permissions
);

CREATE TABLE Users (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    RoleId VARCHAR(50) FOREIGN KEY REFERENCES Roles(Id)
);

-- 2. Proveedores
CREATE TABLE Suppliers (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(150) NOT NULL,
    Contact VARCHAR(100),
    Phone VARCHAR(50),
    Email VARCHAR(100),
    Address VARCHAR(255)
);

-- 3. Catálogos (Ficheros)
CREATE TABLE AssetCategories (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    ParentId VARCHAR(50) NULL FOREIGN KEY REFERENCES AssetCategories(Id)
);

CREATE TABLE Organization (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    ParentId VARCHAR(50) NULL FOREIGN KEY REFERENCES Organization(Id)
);

CREATE TABLE MaintenanceTypes (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(100) NOT NULL
);

-- 4. Inventario de Activos
CREATE TABLE Assets (
    Id VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(150) NOT NULL,
    Brand VARCHAR(100),
    Model VARCHAR(100),
    Serial VARCHAR(100) UNIQUE,
    Status VARCHAR(50),
    Description NVARCHAR(MAX),
    CategoryId VARCHAR(50) FOREIGN KEY REFERENCES AssetCategories(Id),
    DepartmentId VARCHAR(50) FOREIGN KEY REFERENCES Organization(Id),
    CustodioId VARCHAR(50) FOREIGN KEY REFERENCES Users(Id),
    SupplierId VARCHAR(50) FOREIGN KEY REFERENCES Suppliers(Id),
    EntryDate DATE,
    AcquisitionCost DECIMAL(18,2)
);

-- 5. Mantenimientos (Pasaporte del Activo)
CREATE TABLE Maintenances (
    Id VARCHAR(50) PRIMARY KEY,
    AssetId VARCHAR(50) NOT NULL FOREIGN KEY REFERENCES Assets(Id),
    Title VARCHAR(200) NOT NULL,
    TypeId VARCHAR(50) FOREIGN KEY REFERENCES MaintenanceTypes(Id),
    ProviderId VARCHAR(50) NULL FOREIGN KEY REFERENCES Suppliers(Id),
    AssignedUserId VARCHAR(50) FOREIGN KEY REFERENCES Users(Id),
    StartDate DATE NOT NULL,
    EndDate DATE NULL,
    Status VARCHAR(50) NOT NULL, -- PENDIENTE, EN PROGRESO, COMPLETADO
    Cost DECIMAL(18,2),
    Description NVARCHAR(MAX)
);
GO

-- =========================================
-- DATOS DE PRUEBA (SEED)
-- =========================================

-- Roles
INSERT INTO Roles (Id, Name, Permissions) VALUES 
('SUPERADMIN', 'Super Administrador', '["dashboard","inventory","suppliers","assignments","files","settings","maintenances"]'),
('GESTOR', 'Gestor de Activos', '["dashboard","inventory","suppliers","assignments","maintenances"]'),
('AUDITOR', 'Auditor de Sistemas', '["dashboard","inventory","suppliers","maintenances"]');

-- Usuarios
INSERT INTO Users (Id, Name, Email, RoleId) VALUES 
('U001', 'Admin MVP', 'admin@scaf.com', 'SUPERADMIN'),
('U002', 'Carlos Gestor', 'carlos@scaf.com', 'GESTOR'),
('U003', 'Ana Auditora', 'ana@scaf.com', 'AUDITOR');

-- Proveedores
INSERT INTO Suppliers (Id, Name, Contact, Phone, Email, Address) VALUES 
('PRV-001', 'Tech Solutions C.A.', 'Juan Pérez', '+58 414-1234567', 'ventas@techsol.com', 'Torre Empresarial Norte'),
('PRV-002', 'Muebles y Diseños', 'Maria García', '+58 412-9876543', 'contacto@mueblesd.com', 'Zona Industrial Sur');

-- Categorías Mantenimiento
INSERT INTO MaintenanceTypes (Id, Name) VALUES 
('MT-TYPE-1', 'Mantenimiento Preventivo'),
('MT-TYPE-2', 'Mantenimiento Correctivo'),
('MT-TYPE-3', 'Calibración de Equipos'),
('MT-TYPE-4', 'Inspección Rutinaria');

-- Ficheros: Categorías Activos
INSERT INTO AssetCategories (Id, Name, ParentId) VALUES 
('C1', 'Equipos de Cómputo', NULL),
('C101', 'Laptops', 'C1'),
('C2', 'Mobiliario', NULL),
('C201', 'Sillas', 'C2');

-- Ficheros: Organización
INSERT INTO Organization (Id, Name, ParentId) VALUES 
('ORG1', 'Sede Principal', NULL),
('ORG101', 'Tecnología', 'ORG1'),
('ORG102', 'Administración', 'ORG1');

-- Activos
INSERT INTO Assets (Id, Name, Brand, Model, Serial, Status, CategoryId, DepartmentId, CustodioId, SupplierId, EntryDate, AcquisitionCost) VALUES 
('ACT-001', 'Laptop Dell XPS 15', 'Dell', 'XPS 15 9520', 'SN-XPS9520-2023', 'ACTIVO', 'C101', 'ORG101', 'U002', 'PRV-001', '2023-01-15', 1800.00),
('ACT-002', 'Silla Ergonómica Mesh', 'Steelcase', 'Gesture', 'SC-GES-019', 'ACTIVO', 'C201', 'ORG102', 'U001', 'PRV-002', '2023-05-20', 650.00),
('ACT-003', 'Impresora Multifuncional', 'Brother', 'MFC-L8900CDW', 'BR-8900-3498', 'EN MANTENIMIENTO', 'C1', 'ORG101', 'U002', 'PRV-001', '2022-11-10', 800.00);

-- Mantenimientos
INSERT INTO Maintenances (Id, AssetId, Title, TypeId, ProviderId, AssignedUserId, StartDate, EndDate, Status, Cost) VALUES 
('MT-001', 'ACT-001', 'Limpieza interna y cambio de pasta térmica', 'MT-TYPE-1', 'PRV-001', 'U002', '2023-11-01', '2023-11-02', 'COMPLETADO', 45.00),
('MT-002', 'ACT-003', 'Cambio de rodillos y tóner', 'MT-TYPE-2', 'PRV-001', 'U002', '2023-11-15', NULL, 'PENDIENTE', 120.00);
GO

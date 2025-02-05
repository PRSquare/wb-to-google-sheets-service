DO
$do$
BEGIN
   IF EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'docker') THEN

      RAISE NOTICE 'Role "docker" already exists. Skipping.';
   ELSE
      CREATE ROLE docker LOGIN PASSWORD '12345678';
   END IF;
END
$do$;

CREATE TABLE
  public.wb_pallet (
    id serial NOT NULL PRIMARY KEY,
    updated_date date NOT NULL UNIQUE,
    dt_next_pallet date NULL,
    dt_till_max date NULL
 );

CREATE TABLE
  public.wb_warehouse (
    id serial NOT NULL PRIMARY KEY,
    pallet_id integer NULL REFERENCES wb_pallet(id), 
    pallet_delivery_expr integer NULL,
    pallet_delivery_value_base numeric NULL,
    pallet_delivery_value_liter numeric NULL,
    pallet_storage_expr integer NULL,
    pallet_storage_value_expr numeric NULL,
    warehouse_name text NULL
  );

ALTER TABLE
  public.wb_warehouse
ADD
  CONSTRAINT unique_pallet_id_and_warehouse_name UNIQUE (pallet_id, warehouse_name);



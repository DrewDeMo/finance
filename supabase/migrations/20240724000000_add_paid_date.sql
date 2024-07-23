ALTER TABLE bills ADD COLUMN paid_date DATE;

CREATE OR REPLACE FUNCTION set_paid_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
    NEW.paid_date = CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_paid_date
BEFORE UPDATE ON bills
FOR EACH ROW
EXECUTE FUNCTION set_paid_date();

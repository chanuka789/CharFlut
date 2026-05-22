-- Add soft-delete support for products.
ALTER TABLE "Product" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Allow permanent product deletion to remove dependent order items.
ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_productId_fkey";

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "seat" VARCHAR(4) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "year" VARCHAR(20) NOT NULL,
    "dept" VARCHAR(60) NOT NULL,
    "section" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Ticket_number_key" ON "Ticket"("number");
CREATE UNIQUE INDEX "Ticket_seat_key" ON "Ticket"("seat");

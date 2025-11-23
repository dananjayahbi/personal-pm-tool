-- CreateTable
CREATE TABLE "subtask_images" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "base64Data" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subTaskId" TEXT NOT NULL,

    CONSTRAINT "subtask_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subtask_images_subTaskId_idx" ON "subtask_images"("subTaskId");

-- AddForeignKey
ALTER TABLE "subtask_images" ADD CONSTRAINT "subtask_images_subTaskId_fkey" FOREIGN KEY ("subTaskId") REFERENCES "subtasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

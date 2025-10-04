-- AlterTable
ALTER TABLE "User" ADD COLUMN     "managerId" TEXT;

-- CreateTable
CREATE TABLE "ApprovalPolicy" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "category" TEXT,
    "description" TEXT,
    "isManagerApprover" BOOLEAN NOT NULL DEFAULT false,
    "managerFirst" BOOLEAN NOT NULL DEFAULT false,
    "sequential" BOOLEAN NOT NULL DEFAULT false,
    "minApprovalPercentage" INTEGER,

    CONSTRAINT "ApprovalPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalPolicyApprover" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ApprovalPolicyApprover_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApprovalPolicy_companyId_idx" ON "ApprovalPolicy"("companyId");

-- CreateIndex
CREATE INDEX "ApprovalPolicy_userId_idx" ON "ApprovalPolicy"("userId");

-- CreateIndex
CREATE INDEX "ApprovalPolicyApprover_policyId_idx" ON "ApprovalPolicyApprover"("policyId");

-- CreateIndex
CREATE INDEX "ApprovalPolicyApprover_approverId_idx" ON "ApprovalPolicyApprover"("approverId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalPolicy" ADD CONSTRAINT "ApprovalPolicy_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalPolicy" ADD CONSTRAINT "ApprovalPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalPolicyApprover" ADD CONSTRAINT "ApprovalPolicyApprover_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "ApprovalPolicy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalPolicyApprover" ADD CONSTRAINT "ApprovalPolicyApprover_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

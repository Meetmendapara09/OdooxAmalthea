-- DropForeignKey
ALTER TABLE "public"."ApprovalPolicyApprover" DROP CONSTRAINT "ApprovalPolicyApprover_approverId_fkey";

-- AlterTable
ALTER TABLE "ApprovalPolicyApprover" ADD COLUMN     "approverType" TEXT,
ALTER COLUMN "approverId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ApprovalPolicyApprover" ADD CONSTRAINT "ApprovalPolicyApprover_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

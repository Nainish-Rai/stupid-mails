import { GmailConnection } from "../components/GmailConnection";
import { ClassifiedEmailsList } from "../components/emails/ClassifiedEmailsList";
import { Separator } from "@/components/ui/separator";

export default function DashboardPage() {
  return (
    <div className="container max-w-5xl mx-auto p-4">
      <div className="mb-8">
        <GmailConnection />
      </div>

      <Separator className="my-8" />

      <div>
        <ClassifiedEmailsList />
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal-page-layout";

export const metadata: Metadata = {
  title: "Terms | Studynia",
  description: "Simple guidelines for using the Studynia project.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms"
      description="A few simple guidelines for using the Studynia project."
    >
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Use it thoughtfully</h2>
        <p>
          Studynia is a study workspace for organizing courses, writing notes, practicing with quizzes, and sharing work. Keep your account details private and follow your school&apos;s rules when using it for class.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Only add material you can use</h2>
        <p>
          Make sure you have permission to add or share the files, links, and notes you put in Studynia. You choose who to share notes and results with, so check the recipient before sharing.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">AI quiz results</h2>
        <p>
          AI-generated questions and answers are there to help you practice. They can contain mistakes, so compare them with your course materials and ask your instructor if something looks off.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Keep the workspace safe</h2>
        <p>
          Don&apos;t use Studynia to access someone else&apos;s account, upload harmful files, disrupt the service, or share content you don&apos;t have permission to share.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">A project demo</h2>
        <p>
          Features may change or be unavailable while the project is being developed. Canvas and AI quiz features also rely on services outside Studynia. If you have a question, contact the person or institution that gave you access.
        </p>
      </section>
    </LegalPageLayout>
  );
}
